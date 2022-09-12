import axios from 'axios'
import {GraphQLResolveInfo} from 'graphql'
import {AuthenticationError} from 'apollo-server-core'

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY
const TIYARO_API_KEY = process.env.TIYARO_API_KEY

const DEBUG = process.env.NODE_ENV === 'development'

export interface YoutubeComment {
  comment: string
  publishedAt: string
  likeCount: number
}
export interface YoutubeComments {
  comments: YoutubeComment[]
  nextPageToken: string
}
async function getYoutubeComments(
  videoId: string,
  maxResults: number,
  pageToken: string,
): Promise<YoutubeComments> {
  // order = time (default) or relevance
  // TODO - handle quota exceeded error
  const resp = await axios.get(
    `https://www.googleapis.com/youtube/v3/commentThreads?key=${GOOGLE_API_KEY}&textFormat=plainText&part=snippet&videoId=${videoId}&maxResults=${maxResults}&pageToken=${pageToken}&order=relevance`,
  )
  const {nextPageToken, items} = resp.data
  const comments = items.map((item: any) => {
    const snippet = item.snippet.topLevelComment.snippet
    const {textOriginal: comment, likeCount, publishedAt} = snippet
    return {comment, likeCount, publishedAt}
  })
  return {comments, nextPageToken}
}

// youtube comment analyzer

interface AnalyzeYoutubeCommentsResult {
  comment: string
  publishedAt: string
  likeCount: number
  sentiment: string
  confidence: number
  en?: any
}

interface AnalyzeYoutubeCommentsResults {
  results: AnalyzeYoutubeCommentsResult[]
  nextPageToken: string
}
const MAX_ANALYZE_YT_COMMENTS_RESULTS_COUNT = 10

const watson_supported_to_en_langs = ['ar', 'es', 'fr', 'hi', 'ja', 'pt', 'ru', 'zh']

function getHeaders(headers: any): any {
  if (TIYARO_API_KEY) {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TIYARO_API_KEY}`,
    }
  } else {
    const {authorization, 'x-forwarded-for': fwd} = headers
    return {
      'Content-Type': 'application/json',
      Authorization: authorization,
      'X-Forwarded-For': fwd,
    }
  }
}

async function translate(apiURL: string, input: string, from: string, headers: any): Promise<any> {
  const resp = await axios.post(apiURL, {input}, {headers})
  if (DEBUG) {
    console.log(
      'translate input / response:',
      JSON.stringify({apiURL, input, from, response: resp.data}, null, 2),
    )
  }
  const {translation_text} = resp.data.response[0]
  return {translation_text, from}
}

// for the given youtube video,
//   fetch 10 comments starting from the page token
//   detect the comment language using MS cog text language detect model
//   translate the comments to English if from-lang is supported by watson
//   perform sentiment analysis by running the (translated) comment through huggingface distilbert-base-uncased-finetuned-sst-2-english model
export const analyzeYoutubeComments = async (
  _parent: any,
  args: {videoId: string; pageToken?: string},
  context: any,
  _info: GraphQLResolveInfo,
) => {
  if (DEBUG) {
    console.log(
      `analyzeYoutubeCommentsResolver, attrs=${JSON.stringify(
        args,
        null,
        2,
      )}, context=${JSON.stringify(context, null, 2)}`,
    )
  }
  const {videoId, pageToken: pageTokenArg} = args
  const headers = getHeaders(context.headers)
  const pageToken = pageTokenArg || ''
  try {
    // return await analyzeYoutubeComments(videoId, headers, pageToken)

    if (DEBUG) {
      console.log('analyzeYoutubeComments: headers:', headers)
    }
    const max = MAX_ANALYZE_YT_COMMENTS_RESULTS_COUNT
    const commentsResp = await getYoutubeComments(videoId, max, pageToken)
    const {comments, nextPageToken} = commentsResp
    if (DEBUG) {
      console.log(
        `Got Youtube comments for video ${videoId}:`,
        JSON.stringify({comments, nextPageToken}, null, 2),
      )
    }
    if (!comments || !comments.length) {
      // no comments
      return {results: [], nextPageToken: ''}
    }

    const rs2 = await Promise.all(
      comments.map(async (c) => {
        // TODO: allow customize model
        try {
          return await axios.post(
            'https://api.tiyaro.ai/v1/ent/azure/1/cog-text-language-detect?caching=true',
            {input: c.comment},
            {headers},
          )
        } catch (e) {
          console.log('Ignore cog language detection error:', e)
          return {} as any
        }
      }),
    )

    if (DEBUG) {
      console.log(
        'Youtube comments sentiment analysis inference language responses:',
        JSON.stringify(
          rs2.map((r) => r.data),
          null,
          2,
        ),
      )
    }

    // translate comments to en if supported
    const enComments = await Promise.all(
      comments.map(async (c, i) => {
        const langInfo: any = rs2[i]?.data
        if (langInfo && langInfo.response && langInfo.response.length) {
          const {label, score} = langInfo.response[0]
          if (label && score) {
            // treat zh_cht and zh_chs both as zh
            const tr_label = label === 'zh_chs' || label === 'zh_cht' ? 'zh' : label
            if (watson_supported_to_en_langs.indexOf(tr_label) !== -1) {
              const apiURL = `https://api.tiyaro.ai/v1/ent/ibmcloud/1/watson-translation-${tr_label}-en?caching=true`
              const en = await translate(apiURL, c.comment, label, headers)
              return {...c, en: {...en, score}}
            }
          }
        }
        return c
      }),
    )

    const rs = await Promise.all(
      enComments.map((c) => {
        // TODO: allow customize model
        const ca = c as any
        const input = ca.en ? ca.en.translation_text : c.comment
        return axios.post(
          'https://api.tiyaro.ai/v1/ent/huggingface/1/distilbert-base-uncased-finetuned-sst-2-english?caching=true',
          {input},
          {headers},
        )
      }),
    )

    if (DEBUG) {
      console.log(
        'Youtube comments sentiment analysis inference responses:',
        JSON.stringify(
          rs.map((r) => r.data),
          null,
          2,
        ),
      )
    }

    const results = rs.map((r, i: number) => {
      const {statusCode, body} = r.data.response
      if (statusCode) {
        if (statusCode === 401) {
          throw new AuthenticationError(body || 'UnAuthorized')
        }
        console.warn('Throwing generic error, body=', body)
        throw Error(body || 'Unknown error')
      }
      const x = r.data.response[0]
      if (x) {
        const {label: sentiment, score: confidence} = x
        return {...enComments[i], sentiment, confidence}
      } else {
        return {...enComments[i], sentiment: 'UNKNOWN', confidence: 0}
      }
    })

    if (DEBUG) {
      console.log('analyzeYoutubeComments results:', JSON.stringify(results, null, 2))
    }

    return {results, nextPageToken}
  } catch (e: any) {
    if (e.response) {
      const {data, status, headers} = e.response
      if (DEBUG) {
        console.log('Caught exception:', e)
        console.log('error data', data)
        console.log('error status', status)
        console.log('error headers', headers)
      }
      if (status === 401) {
        throw new AuthenticationError(data?.response?.body || 'UnAuthorized')
      }
    }
    throw Error('API call failed')
  }
}

export interface YoutubeRelatedVideo {
  channelId?: string
  channelTitle?: string
  title: string
  description?: string
  publishedAt?: string
  videoId: string
  thumbnail: string
}

export interface YoutubeRelatedVideos {
  videos: YoutubeRelatedVideo[]
  nextPageToken: string
}

// get up to maxResults (default = 10) related videos for
// the video with the given video id starting at the page token (default '')
export const getYoutubeRelatedVideos = async (
  _parent: any,
  args: {videoId: string; pageToken?: string; maxResults?: number},
  context: any,
  _info: GraphQLResolveInfo,
): Promise<YoutubeRelatedVideos> => {
  if (DEBUG) {
    console.log(
      `getYoutubeRelatedVideosResolver, attrs=${JSON.stringify(
        args,
        null,
        2,
      )}, context=${JSON.stringify(context, null, 2)}`,
    )
  }
  const {videoId, pageToken: pageTokenArg, maxResults: maxResultsArg} = args
  try {
    const pageToken = pageTokenArg || ''
    const maxResults = maxResultsArg || MAX_ANALYZE_YT_COMMENTS_RESULTS_COUNT

    const resp = await axios.get(
      `https://www.googleapis.com/youtube/v3/search?key=${GOOGLE_API_KEY}&textFormat=plainText&part=snippet&type=video&relatedToVideoId=${videoId}&maxResults=${maxResults}&pageToken=${pageToken}`,
    )
    if (DEBUG) {
      console.log('getYoutubeRelatedVideos: resp.data=', JSON.stringify(resp.data, null, 2))
    }
    const {nextPageToken, items} = resp.data
    const videos = items
      .filter(
        (item: any) =>
          item.snippet && item.id && item.id.kind === 'youtube#video' && item.id.videoId,
      )
      .map((item: any) => {
        const videoId = item.id.videoId
        const snippet = item.snippet
        const {channelId, channelTitle, title, description, thumbnails, publishedAt} = snippet
        const thumbnail = thumbnails.default.url
        return {channelId, channelTitle, title, description, publishedAt, videoId, thumbnail}
      })
    return {videos, nextPageToken}
  } catch (e: any) {
    if (e.response) {
      const {data, status, headers} = e.response
      if (DEBUG) {
        console.log('Caught exception:', e)
        console.log('error data', data)
        console.log('error status', status)
        console.log('error headers', headers)
      }

      if (status === 401) {
        throw new AuthenticationError(data?.response?.body || 'UnAuthorized')
      }
    }
    throw Error('API call failed')
  }
}

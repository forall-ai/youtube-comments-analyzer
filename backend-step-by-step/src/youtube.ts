import {GraphQLResolveInfo} from 'graphql'
import axios from 'axios'

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

// language detection and sentiment analysis both are subtypes of text classification
interface TextClassification {
  label: string
  score: number
}
interface TextClassificationResponse {
  response: TextClassification[]
}

interface Translation {
  translation_text: string
}

interface TranslationResponse {
  response: Translation[]
}
interface TranslationExt extends Translation {
  from: string
}

interface TranslationExtWithScore extends TranslationExt {
  score: number
}
interface YoutubeCommentExt extends YoutubeComment {
  en?: TranslationExtWithScore
}

const MAX_ANALYZE_YT_COMMENTS_RESULTS_COUNT = 10

// found the following xx to en watson models on Tiyaro:
const watson_supported_to_en_langs = ['ar', 'es', 'fr', 'hi', 'ja', 'pt', 'ru', 'zh']

// helper function to translate the input using the apiURL model endpoint
async function translate(
  apiURL: string,
  input: string,
  from: string,
  headers: any,
): Promise<TranslationExt> {
  const resp = await axios.post(apiURL, {input}, {headers})
  const {translation_text} = (resp.data as TranslationResponse).response[0]
  return {translation_text, from}
}

// helper function to get youtube comments - similar to fetchYoutubeRelatedVideos
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

// for the given youtube video,
//   fetch 10 comments starting from the page token
//   analyze these comments and return results
export const analyzeYoutubeComments = async (
  _parent: any,
  args: {videoId: string; pageToken?: string},
  context: any,
  _info: GraphQLResolveInfo,
): Promise<AnalyzeYoutubeCommentsResults> => {
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
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${TIYARO_API_KEY}`,
  }
  const pageToken = pageTokenArg || ''

  try {
    // first get youtube comments for the video
    const max = MAX_ANALYZE_YT_COMMENTS_RESULTS_COUNT
    const commentsResp = await getYoutubeComments(videoId, max, pageToken)
    const {comments, nextPageToken} = commentsResp
    if (!comments || !comments.length) {
      // no comments, return
      return {results: [], nextPageToken: ''}
    }

    // next run all comments through cog-text-language-detect model to detect comment language
    const langDetectResps: TextClassificationResponse[] = await Promise.all(
      comments.map(async (c: YoutubeComment) => {
        try {
          const r = await axios.post(
            'https://api.tiyaro.ai/v1/ent/azure/1/cog-text-language-detect?caching=true',
            {input: c.comment},
            {headers},
          )
          return r.data as TextClassificationResponse
        } catch (e) {
          // in case of error, ignore and return empty object
          console.log('Ignore cog language detection error:', e)
          return {response: []}
        }
      }),
    )

    // translate comments to en if supported
    const enComments: YoutubeCommentExt[] = await Promise.all(
      comments.map(async (c, i) => {
        const langInfo = langDetectResps[i]
        if (langInfo.response.length) {
          const {label, score} = langInfo.response[0]
          if (label && score) {
            // treat zh_cht and zh_chs both as zh
            const tr_label = label === 'zh_chs' || label === 'zh_cht' ? 'zh' : label
            if (watson_supported_to_en_langs.indexOf(tr_label) !== -1) {
              // use waston model naming convention to find API endpoint
              const apiURL = `https://api.tiyaro.ai/v1/ent/ibmcloud/1/watson-translation-${tr_label}-en?caching=true`
              const en = await translate(apiURL, c.comment, label, headers)
              return {...c, en: {...en, score}}
            }
          }
        }
        // en comment or not supported language comment, return as is
        return c
      }),
    )

    // run translated comments through sentiment analysis model
    const sentimentResponses: TextClassificationResponse[] = await Promise.all(
      enComments.map(async (ca) => {
        const input = ca.en ? ca.en.translation_text : ca.comment
        const r = await axios.post(
          'https://api.tiyaro.ai/v1/ent/huggingface/1/distilbert-base-uncased-finetuned-sst-2-english?caching=true',
          {input},
          {headers},
        )
        return r.data as TextClassificationResponse
      }),
    )

    // extract analyze youtube comment results from sentiment responses with some error handling
    const results: AnalyzeYoutubeCommentsResult[] = sentimentResponses.map((r, i: number) => {
      const {statusCode, body} = r.response as any
      if (statusCode) {
        // special error case
        throw Error(body || 'Unknown error')
      }
      const x = r.response[0]
      if (x) {
        const {label: sentiment, score: confidence} = x
        return {...enComments[i], sentiment, confidence}
      } else {
        return {...enComments[i], sentiment: 'UNKNOWN', confidence: 0}
      }
    })
    return {results, nextPageToken}
  } catch (e: any) {
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

async function fetchYoutubeRelatedVideos(
  videoId: string,
  pageTokenArg?: string,
  maxResultsArg?: number,
): Promise<YoutubeRelatedVideos> {
  try {
    const pageToken = pageTokenArg || ''
    const maxResults = maxResultsArg || MAX_ANALYZE_YT_COMMENTS_RESULTS_COUNT

    // use axios to getch youtube related videos via youtube api
    const resp = await axios.get(
      `https://www.googleapis.com/youtube/v3/search?key=${GOOGLE_API_KEY}&textFormat=plainText&part=snippet&type=video&relatedToVideoId=${videoId}&maxResults=${maxResults}&pageToken=${pageToken}`,
    )
    const {nextPageToken, items} = resp.data
    const videos = items
      // filter to keep only valid items
      .filter(
        (item: any) =>
          item.snippet && item.id && item.id.kind === 'youtube#video' && item.id.videoId,
      )
      // map to extract data we need
      .map((item: any) => {
        const videoId = item.id.videoId
        const snippet = item.snippet
        const {channelId, channelTitle, title, description, thumbnails, publishedAt} = snippet
        const thumbnail = thumbnails.default.url
        return {channelId, channelTitle, title, description, publishedAt, videoId, thumbnail}
      })
    return {videos, nextPageToken}
  } catch (e: any) {
    throw Error('API call failed')
  }
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
  const {videoId, pageToken, maxResults} = args
  return fetchYoutubeRelatedVideos(videoId, pageToken, maxResults)
}

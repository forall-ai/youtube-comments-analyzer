import {GraphQLResolveInfo} from 'graphql'
import axios from 'axios'

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY
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
  const results: AnalyzeYoutubeCommentsResult[] = []
  const nextPageToken = ''
  return {results, nextPageToken}
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

const MAX_ANALYZE_YT_COMMENTS_RESULTS_COUNT = 10
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

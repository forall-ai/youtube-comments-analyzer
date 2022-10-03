import {GraphQLResolveInfo} from 'graphql'

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
  const videos: YoutubeRelatedVideo[] = []
  const nextPageToken = ''
  return {videos, nextPageToken}
}

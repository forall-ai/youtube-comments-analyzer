import {gql} from 'apollo-server-express'

export const typeDefs = gql`
  scalar Date
  scalar JSON
  scalar JSONObject
  type Query {
    analyzeYoutubeComments(videoId: String!, pageToken: String): JSON
    getYoutubeRelatedVideos(videoId: String!, pageToken: String, maxResults: Int): JSON
  }
`

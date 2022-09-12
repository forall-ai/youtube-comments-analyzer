import {DateTimeResolver, JSONResolver, JSONObjectResolver} from 'graphql-scalars'

import {analyzeYoutubeComments, getYoutubeRelatedVideos} from './youtube'

export const resolvers = {
  Query: {
    analyzeYoutubeComments,
    getYoutubeRelatedVideos,
  },
  Date: DateTimeResolver,
  JSON: JSONResolver,
  JSONObject: JSONObjectResolver,
}

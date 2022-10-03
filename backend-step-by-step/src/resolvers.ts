import {JSONResolver} from 'graphql-scalars'

import {analyzeYoutubeComments, getYoutubeRelatedVideos} from './youtube'

export const resolvers = {
  Query: {
    analyzeYoutubeComments,
    getYoutubeRelatedVideos,
  },
  JSON: JSONResolver,
}

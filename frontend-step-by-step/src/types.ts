export interface AnalyzeYoutubeCommentsResult {
  comment: string;
  publishedAt: string;
  likeCount: number;
  sentiment: string;
  confidence: number;
  en?: any;
}

export interface AnalyzeYoutubeCommentsResults {
  results: AnalyzeYoutubeCommentsResult[];
  nextPageToken: string;
}

export interface YtcaState extends AnalyzeYoutubeCommentsResults {
  videoId: string;
  loading: boolean;
  error: string;
}

export interface YoutubeRelatedVideo {
  channelId?: string;
  channelTitle?: string;
  title: string;
  description?: string;
  publishedAt?: string;
  videoId: string;
  thumbnail: string;
}

export interface YoutubeRelatedVideos {
  videos: YoutubeRelatedVideo[];
  nextPageToken: string;
}

export interface YtrvState extends YoutubeRelatedVideos {
  videoId: string;
  loading: boolean;
  error: string;
}

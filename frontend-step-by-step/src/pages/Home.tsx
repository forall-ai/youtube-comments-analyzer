/** @jsxRuntime classic */
/** @jsx jsx */
// jsx not referenced, but required
import {jsx, css} from '@emotion/react';

import {useEffect, useState} from 'react';

import Box from '@mui/material/Box';
import {Header} from '../components/Header';
import {Description} from '../components/Description';
import {YoutubeVideo} from '../components/YoutubeVideo';
import {VideoIDTextField} from '../components/VideoIDTextField';
import {RelatedVideos} from '../components/RelatedVideos';

import {YtrvState, YtcaState, YoutubeRelatedVideos} from '../types';

// TODO: you should update this for non-local deployment
const BACKEND_URL = 'http://localhost:3001';

// API key is only needed if you are NOT running your own server and are pointing to Tiyaro server
const INITIAL_API_KEY = 'change-me';

const INITIAL_VIDEO_ID = 'PZmCYeG3uh4';
const USER_API_KEY_HANDLE = 'tiyaro.api.key';

const MAX_RELATED_VIDEOS = 10;

const AUTH_ERROR = 'Auth error';
const NETWORK_ERROR = 'Network error';

function getVideoId(videoIdOrURL: string): string {
  if (!videoIdOrURL || videoIdOrURL.length < 8) {
    return '';
  }
  if (videoIdOrURL.startsWith('https://')) {
    let url = videoIdOrURL;
    const i = videoIdOrURL.indexOf('?');
    if (i !== -1) {
      const qs = new URLSearchParams(videoIdOrURL.substring(i + 1));
      const v = qs.get('v');
      if (v) {
        return v;
      }
      url = url.substring(0, i);
    }
    // see if embed
    const EMBED = '/embed/';
    const j = url.indexOf(EMBED);
    if (j !== -1) {
      return url.substring(j + EMBED.length);
    }
    return '';
  }
  return videoIdOrURL;
}

export default function Home() {
  // youtube comment analyzer state
  const [ytcaState, setYtcaState] = useState<YtcaState>({
    videoId: INITIAL_VIDEO_ID,
    results: [],
    nextPageToken: '',
    loading: false,
    error: '',
  });
  // youtube related video state
  const [ytrvState, setYtrvState] = useState<YtrvState>({
    videoId: INITIAL_VIDEO_ID,
    videos: [],
    nextPageToken: '',
    loading: false,
    error: '',
  });

  const [apiKey, setApiKey] = useState(
    localStorage.getItem(USER_API_KEY_HANDLE) || INITIAL_API_KEY,
  );

  const switchVideo = (videoId: string) => {
    setYtcaState({
      videoId,
      results: [],
      nextPageToken: '',
      loading: true,
      error: '',
    });
    setYtrvState({
      videoId,
      videos: [],
      nextPageToken: '',
      loading: true,
      error: '',
    });
  };

  useEffect(() => {
    const vid = getVideoId(ytrvState.videoId);
    if (!vid) {
      return;
    }
    const effectAsync = async (apiKey: string) => {
      let error = '';
      try {
        if (ytrvState.videos.length) {
          return;
        }
        // get up to maxResults (default = 10) related videos for
        // the video with the given video id starting at the page token (default '')
        const r2 = await fetch(BACKEND_URL, {
          method: 'post',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          // hand-coding graphql query for getYoutubeRelatedVideos
          body: JSON.stringify({
            query: `{ getYoutubeRelatedVideos(videoId: "${vid}", pageToken: "${ytrvState.nextPageToken}", maxResults: ${MAX_RELATED_VIDEOS})  }`,
          }),
        }).then((r) => r.json());

        const {data, errors} = r2;

        if (!data || !data.getYoutubeRelatedVideos) {
          // no results
          if (
            errors &&
            errors[0] &&
            errors[0].extensions &&
            errors[0].extensions.code === 'UNAUTHENTICATED'
          ) {
            // API quota exceeded - ask user to login and get api token
            error = AUTH_ERROR;
          } else {
            // some unknown generic error
            error = 'Generic error';
          }
        }
        if (!error) {
          const {nextPageToken, videos} = data.getYoutubeRelatedVideos as YoutubeRelatedVideos;

          // update youtube related video state
          setYtrvState({
            videoId: ytrvState.videoId,
            videos,
            nextPageToken: nextPageToken || '', // nextPageToken could be undefined
            loading: false,
            error: '',
          });
        }
      } catch (e) {
        error = NETWORK_ERROR;
      } finally {
        if (error) {
          // update youtube related video state
          setYtrvState({
            videoId: ytrvState.videoId,
            videos: [],
            nextPageToken: '',
            loading: false,
            error,
          });
        }
      }
    };
    effectAsync(apiKey);
  }, [ytrvState.videoId, apiKey]);

  const {videoId} = ytcaState;
  return (
    <Box m={4}>
      <Header />
      <Description />

      <Box sx={{display: 'flex', marginTop: '24px'}}>
        <YoutubeVideo videoId={getVideoId(videoId)} />
        <Box sx={{flexGrow: 1, marginLeft: '32px'}}>
          <VideoIDTextField videoId={videoId} handleChange={switchVideo} />
          <RelatedVideos ytrvState={ytrvState} switchVideo={switchVideo} />
        </Box>
      </Box>
    </Box>
  );
}

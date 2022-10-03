/** @jsxRuntime classic */
/** @jsx jsx */
// jsx not referenced, but required
import {jsx, css} from '@emotion/react';

import {useState} from 'react';

import Box from '@mui/material/Box';
import {Header} from '../components/Header';
import {Description} from '../components/Description';
import {YoutubeVideo} from '../components/YoutubeVideo';
import {VideoIDTextField} from '../components/VideoIDTextField';
import {YtrvState, YtcaState} from '../types';

const INITIAL_VIDEO_ID = 'PZmCYeG3uh4';

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
  const [ytcaState, setYtcaState] = useState<YtcaState>({
    videoId: INITIAL_VIDEO_ID,
    results: [],
    nextPageToken: '',
    loading: false,
    error: '',
  });
  const [ytrvState, setYtrvState] = useState<YtrvState>({
    videoId: INITIAL_VIDEO_ID,
    videos: [],
    nextPageToken: '',
    loading: false,
    error: '',
  });

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

  const {videoId} = ytcaState;
  return (
    <Box m={4}>
      <Header />
      <Description />

      <Box sx={{display: 'flex', marginTop: '24px'}}>
        <YoutubeVideo videoId={getVideoId(videoId)} />
        <Box sx={{flexGrow: 1, marginLeft: '32px'}}>
          <VideoIDTextField videoId={videoId} handleChange={switchVideo} />
        </Box>
      </Box>
    </Box>
  );
}

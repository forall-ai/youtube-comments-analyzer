import Box from '@mui/material/Box';
import YouTube, {YouTubeProps} from 'react-youtube';
import {tlog} from '../utils/log';

export const YoutubeVideo = ({videoId}: {videoId: string}) => {
  const onPlayerReady: YouTubeProps['onReady'] = (event) => {
    // access to player in all event handlers via event.target
    // event.target.pauseVideo();
    tlog('onPlayerReady, event=', event);
  };

  const onStateChange: YouTubeProps['onStateChange'] = (event) => {
    // access to player in all event handlers via event.target
    // event.target.pauseVideo();
    tlog('onStateChange, event=', event, 'url:', event?.target?.getVideoUrl());
  };

  const opts: YouTubeProps['opts'] = {
    height: '405',
    width: '720',
    playerVars: {
      // https://developers.google.com/youtube/player_parameters
      autoplay: 0,
      // rel: 0, // related videos from the same channel only
      enablejsapi: 1,
      modestbrowsing: 1,
      sandbox:
        'allow-forms allow-scripts allow-pointer-lock allow-same-origin allow-top-navigation',
    },
  };

  return (
    <Box>
      <YouTube
        videoId={videoId}
        opts={opts}
        onReady={onPlayerReady}
        onStateChange={onStateChange}
      />
    </Box>
  );
};

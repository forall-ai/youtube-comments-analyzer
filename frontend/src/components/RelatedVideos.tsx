/** @jsxRuntime classic */
/** @jsx jsx */
// jsx not referenced, but required
import {jsx, css} from '@emotion/react';

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import {YtrvState} from '../types';

export const RelatedVideos = ({
  ytrvState,
  switchVideo,
}: {
  ytrvState: YtrvState;
  switchVideo: (videoId: string) => void;
}) => (
  <Box>
    <Box mt={2} mb={1} sx={{fontWeight: '500'}}>
      Related videos
    </Box>
    {ytrvState.loading ? (
      <Box>
        <CircularProgress size="24px" />
      </Box>
    ) : (
      <Box sx={{display: 'flex', overflow: 'auto', flexWrap: 'wrap', maxHeight: '320px'}}>
        {ytrvState.videos.map((rv, i) => (
          <Box
            key={i}
            sx={{marginRight: '8px', cursor: 'pointer'}}
            title={rv.title}
            onClick={() => switchVideo(rv.videoId)}>
            <Box>
              <img src={rv.thumbnail} alt="related video thumbnail" />
            </Box>

            <Box
              css={css`
                width: 120px;
                height: 57px;
                max-height: 57px;
                text-overflow: ellipsis;
                overflow: hidden;
                font-size: 12px;
                margin-bottom: 8px;
                display: -webkit-box;
                -webkit-line-clamp: 4;
                -webkit-box-orient: vertical;
              `}>
              {rv.title}
            </Box>
          </Box>
        ))}
      </Box>
    )}
  </Box>
);

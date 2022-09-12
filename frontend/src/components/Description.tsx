import Box from '@mui/material/Box';

export const Description = () => (
  <Box mt={2} sx={{fontSize: '14px', color: '#333333'}}>
    A simple application built on top of Tiyaro API to showcase some NLP functions available on
    Tiyaro. It uses the following Tiyaro models / APIs:{' '}
    <a
      href="https://console.tiyaro.ai/explore/azure-1-cog-text-language-detect/api"
      target="_blank"
      rel="noreferrer">
      Language detection
    </a>
    ,{' '}
    <a href="https://console.tiyaro.ai/search/translation" target="_blank" rel="noreferrer">
      Translation
    </a>
    , and{' '}
    <a
      href="https://console.tiyaro.ai/search/sentiment%20analysis"
      target="_blank"
      rel="noreferrer">
      Sentiment Analysis
    </a>
    . In addition, it uses Youtube IFrame and search / comments data APIs for loading Youtube video,
    fetching video comments and finding related videos.{' '}
    <a href="https://github.com/tiyaro/youtube-comments-analyzer" target="_blank" rel="noreferrer">
      View source code on GitHub.
    </a>
  </Box>
);

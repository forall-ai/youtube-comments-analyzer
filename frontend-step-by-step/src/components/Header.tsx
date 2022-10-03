/** @jsxRuntime classic */
/** @jsx jsx */
// jsx not referenced, but required
import {jsx, css} from '@emotion/react';
import Box from '@mui/material/Box';

export const Header = () => (
  <Box>
    <a
      href="https://tiyaro.ai"
      target="_blank"
      rel="noreferrer"
      css={css`
        text-decoration: none;
      `}>
      <div
        css={css`
          display: flex;
          flex-direction: row;
          align-items: center;
        `}>
        <div
          css={css`
            font-size: 20px;
            font-weight: 600;
            color: #424494;
          `}>
          Youtube Comments Analyzer
        </div>
        <div
          css={css`
            flex-grow: 1;
          `}></div>
        <div
          css={css`
            // font-size: 11px;
            font-weight: 500;
            color: #424494;
          `}>
          powered by
        </div>
        <div
          css={css`
            margin-left: 6px;
            margin-top: 6px;
          `}>
          <img
            src="https://console.tiyaro.ai/images/tiyaro-logo.svg"
            width="47"
            alt="Tiyaro logo"
          />
        </div>
      </div>
    </a>
  </Box>
);

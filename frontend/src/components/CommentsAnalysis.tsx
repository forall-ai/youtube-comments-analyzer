/** @jsxRuntime classic */
/** @jsx jsx */
// jsx not referenced, but required
import {jsx, css} from '@emotion/react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

import {YtcaState} from '../types';

const CommentsAnalysisHeadline = ({
  values,
  nextPageToken,
  loading,
  loadMore,
}: {
  values: string[];
  nextPageToken: string;
  loading: boolean;
  loadMore: () => void;
}) => {
  return (
    <div>
      <div
        css={css`
          display: flex;
          align-items: center;
          margin-top: 8px;
          padding: 12px 16px;
          border-radius: 4px;
          background-color: #f0f0f0;
        `}>
        <div>Positive comments (percent/confidence):</div>
        <div style={{fontWeight: '600', marginLeft: '8px'}}>{values[0]}</div>
        <div style={{marginLeft: '32px'}}>Negative comments (percent/confidence):</div>
        <div style={{fontWeight: '600', marginLeft: '8px'}}>{values[1]}</div>
        <div style={{marginLeft: '32px'}}>Comments processed:</div>
        <div style={{fontWeight: '600', marginLeft: '8px'}}>{values[2]}</div>
        <div style={{flexGrow: 1}}></div>

        {loading && (
          <Box sx={{marginTop: '2px'}}>
            <CircularProgress size="32px" />
          </Box>
        )}
        <div style={{marginLeft: '32px'}}>
          <Button onClick={loadMore} variant="contained" disabled={!nextPageToken}>
            Process more comments
          </Button>
        </div>
      </div>
    </div>
  );
};

const CommentsAnalysisLoading = ({
  ytcaState,
  loadMore,
}: {
  ytcaState: YtcaState;
  loadMore: () => void;
}) => {
  const {nextPageToken, loading} = ytcaState;
  const values = ['N/A', 'N/A', 'N/A'];
  return (
    <CommentsAnalysisHeadline
      values={values}
      nextPageToken={nextPageToken}
      loading={loading}
      loadMore={loadMore}
    />
  );
};

const CommentsAnalysisSummary = ({
  ytcaState,
  loadMore,
}: {
  ytcaState: YtcaState;
  loadMore: () => void;
}) => {
  const {results, nextPageToken, loading} = ytcaState;
  const comments_count = results.length;
  const sentiments: any = {};
  for (const x of results) {
    const {confidence, sentiment} = x;
    if (sentiments[sentiment]) {
      sentiments[sentiment].count += 1;
      sentiments[sentiment].confidence += confidence;
    } else {
      sentiments[sentiment] = {
        count: 1,
        confidence,
      };
    }
  }
  const neg_pct = sentiments['NEGATIVE']
    ? Math.round(100 * (sentiments['NEGATIVE'].count / comments_count))
    : sentiments['POSITIVE']
    ? 0
    : 100;
  const pos_pct = 100 - neg_pct;
  const neg_conf = neg_pct
    ? (sentiments['NEGATIVE'].confidence / sentiments['NEGATIVE'].count).toFixed(2)
    : 'N/A';
  const pos_conf = pos_pct
    ? (sentiments['POSITIVE'].confidence / sentiments['POSITIVE'].count).toFixed(2)
    : 'N/A';
  const values = [`${pos_pct}% / ${pos_conf}`, `${neg_pct}% / ${neg_conf}`, `${comments_count}`];
  return (
    <CommentsAnalysisHeadline
      values={values}
      nextPageToken={nextPageToken}
      loading={loading}
      loadMore={loadMore}
    />
  );
};

export const CommentsAnalysis = ({
  ytcaState,
  loadMore,
}: {
  ytcaState: YtcaState;
  loadMore: () => void;
}) => {
  const {results, videoId} = ytcaState;
  if (!results || !results.length) {
    if (ytcaState.loading) {
      return <CommentsAnalysisLoading ytcaState={ytcaState} loadMore={loadMore} />;
    }
    // no comments?
    return null;
  }

  return (
    <div>
      <CommentsAnalysisSummary ytcaState={ytcaState} loadMore={loadMore} />
      <div
        css={css`
          margin-top: 32px;
          overflow: auto;
          display: block;
        `}>
        <table
          border={1}
          bordercolor="#dddddd"
          rules="rows"
          frame="void"
          css={css`
            width: 100%;
          `}>
          <tr>
            <th style={{paddingBottom: '8px', paddingRight: '32px', textAlign: 'left'}}>Comment</th>
            <th style={{paddingBottom: '8px', textAlign: 'left'}}>Translation</th>
            <th style={{paddingBottom: '8px'}}>Sentiment</th>
            <th style={{paddingBottom: '8px'}}>Confidence</th>
          </tr>
          {results.map((x, i) => {
            const {confidence, sentiment, comment, en} = x;
            const positive = sentiment === 'POSITIVE';
            const opacity = positive ? 1.0 : 0.5;

            return (
              <tr key={videoId + '-' + i}>
                <td
                  css={css`
                    padding-bottom: 8px;
                    padding-right: 32px;
                    text-overflow: ellipsis;
                    overflow: hidden;
                    white-space: nowrap;
                    max-width: 250px;
                  `}>
                  <span title={comment}>{comment}</span>
                </td>

                <td
                  css={css`
                    padding-bottom: 8px;
                    text-overflow: ellipsis;
                    overflow: hidden;
                    white-space: nowrap;
                    max-width: 250px;
                  `}>
                  <span title={en?.translation_text || ''}>
                    {en && en.translation_text ? `(from ${x.en.from}) ${en.translation_text}` : ''}
                  </span>
                </td>

                {positive ? (
                  <td
                    css={css`
                      padding-bottom: 8px;
                      padding-left: 8px;
                      text-align: center;
                      opacity: ${opacity};
                    `}>
                    &#128077;
                  </td>
                ) : (
                  <td
                    css={css`
                      padding-bottom: 8px;
                      padding-left: 8px;
                      text-align: center;
                      opacity: ${opacity};
                    `}>
                    &#128078;
                  </td>
                )}
                <td
                  css={css`
                    padding-bottom: 8px;
                    text-align: center;
                  `}>
                  {confidence.toFixed(2)}
                </td>
              </tr>
            );
          })}
        </table>
      </div>
    </div>
  );
};

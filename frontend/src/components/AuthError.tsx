import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';

export const AuthError = ({
  userApiKey,
  handleChangeUserApiKey,
  handleSaveApiKey,
}: {
  userApiKey: string;
  handleChangeUserApiKey: (key: string) => void;
  handleSaveApiKey: () => void;
}) => {
  const onChangeUserApiKey = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleChangeUserApiKey(event.target.value);
  };

  return (
    <Box>
      <Box>
        <Alert severity="error">Anonymous API quota exceeded!</Alert>
      </Box>

      <Box mt={2}>
        Please sign up with Tiyaro{' '}
        <a href="https://console.tiyaro.ai/signup" rel="noreferrer" target="_blank">
          here
        </a>{' '}
        (free plan available), then enter your API key below to proceed:
      </Box>

      <Box mt={2} sx={{display: 'flex', alignItems: 'center'}}>
        <Box>
          <TextField
            type="password"
            size="small"
            sx={{width: '720px'}}
            placeholder="Your Tiyaro API Key"
            value={userApiKey}
            onChange={onChangeUserApiKey}
          />
        </Box>
        <Box sx={{marginLeft: '16px'}}>
          <Button
            onClick={handleSaveApiKey}
            variant="contained"
            disabled={userApiKey.length !== 61 || userApiKey.indexOf('.') !== 20}>
            Save
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

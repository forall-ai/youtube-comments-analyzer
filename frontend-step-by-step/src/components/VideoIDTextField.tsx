import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';

export const VideoIDTextField = ({
  videoId,
  handleChange,
}: {
  videoId: string;
  handleChange: (txt: string) => void;
}) => {
  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleChange(event.target.value);
  };

  return (
    <Box sx={{display: 'flex', alignItems: 'center'}}>
      <Box>
        <TextField
          size="small"
          sx={{width: '500px'}}
          id="outlined-name"
          label="Youtube video ID or URL"
          value={videoId}
          onChange={onChange}
        />
      </Box>
    </Box>
  );
};

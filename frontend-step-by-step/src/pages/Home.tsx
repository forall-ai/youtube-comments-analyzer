import Box from '@mui/material/Box';
import {Header} from '../components/Header';
import {Description} from '../components/Description';

export default function Home() {
  return (
    <Box m={4}>
      <Header />
      <Description />
    </Box>
  );
}

import './App.css';
import BetPage from './BetPage';
import { createTheme, ThemeProvider } from '@mui/material';

function App() {
  const theme = createTheme({
    typography: { fontFamily: 'Inter' }
  })
  return (
    <div className="App">
      <ThemeProvider theme={theme}>
        <BetPage />
      </ThemeProvider>
    </div>
  );
}

export default App;

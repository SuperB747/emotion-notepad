import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './components/Auth/Login';
import { Register } from './components/Auth/Register';
import { NoteList } from './components/Notes/NoteList';
import { NewNote } from './components/Notes/NewNote';
import { auth } from './config/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Box, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import totoroBg from './assets/totoro-bg.png';

const theme = createTheme({
  palette: {
    primary: {
      main: '#9cbb9c',
    },
    background: {
      default: '#f3f0e9',
    },
  },
  typography: {
    fontFamily: "'Ghibli', 'Noto Sans KR', sans-serif",
  },
});

export const App = () => {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          width: '100vw',
          position: 'relative',
          overflow: 'auto',
          bgcolor: '#f3f0e9',
        }}
      >
        {/* Background Layer */}
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 0,
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `url(${totoroBg})`,
              backgroundSize: '80% auto',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              opacity: 0.6,
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(243, 240, 233, 0.85)',
              backdropFilter: 'blur(2px)',
            },
          }}
        />

        {/* Content Layer */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            minHeight: '100vh',
          }}
        >
          <Router>
            <Routes>
              <Route
                path="/login"
                element={user ? <Navigate to="/notes" /> : <Login />}
              />
              <Route
                path="/register"
                element={user ? <Navigate to="/notes" /> : <Register />}
              />
              <Route
                path="/notes"
                element={user ? <NoteList /> : <Navigate to="/login" />}
              />
              <Route
                path="/notes/new"
                element={user ? <NewNote /> : <Navigate to="/login" />}
              />
              <Route
                path="/"
                element={<Navigate to={user ? "/notes" : "/login"} />}
              />
            </Routes>
          </Router>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

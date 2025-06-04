import React, { useState } from 'react';
import { auth } from '../../config/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
} from '@mui/material';
import { motion } from 'framer-motion';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/notes');
    } catch (err) {
      setError('로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.');
    }
  };

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        zIndex: 1,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card 
          sx={{ 
            maxWidth: 400, 
            width: '100%', 
            mx: 2,
            bgcolor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Typography 
              variant="h5" 
              component="h1" 
              gutterBottom 
              align="center"
              sx={{
                color: '#2c5530',
                fontFamily: "'Ghibli', 'Noto Sans KR', sans-serif",
              }}
            >
              감성 메모장 로그인
            </Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <form onSubmit={handleLogin}>
              <TextField
                fullWidth
                label="이메일"
                variant="outlined"
                margin="normal"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: 'rgba(0, 0, 0, 0.1)',
                    },
                    '&:hover fieldset': {
                      borderColor: '#9cbb9c',
                    },
                  },
                }}
              />
              <TextField
                fullWidth
                label="비밀번호"
                type="password"
                variant="outlined"
                margin="normal"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: 'rgba(0, 0, 0, 0.1)',
                    },
                    '&:hover fieldset': {
                      borderColor: '#9cbb9c',
                    },
                  },
                }}
              />
              <Button
                fullWidth
                variant="contained"
                type="submit"
                sx={{ 
                  mt: 3,
                  bgcolor: '#9cbb9c',
                  '&:hover': {
                    bgcolor: '#7a9e7a',
                  },
                }}
              >
                로그인
              </Button>
              <Button
                fullWidth
                variant="text"
                onClick={() => navigate('/register')}
                sx={{ 
                  mt: 1,
                  color: '#666',
                  '&:hover': {
                    bgcolor: 'rgba(156, 187, 156, 0.1)',
                  },
                }}
              >
                계정이 없으신가요? 회원가입
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </Box>
  );
}; 
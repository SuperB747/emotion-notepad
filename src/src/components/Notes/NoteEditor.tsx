import React, { useState, useEffect } from 'react';
import { db, auth } from '../../config/firebase';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  IconButton,
  Snackbar,
} from '@mui/material';
import { motion } from 'framer-motion';
import { Save as SaveIcon, VolumeUp as VolumeUpIcon } from '@mui/icons-material';
import { Howl } from 'howler';
import { quotes } from '../../data/quotes';

const backgroundMusic = new Howl({
  src: ['/sounds/peaceful-piano.mp3'],
  loop: true,
  volume: 0.5,
});

export const NoteEditor = () => {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [randomQuote, setRandomQuote] = useState(quotes[0]);
  const [saveStatus, setSaveStatus] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    setRandomQuote(quotes[randomIndex]);
  }, []);

  const handleSave = async () => {
    if (!content || !title) {
      setSaveStatus('제목과 내용을 모두 입력해주세요.');
      setSnackbarOpen(true);
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        setSaveStatus('로그인이 필요합니다.');
        setSnackbarOpen(true);
        return;
      }

      const notesCollection = collection(db, `users/${user.uid}/notes`);
      await addDoc(notesCollection, {
        title,
        content,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      setSaveStatus('저장되었습니다!');
      setSnackbarOpen(true);
      
      // 저장 성공 후 메모 목록 페이지로 이동
      setTimeout(() => {
        navigate('/notes');
      }, 1500);
    } catch (error) {
      console.error('저장 실패:', error);
      setSaveStatus('저장에 실패했습니다. 다시 시도해주세요.');
      setSnackbarOpen(true);
    }
  };

  const toggleMusic = () => {
    if (isPlaying) {
      backgroundMusic.pause();
    } else {
      backgroundMusic.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        p: 3,
        background: 'linear-gradient(135deg, #c4b5fd 0%, #9c88ff 100%)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card sx={{ maxWidth: 800, mx: 'auto', mb: 3 }}>
          <CardContent>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mb: 3, fontStyle: 'italic', textAlign: 'center' }}
            >
              "{randomQuote.text}"
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ maxWidth: 800, mx: 'auto' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" component="div">
                새로운 메모
              </Typography>
              <Box>
                <IconButton onClick={toggleMusic} color={isPlaying ? 'primary' : 'default'}>
                  <VolumeUpIcon />
                </IconButton>
              </Box>
            </Box>

            <TextField
              fullWidth
              label="제목"
              variant="outlined"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="내용"
              multiline
              rows={10}
              variant="outlined"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  fontFamily: "'Noto Sans KR', sans-serif",
                },
              }}
            />

            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              fullWidth
            >
              저장하기
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={saveStatus}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}; 
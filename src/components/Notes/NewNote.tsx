import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Snackbar,
} from '@mui/material';
import { Save as SaveIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { NOTE_COLORS } from '../../constants/noteConstants';
import type { NoteColor } from '../../types/noteTypes';

export const NewNote = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedColor, setSelectedColor] = useState<NoteColor>('yellow');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const user = auth.currentUser;
      if (!user) return;

      await addDoc(collection(db, `users/${user.uid}/notes`), {
        title,
        content,
        color: selectedColor,
        createdAt: serverTimestamp(),
        userId: user.uid,
      });

      navigate('/notes');
    } catch (error) {
      setSnackbarMessage('메모 저장 중 오류가 발생했습니다.');
      setSnackbarOpen(true);
    }
  };

  return (
    <Box sx={{ 
      p: 3,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      pt: 8,
    }}>
      <Paper 
        elevation={3}
        component="form"
        onSubmit={handleSubmit}
        sx={{
          width: '100%',
          maxWidth: '600px',
          minHeight: '400px',
          p: 3,
          bgcolor: NOTE_COLORS[selectedColor].bg,
          position: 'relative',
          borderRadius: '16px',
          boxShadow: '3px 3px 12px rgba(0,0,0,0.15)',
          transition: 'background-color 0.3s ease',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '80px',
            height: '25px',
            bgcolor: '#9cbb9c',
            borderRadius: '0 0 12px 12px',
            boxShadow: 'inset 0 -5px 8px rgba(0,0,0,0.1)',
          },
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <TextField
            fullWidth
            placeholder="제목을 입력하세요"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            variant="standard"
            required
            sx={{
              mb: 3,
              '& input': {
                fontSize: '2rem',
                fontFamily: "'Ghibli', 'Noto Sans KR', sans-serif",
                color: '#2c5530',
                textAlign: 'center',
              },
              '& input::placeholder': {
                color: 'rgba(44, 85, 48, 0.5)',
              },
              '& .MuiInput-underline:before': {
                borderBottomColor: 'rgba(0, 0, 0, 0.1)',
              },
              '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                borderBottomColor: '#9cbb9c',
              },
            }}
          />

          {/* 색상 선택 버튼 그룹 */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            flexWrap: 'wrap',
            gap: 1, 
            mb: 3,
            '& button': {
              width: 36,
              height: 36,
              minWidth: 'unset',
              p: 0,
              borderRadius: '50%',
              border: '2px solid transparent',
              '&.selected': {
                border: '2px solid #666',
              }
            }
          }}>
            {Object.entries(NOTE_COLORS).map(([colorKey, colorData]) => (
              <Button
                key={colorKey}
                onClick={() => setSelectedColor(colorKey as NoteColor)}
                className={selectedColor === colorKey ? 'selected' : ''}
                sx={{
                  bgcolor: colorData.bg,
                  '&:hover': {
                    bgcolor: colorData.hover,
                  }
                }}
                title={colorData.name}
              />
            ))}
          </Box>

          <TextField
            fullWidth
            placeholder="내용을 입력하세요"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            multiline
            rows={12}
            required
            variant="standard"
            sx={{
              '& textarea': {
                fontSize: '1.1rem',
                fontFamily: "'Ghibli', 'Noto Sans KR', sans-serif",
                color: '#444',
                lineHeight: 1.8,
              },
              '& textarea::placeholder': {
                color: 'rgba(68, 68, 68, 0.5)',
              },
              '& .MuiInput-underline:before': {
                borderBottomColor: 'rgba(0, 0, 0, 0.1)',
              },
              '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                borderBottomColor: '#9cbb9c',
              },
            }}
          />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/notes')}
              sx={{ 
                color: '#666',
                '&:hover': {
                  bgcolor: 'rgba(156, 187, 156, 0.1)',
                },
              }}
            >
              돌아가기
            </Button>
            <Button
              type="submit"
              startIcon={<SaveIcon />}
              sx={{
                bgcolor: '#9cbb9c',
                color: 'white',
                '&:hover': {
                  bgcolor: '#7a9e7a',
                },
              }}
            >
              저장하기
            </Button>
          </Box>
        </Box>
      </Paper>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}; 
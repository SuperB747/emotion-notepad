import React from 'react';
import { Box, Paper, Typography, TextField, Button, IconButton } from '@mui/material';
import { Edit as EditIcon, Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import { NOTE_COLORS } from '../../constants/noteConstants';
import type { Note, NoteColor } from '../../types/noteTypes';

interface NoteCardProps {
  note: Note;
  isEditing: boolean;
  editedTitle: string;
  editedContent: string;
  editedColor: NoteColor;
  onEditTitle: (value: string) => void;
  onEditContent: (value: string) => void;
  onEditColor: (color: NoteColor) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  formatDate: (date: any) => string;
}

export const NoteCard = ({
  note,
  isEditing,
  editedTitle,
  editedContent,
  editedColor,
  onEditTitle,
  onEditContent,
  onEditColor,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  formatDate,
}: NoteCardProps) => {

  const getBackgroundColor = () => {
    if (isEditing) {
      return NOTE_COLORS[editedColor]?.bg || NOTE_COLORS.yellow.bg;
    }
    return NOTE_COLORS[note.color || 'yellow']?.bg || NOTE_COLORS.yellow.bg;
  };

  return (
    <Paper
      key={note.id}
      elevation={8}
      sx={{
        width: '100%',
        height: '100%',
        p: 3,
        bgcolor: getBackgroundColor(),
        borderRadius: '16px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
        transition: 'background-color 0.3s',
        display: 'flex',
        flexDirection: 'column',
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
      <Box sx={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {isEditing ? (
          <>
            <TextField
              fullWidth
              value={editedTitle}
              onChange={(e) => onEditTitle(e.target.value)}
              variant="standard"
              sx={{ mb: 2, '& input': { fontSize: '2rem', fontFamily: "'Ghibli', 'Noto Sans KR', sans-serif", color: '#2c5530', textAlign: 'center' } }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 3 }}>
              {Object.entries(NOTE_COLORS).map(([colorKey, colorData]) => (
                <Button
                  key={colorKey}
                  onClick={() => onEditColor(colorKey as NoteColor)}
                  sx={{
                    width: 36, height: 36, minWidth: 'unset', p: 0, borderRadius: '50%',
                    bgcolor: colorData.bg, border: editedColor === colorKey ? '2px solid #666' : '2px solid transparent',
                    '&:hover': { bgcolor: colorData.hover }
                  }}
                  title={colorData.name}
                />
              ))}
            </Box>
            <TextField
              fullWidth
              multiline
              rows={12}
              value={editedContent}
              onChange={(e) => onEditContent(e.target.value)}
              variant="standard"
              sx={{ flex: 1, '& textarea': { fontSize: '1.1rem', fontFamily: "'Ghibli', 'Noto Sans KR', sans-serif", color: '#444', lineHeight: 1.8 } }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
              <Button startIcon={<CancelIcon />} onClick={onCancelEdit} sx={{ color: '#666' }}>취소</Button>
              <Button startIcon={<SaveIcon />} onClick={onSaveEdit} sx={{ bgcolor: '#9cbb9c', color: 'white', '&:hover': { bgcolor: '#7a9e7a' } }}>저장</Button>
            </Box>
          </>
        ) : (
          <>
            <Box sx={{ position: 'relative', mb: 2, textAlign: 'center' }}>
              <Typography variant="h4" sx={{ color: '#2c5530', fontFamily: "'Ghibli', 'Noto Sans KR', sans-serif", fontWeight: 'bold', fontSize: '1.6rem' }}>
                {note.title}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="caption" sx={{ color: '#666', fontStyle: 'italic' }}>
                {note.createdAt ? formatDate(note.createdAt) : ''}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton onClick={onStartEdit} size="small" sx={{ color: '#9cbb9c', p: 0.5 }}><EditIcon fontSize="small" /></IconButton>
              </Box>
            </Box>
            <Typography sx={{ flex: 1, whiteSpace: 'pre-wrap', lineHeight: 1.8, color: '#444', fontFamily: "'Ghibli', 'Noto Sans KR', sans-serif", fontSize: '1.1rem' }}>
              {note.content}
            </Typography>
          </>
        )}
      </Box>
    </Paper>
  );
};

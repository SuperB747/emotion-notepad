import React from 'react';
import { Paper, Typography } from '@mui/material';
import type { Note as NoteType } from '../../types/noteTypes';
import { NOTE_COLORS } from '../../constants/noteConstants';

interface NoteProps {
  note: NoteType;
  onClick?: () => void;
}

const Note: React.FC<NoteProps> = ({ note, onClick }) => {
  const noteStyle = {
    backgroundColor: NOTE_COLORS[note.color || 'yellow'].bg,
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    cursor: 'pointer',
    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
    }
  };

  return (
    <Paper sx={noteStyle} onClick={onClick}>
      <Typography variant="h6" sx={{ mb: 1 }}>{note.title}</Typography>
      <Typography noWrap>{note.content}</Typography>
    </Paper>
  );
};

export default Note; 
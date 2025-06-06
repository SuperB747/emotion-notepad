import React, { useState } from 'react';
import { Box, Typography, Switch, Button, CircularProgress } from '@mui/material';
import { Save, Check, Shuffle } from '@mui/icons-material';
import type { Note } from '../../types/noteTypes';

interface NoteDisplayProps {
  selectedNote: Note | null;
  currentFolderId: string | null;
  currentFolderName: string;
  notesCount: number;
  isOCDMode: boolean;
  onOCDToggle: (checked: boolean) => void;
  onShuffle: () => void;
  onSaveLayout: () => void;
  isLayoutSaving: boolean;
  showSaveSuccess: boolean;
}

export const NoteDisplay: React.FC<NoteDisplayProps> = ({ 
  selectedNote,
  currentFolderId,
  currentFolderName,
  notesCount,
  isOCDMode,
  onOCDToggle,
  onShuffle,
  onSaveLayout,
  isLayoutSaving,
  showSaveSuccess
}) => {
  const renderNoteControls = () => (
    <Box sx={{
      position: 'fixed',
      top: 16,
      right: 16,
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      bgcolor: 'rgba(255, 255, 255, 0.8)',
      padding: '6px 12px',
      borderRadius: '12px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      zIndex: 2000,
      backdropFilter: 'blur(10px)',
    }}>
      <Typography sx={{ fontWeight: 600, color: '#2c5530', whiteSpace: 'nowrap' }}>
        {currentFolderName}
        <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>
          ({notesCount}개)
        </span>
      </Typography>
      <Box sx={{ height: '24px', width: '1px', bgcolor: 'rgba(0,0,0,0.1)' }} />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Typography sx={{ fontWeight: 600, color: isOCDMode ? '#2c5530' : '#666' }}>OCD</Typography>
        <Switch 
          size="small" 
          checked={isOCDMode} 
          onChange={(e) => onOCDToggle(e.target.checked)}
          sx={{
            '& .MuiSwitch-switchBase.Mui-checked': {
              color: '#2c5530',
            },
            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
              backgroundColor: '#9cbb9c',
            },
          }}
        />
      </Box>
      <Box sx={{ height: '24px', width: '1px', bgcolor: 'rgba(0,0,0,0.1)' }} />
      <Button 
        size="small" 
        onClick={onShuffle} 
        startIcon={<Shuffle />}
        sx={{
          color: '#2c5530',
          '&:hover': {
            backgroundColor: 'rgba(44, 85, 48, 0.08)',
          },
        }}
      >
        노트섞기
      </Button>
      <Box sx={{ height: '24px', width: '1px', bgcolor: 'rgba(0,0,0,0.1)' }} />
      <Button 
        size="small" 
        onClick={onSaveLayout} 
        disabled={isLayoutSaving} 
        startIcon={showSaveSuccess ? <Check /> : <Save />} 
        sx={{ 
          minWidth: '120px',
          color: '#2c5530',
          '&:hover': {
            backgroundColor: 'rgba(44, 85, 48, 0.08)',
          },
          '&.Mui-disabled': {
            color: 'rgba(44, 85, 48, 0.5)',
          },
        }}
      >
        {isLayoutSaving ? <CircularProgress size={14} /> : (showSaveSuccess ? '저장됨' : '레이아웃 저장')}
      </Button>
    </Box>
  );

  return (
    <Box 
      sx={{ 
        flexGrow: 1, 
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#f5f5f5',
        position: 'relative',
      }}
    >
      {renderNoteControls()}
      {selectedNote ? (
        <Box sx={{ p: 4, maxWidth: '800px', width: '100%' }}>
          <Typography variant="h4" sx={{ mb: 2 }}>{selectedNote.title}</Typography>
          <Typography>{selectedNote.content}</Typography>
        </Box>
      ) : (
        <Typography variant="h6" color="text.secondary">
          왼쪽에서 노트를 선택해주세요
        </Typography>
      )}
    </Box>
  );
};

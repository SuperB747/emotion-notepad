import React, { useState, useCallback, useEffect } from 'react';
import { Box, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Fab, Snackbar } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import { NoteSidebar } from './NoteSidebar';
import { NoteDisplay } from './NoteDisplay';
import { useNoteData } from '../../hooks/useNoteData';
import { useNoteLayout } from '../../hooks/useNoteLayout';
import { useNoteInteraction } from '../../hooks/useNoteInteraction';
import type { Note, NoteColor, NotePosition } from '../../types/noteTypes';

export const NoteList = () => {
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const showSnackbar = (message: string) => setSnackbarMessage(message);
  const [containerSize, setContainerSize] = useState<{width: number, height: number} | null>(null);
  const [notePositions, setNotePositions] = useState<Record<string, NotePosition>>({});
  const [isOCDMode, setIsOCDMode] = useState(false);

  const {
    user, notes, folders, currentFolderId, selectedNote, backgroundNotes,
    setCurrentFolderId, setSelectedNote,
    handleLogout, handleCreateFolder, handleDeleteFolder, handleDeleteNote, handleNoteUpdate,
    formatDate
  } = useNoteData();

  const {
    isDragging,
    handleNoteSelect,
    handleDragStart,
    handleDragEnd,
    handleNoteDrag,
    handleNoteUpdate: handleInteractionNoteUpdate,
  } = useNoteInteraction(
    notes,
    selectedNote,
    setSelectedNote,
    notePositions,
    setNotePositions,
    handleNoteUpdate,
  );
  
  const {
    isLayoutSaving, showSaveSuccess, saveFolderLayout, shuffleNotes,
  } = useNoteLayout(user, notes, currentFolderId, folders, notePositions, setNotePositions, isOCDMode, setIsOCDMode, containerSize, selectedNote, setSelectedNote);


  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});

  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [editedColor, setEditedColor] = useState<NoteColor>('yellow');

  const navigate = useNavigate();

  useEffect(() => {
    if (selectedNote && !isEditing) {
      setEditedTitle(selectedNote.title);
      setEditedContent(selectedNote.content);
      setEditedColor(selectedNote.color || 'yellow');
    }
  }, [selectedNote, isEditing]);

  useEffect(() => {
    // When the selected note changes, exit editing mode.
    setIsEditing(false);
  }, [selectedNote]);

  const handleCreateFolderAndCloseDialog = () => {
    handleCreateFolder(newFolderName).then(() => showSnackbar('폴더가 생성되었습니다.')).catch(() => showSnackbar('폴더 생성에 실패했습니다.'));
    setIsNewFolderDialogOpen(false);
    setNewFolderName('');
  };

  const handleFolderToggle = (folderId: string) => {
    setOpenFolders(prev => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  const handleStartEdit = () => {
    if (!selectedNote) return;
    setIsEditing(true);
    setEditedTitle(selectedNote.title);
    setEditedContent(selectedNote.content);
    setEditedColor(selectedNote.color || 'yellow');
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!selectedNote) return;
    try {
      await handleNoteUpdate(selectedNote.id, {
        title: editedTitle,
        content: editedContent,
        color: editedColor,
      });
      setIsEditing(false);
      showSnackbar('노트가 저장되었습니다.');
    } catch (error) {
      showSnackbar('노트 저장에 실패했습니다.');
    }
  };

  const currentFolderName = currentFolderId
    ? folders.find(f => f.id === currentFolderId)?.name || ''
    : '메인 보드';
  
  return (
    <Box sx={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <NoteSidebar
        user={user}
        notes={notes}
        folders={folders}
        selectedNote={selectedNote}
        currentFolderId={currentFolderId}
        openFolders={openFolders}
        onLogout={handleLogout}
        onNewFolderOpen={() => setIsNewFolderDialogOpen(true)}
        onFolderChange={setCurrentFolderId}
        onFolderToggle={handleFolderToggle}
        onNoteSelect={handleNoteSelect}
        onDeleteFolder={handleDeleteFolder}
        onDeleteNote={handleDeleteNote}
        formatDate={formatDate}
      />
      <NoteDisplay
        notes={notes}
        folders={folders}
        selectedNote={selectedNote}
        notePositions={notePositions}
        currentFolderId={currentFolderId}
        isOCDMode={isOCDMode}
        isLayoutSaving={isLayoutSaving}
        showSaveSuccess={showSaveSuccess}
        isDragging={isDragging}
        onOCDToggle={setIsOCDMode}
        onShuffle={shuffleNotes}
        onSaveLayout={saveFolderLayout}
        onNoteSelect={handleNoteSelect}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onNoteDrag={handleNoteDrag}
        isEditing={isEditing}
        editedTitle={editedTitle}
        editedContent={editedContent}
        editedColor={editedColor}
        onEditTitle={setEditedTitle}
        onEditContent={setEditedContent}
        onEditColor={setEditedColor}
        onStartEdit={handleStartEdit}
        onCancelEdit={handleCancelEdit}
        onSaveEdit={handleSaveEdit}
        formatDate={formatDate}
        setContainerSize={setContainerSize}
        currentFolderName={currentFolderName}
      />

      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 32, right: 32, bgcolor: '#9cbb9c', '&:hover': { bgcolor: '#7a9e7a' } }}
        onClick={() => navigate('/notes/new')}
      >
        <AddIcon />
      </Fab>

      <Dialog open={isNewFolderDialogOpen} onClose={() => setIsNewFolderDialogOpen(false)}>
        <DialogTitle>새 폴더 만들기</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="폴더 이름"
            type="text"
            fullWidth
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && newFolderName.trim() && handleCreateFolderAndCloseDialog()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsNewFolderDialogOpen(false)}>취소</Button>
          <Button onClick={handleCreateFolderAndCloseDialog} disabled={!newFolderName.trim()}>만들기</Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar
        open={!!snackbarMessage}
        autoHideDuration={3000}
        onClose={() => setSnackbarMessage('')}
        message={snackbarMessage}
      />
    </Box>
  );
}; 
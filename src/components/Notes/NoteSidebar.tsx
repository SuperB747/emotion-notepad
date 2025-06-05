import React from 'react';
import {
  Paper,
  Box,
  Avatar,
  Typography,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
} from '@mui/material';
import {
  ExitToApp as ExitToAppIcon,
  CreateNewFolder as CreateNewFolderIcon,
  NoteAlt as NoteIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import type { Folder, Note } from '../../types/noteTypes';

interface NoteSidebarProps {
  user: any;
  notes: Note[];
  folders: Folder[];
  selectedNote: Note | null;
  currentFolderId: string | null;
  openFolders: Record<string, boolean>;
  onLogout: () => void;
  onNewFolderOpen: () => void;
  onFolderChange: (folderId: string | null) => void;
  onFolderToggle: (folderId: string) => void;
  onNoteSelect: (note: Note) => void;
  onDeleteFolder: (folderId: string) => void;
  onDeleteNote: (noteId: string) => void;
  formatDate: (date: any) => string;
}

export const NoteSidebar = ({
  user,
  notes,
  folders,
  selectedNote,
  currentFolderId,
  openFolders,
  onLogout,
  onNewFolderOpen,
  onFolderChange,
  onFolderToggle,
  onNoteSelect,
  onDeleteFolder,
  onDeleteNote,
  formatDate,
}: NoteSidebarProps) => {

  const renderRootNotes = () => {
    const rootNotes = notes.filter(note => !note.folderId);
    return (
      <List component="div" disablePadding>
        {rootNotes.map(note => (
          <ListItemButton
            key={note.id}
            selected={selectedNote?.id === note.id}
            onClick={() => onNoteSelect(note)}
            sx={{
              pl: 4,
              '&.Mui-selected': { bgcolor: 'rgba(158, 187, 166, 0.2)', '&:hover': { bgcolor: 'rgba(158, 187, 166, 0.3)' } },
            }}
          >
            <ListItemIcon><NoteIcon /></ListItemIcon>
            <ListItemText
              primary={note.title}
              secondary={formatDate(note.createdAt)}
              primaryTypographyProps={{ style: { fontWeight: selectedNote?.id === note.id ? 600 : 400, color: '#2c5530' } }}
            />
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDeleteNote(note.id); }}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </ListItemButton>
        ))}
      </List>
    );
  };

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        width: 280,
        height: '100vh',
        bgcolor: 'background.paper',
        borderRight: '1px solid rgba(0, 0, 0, 0.12)',
        display: 'flex', 
        flexDirection: 'column',
      }}
    >
      <Box sx={{ 
        p: 2, 
        borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        bgcolor: 'rgba(158, 187, 166, 0.4)',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ bgcolor: '#9cbb9c' }}>
            {user?.email?.[0].toUpperCase() || 'U'}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {user?.email?.split('@')[0]}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              메모 {notes.length}개
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onLogout} size="small">
          <ExitToAppIcon />
        </IconButton>
      </Box>

      <List sx={{ flex: 1, overflow: 'auto' }}>
        <ListItemButton onClick={onNewFolderOpen}>
          <ListItemIcon><CreateNewFolderIcon /></ListItemIcon>
          <ListItemText primary="새 폴더 만들기" />
        </ListItemButton>

        <ListItemButton
          selected={!currentFolderId}
          onClick={() => onFolderChange(null)}
          sx={{ '&.Mui-selected': { bgcolor: 'rgba(158, 187, 166, 0.2)', '&:hover': { bgcolor: 'rgba(158, 187, 166, 0.3)' } } }}
        >
          <ListItemIcon><NoteIcon /></ListItemIcon>
          <ListItemText 
            primary="전체 노트"
            primaryTypographyProps={{ style: { fontWeight: !currentFolderId ? 600 : 400, color: '#2c5530' } }}
          />
        </ListItemButton>
        <Collapse in={!currentFolderId || currentFolderId === null} timeout="auto" unmountOnExit>
          {renderRootNotes()}
        </Collapse>
        {folders.map(folder => (
          <React.Fragment key={folder.id}>
            <ListItemButton
              onClick={() => { onFolderToggle(folder.id); onFolderChange(folder.id); }}
              selected={currentFolderId === folder.id}
              sx={{ '&.Mui-selected': { bgcolor: 'rgba(158, 187, 166, 0.2)', '&:hover': { bgcolor: 'rgba(158, 187, 166, 0.3)' } } }}
            >
              <ListItemIcon>{openFolders[folder.id] ? <FolderOpenIcon /> : <FolderIcon />}</ListItemIcon>
              <ListItemText 
                primary={folder.name}
                primaryTypographyProps={{ style: { fontWeight: currentFolderId === folder.id ? 600 : 400, color: '#2c5530' } }}
              />
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder.id); }}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </ListItemButton>
            <Collapse in={openFolders[folder.id]} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {notes
                  .filter(note => note.folderId === folder.id)
                  .map(note => (
                    <ListItemButton
                      key={note.id}
                      selected={selectedNote?.id === note.id}
                      onClick={() => onNoteSelect(note)}
                      sx={{ pl: 4, '&.Mui-selected': { bgcolor: 'rgba(158, 187, 166, 0.2)', '&:hover': { bgcolor: 'rgba(158, 187, 166, 0.3)' } } }}
                    >
                      <ListItemIcon><NoteIcon /></ListItemIcon>
                      <ListItemText 
                        primary={note.title}
                        secondary={formatDate(note.createdAt)}
                        primaryTypographyProps={{ style: { fontWeight: selectedNote?.id === note.id ? 600 : 400, color: '#2c5530' } }}
                      />
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDeleteNote(note.id); }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </ListItemButton>
                  ))}
              </List>
            </Collapse>
          </React.Fragment>
        ))}
      </List>
    </Paper>
  );
};

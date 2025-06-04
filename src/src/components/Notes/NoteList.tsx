import React, { useState, useEffect } from 'react';
import { db, auth } from '../../config/firebase';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
// @ts-ignore
import totoroBg from '/totoro-bg.png';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Snackbar,
  Paper,
  Divider,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  TextField,
  ListItemIcon,
  Collapse,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  AccountCircle as AccountCircleIcon,
  ExitToApp as ExitToAppIcon,
  NoteAlt as NoteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  CreateNewFolder as CreateNewFolderIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: any;
  folderId?: string | null;
}

interface Folder {
  id: string;
  name: string;
  isOpen: boolean;
}

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
}

const SortableItem = ({ id, children }: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
};

export const NoteList = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const navigate = useNavigate();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      setSnackbarMessage('로그아웃 중 오류가 발생했습니다.');
      setSnackbarOpen(true);
    }
  };

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // Subscribe to notes
    const notesRef = collection(db, `users/${user.uid}/notes`);
    const notesQuery = query(notesRef, orderBy('createdAt', 'desc'));

    const unsubscribeNotes = onSnapshot(notesQuery, (snapshot) => {
      const notesList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Note[];
      setNotes(notesList);
      
      if (notesList.length > 0 && !selectedNote) {
        setSelectedNote(notesList[0]);
      }
    });

    // Subscribe to folders
    const foldersRef = collection(db, `users/${user.uid}/folders`);
    const foldersQuery = query(foldersRef, orderBy('name'));

    const unsubscribeFolders = onSnapshot(foldersQuery, (snapshot) => {
      const foldersList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Folder[];
      setFolders(foldersList);
    });

    return () => {
      unsubscribeNotes();
      unsubscribeFolders();
    };
  }, []);

  const handleDeleteClick = (noteId: string) => {
    setNoteToDelete(noteId);
    setFolderToDelete(null);
    setDeleteDialogOpen(true);
  };

  const handleDeleteFolderClick = (folderId: string) => {
    setFolderToDelete(folderId);
    setNoteToDelete(null);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      if (noteToDelete) {
        await deleteDoc(doc(db, `users/${user.uid}/notes/${noteToDelete}`));
        setSnackbarMessage('메모가 삭제되었습니다.');
        
        if (selectedNote?.id === noteToDelete) {
          setSelectedNote(notes.find(note => note.id !== noteToDelete) || null);
        }
      } else if (folderToDelete) {
        // Delete folder
        await deleteDoc(doc(db, `users/${user.uid}/folders/${folderToDelete}`));
        
        // Update all notes in the folder to have no folder
        const notesToUpdate = notes.filter(note => note.folderId === folderToDelete);
        await Promise.all(notesToUpdate.map(note => 
          updateDoc(doc(db, `users/${user.uid}/notes/${note.id}`), {
            folderId: null
          })
        ));
        
        setSnackbarMessage('폴더가 삭제되었습니다.');
      }
      
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage('삭제 중 오류가 발생했습니다.');
      setSnackbarOpen(true);
    }

    setDeleteDialogOpen(false);
    setNoteToDelete(null);
    setFolderToDelete(null);
  };

  const formatDate = (date: any) => {
    return new Date(date.toDate()).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleEditClick = () => {
    if (selectedNote) {
      setEditedTitle(selectedNote.title);
      setEditedContent(selectedNote.content);
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    try {
      if (!selectedNote) return;
      
      const user = auth.currentUser;
      if (!user) return;

      await updateDoc(doc(db, `users/${user.uid}/notes/${selectedNote.id}`), {
        title: editedTitle,
        content: editedContent,
      });

      setIsEditing(false);
      setSnackbarMessage('메모가 수정되었습니다.');
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage('수정 중 오류가 발생했습니다.');
      setSnackbarOpen(true);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (selectedNote) {
      setEditedTitle(selectedNote.title);
      setEditedContent(selectedNote.content);
    }
  };

  const handleCreateFolder = async () => {
    try {
      const user = auth.currentUser;
      if (!user || !newFolderName.trim()) return;

      const foldersRef = collection(db, `users/${user.uid}/folders`);
      await addDoc(foldersRef, {
        name: newFolderName.trim(),
        isOpen: true,
        createdAt: serverTimestamp(),
      });

      setNewFolderName('');
      setNewFolderDialogOpen(false);
    } catch (error) {
      setSnackbarMessage('폴더 생성 중 오류가 발생했습니다.');
      setSnackbarOpen(true);
    }
  };

  const toggleFolder = async (folderId: string) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const folderRef = doc(db, `users/${user.uid}/folders/${folderId}`);
      const folder = folders.find(f => f.id === folderId);
      if (folder) {
        await updateDoc(folderRef, {
          isOpen: !folder.isOpen
        });
      }
    } catch (error) {
      setSnackbarMessage('폴더 상태 변경 중 오류가 발생했습니다.');
      setSnackbarOpen(true);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    try {
      const user = auth.currentUser;
      if (!user) return;

      const noteId = active.id as string;
      const targetId = over.id as string;
      const targetFolderId = targetId === 'root' ? null : targetId;

      // Update note's folder in Firestore
      const noteRef = doc(db, `users/${user.uid}/notes/${noteId}`);
      await updateDoc(noteRef, {
        folderId: targetFolderId
      });
    } catch (error) {
      setSnackbarMessage('메모 이동 중 오류가 발생했습니다.');
      setSnackbarOpen(true);
    }
  };

  const renderNoteList = () => (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
        <ListItem>
          <ListItemIcon>
            <IconButton onClick={() => setNewFolderDialogOpen(true)}>
              <CreateNewFolderIcon />
            </IconButton>
          </ListItemIcon>
          <ListItemText primary="새 폴더 만들기" />
        </ListItem>

        <SortableContext
          items={notes.filter(note => !note.folderId).map(note => note.id)}
          strategy={verticalListSortingStrategy}
        >
          {notes.filter(note => !note.folderId).map((note) => (
            <SortableItem key={note.id} id={note.id}>
              <ListItem
                selected={selectedNote?.id === note.id}
                onClick={() => setSelectedNote(note)}
                sx={{
                  borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
                  cursor: 'pointer',
                  '&.Mui-selected': {
                    bgcolor: 'rgba(158, 187, 166, 0.2)',
                    '&:hover': {
                      bgcolor: 'rgba(158, 187, 166, 0.3)',
                    },
                  },
                  '&:hover': {
                    bgcolor: 'rgba(158, 187, 166, 0.1)',
                  },
                }}
              >
                <ListItemIcon>
                  <NoteIcon />
                </ListItemIcon>
                <ListItemText 
                  primary={note.title}
                  secondary={formatDate(note.createdAt)}
                  primaryTypographyProps={{
                    noWrap: true,
                    style: { 
                      fontWeight: selectedNote?.id === note.id ? 600 : 400,
                      color: '#2c5530',
                    }
                  }}
                  secondaryTypographyProps={{
                    style: { color: '#666' }
                  }}
                />
                <IconButton
                  edge="end"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(note.id);
                  }}
                  sx={{ color: '#666' }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </ListItem>
            </SortableItem>
          ))}
        </SortableContext>

        {folders.map(folder => (
          <React.Fragment key={folder.id}>
            <ListItem
              sx={{
                bgcolor: 'rgba(158, 187, 166, 0.1)',
                borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
              }}
            >
              <ListItemIcon onClick={() => toggleFolder(folder.id)} sx={{ cursor: 'pointer' }}>
                {folder.isOpen ? <FolderOpenIcon /> : <FolderIcon />}
              </ListItemIcon>
              <ListItemText 
                primary={folder.name}
                primaryTypographyProps={{
                  style: { color: '#2c5530', fontWeight: 500 }
                }}
              />
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteFolderClick(folder.id);
                }}
                sx={{ color: '#666', mr: 1 }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
              <IconButton onClick={() => toggleFolder(folder.id)}>
                {folder.isOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </ListItem>
            <Collapse in={folder.isOpen}>
              <SortableContext
                items={notes.filter(note => note.folderId === folder.id).map(note => note.id)}
                strategy={verticalListSortingStrategy}
              >
                {notes.filter(note => note.folderId === folder.id).map((note) => (
                  <SortableItem key={note.id} id={note.id}>
                    <ListItem
                      selected={selectedNote?.id === note.id}
                      onClick={() => setSelectedNote(note)}
                      sx={{
                        pl: 4,
                        borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
                        cursor: 'pointer',
                        '&.Mui-selected': {
                          bgcolor: 'rgba(158, 187, 166, 0.2)',
                          '&:hover': {
                            bgcolor: 'rgba(158, 187, 166, 0.3)',
                          },
                        },
                        '&:hover': {
                          bgcolor: 'rgba(158, 187, 166, 0.1)',
                        },
                      }}
                    >
                      <ListItemIcon>
                        <NoteIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary={note.title}
                        secondary={formatDate(note.createdAt)}
                        primaryTypographyProps={{
                          noWrap: true,
                          style: { 
                            fontWeight: selectedNote?.id === note.id ? 600 : 400,
                            color: '#2c5530',
                          }
                        }}
                        secondaryTypographyProps={{
                          style: { color: '#666' }
                        }}
                      />
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(note.id);
                        }}
                        sx={{ color: '#666' }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </ListItem>
                  </SortableItem>
                ))}
              </SortableContext>
            </Collapse>
          </React.Fragment>
        ))}
      </List>

      <Dialog open={newFolderDialogOpen} onClose={() => setNewFolderDialogOpen(false)}>
        <DialogTitle>새 폴더 만들기</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="폴더 이름"
            fullWidth
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewFolderDialogOpen(false)}>취소</Button>
          <Button onClick={handleCreateFolder} color="primary">만들기</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>
          {noteToDelete ? '메모 삭제' : '폴더 삭제'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {noteToDelete 
              ? '이 메모를 삭제하시겠습니까?' 
              : '이 폴더를 삭제하시겠습니까? 폴더 안의 메모들은 폴더 밖으로 이동됩니다.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>취소</Button>
          <Button onClick={handleDeleteConfirm} color="error">삭제</Button>
        </DialogActions>
      </Dialog>
    </DndContext>
  );

  return (
    <Box sx={{ 
      position: 'relative',
      height: '100vh',
      width: '100%',
      display: 'flex',
      zIndex: 1,
    }}>
      {/* 메모 목록 */}
      <Paper 
        elevation={3} 
        sx={{ 
          width: 300, 
          bgcolor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* 사용자 정보 */}
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
              {auth.currentUser?.email?.[0].toUpperCase() || 'U'}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {auth.currentUser?.email?.split('@')[0]}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                메모 {notes.length}개
              </Typography>
            </Box>
          </Box>
          <Tooltip title="로그아웃">
            <IconButton onClick={handleLogout} size="small">
              <ExitToAppIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {renderNoteList()}
      </Paper>

      {/* 메모 내용 */}
      <Box sx={{ 
        flex: 1, 
        p: 3, 
        overflow: 'auto',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        pt: 8,
      }}>
        {selectedNote ? (
          <Paper
            elevation={3}
            sx={{
              width: '100%',
              maxWidth: '600px',
              minHeight: '400px',
              p: 3,
              bgcolor: '#fdffa1',
              position: 'relative',
              borderRadius: '16px',
              boxShadow: '3px 3px 12px rgba(0,0,0,0.15)',
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
              {isEditing ? (
                <>
                  <TextField
                    fullWidth
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    variant="standard"
                    sx={{
                      mb: 3,
                      '& input': {
                        fontSize: '2rem',
                        fontFamily: "'Ghibli', 'Noto Sans KR', sans-serif",
                        color: '#2c5530',
                        textAlign: 'center',
                      },
                    }}
                  />
                  <TextField
                    fullWidth
                    multiline
                    rows={12}
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    variant="standard"
                    sx={{
                      '& textarea': {
                        fontSize: '1.1rem',
                        fontFamily: "'Ghibli', 'Noto Sans KR', sans-serif",
                        color: '#444',
                        lineHeight: 1.8,
                      },
                    }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
                    <Button
                      startIcon={<CancelIcon />}
                      onClick={handleCancel}
                      sx={{ color: '#666' }}
                    >
                      취소
                    </Button>
                    <Button
                      startIcon={<SaveIcon />}
                      onClick={handleSave}
                      sx={{
                        bgcolor: '#9cbb9c',
                        color: 'white',
                        '&:hover': {
                          bgcolor: '#7a9e7a',
                        },
                      }}
                    >
                      저장
                    </Button>
                  </Box>
                </>
              ) : (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography 
                      variant="h4" 
                      sx={{ 
                        color: '#2c5530',
                        fontFamily: "'Ghibli', 'Noto Sans KR', sans-serif",
                        fontWeight: 'bold',
                        textShadow: '1px 1px 0 rgba(255,255,255,0.5)',
                        flex: 1,
                        textAlign: 'center',
                      }}
                    >
                      {selectedNote.title}
                    </Typography>
                    <IconButton 
                      onClick={handleEditClick}
                      sx={{ 
                        color: '#9cbb9c',
                        '&:hover': {
                          bgcolor: 'rgba(156, 187, 156, 0.1)',
                        },
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                  </Box>
                  
                  <Typography 
                    variant="caption" 
                    display="block" 
                    sx={{
                      textAlign: 'right',
                      color: '#666',
                      mb: 3,
                      fontStyle: 'italic',
                    }}
                  >
                    {formatDate(selectedNote.createdAt)}
                  </Typography>

                  <Typography
                    sx={{
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.8,
                      color: '#444',
                      fontFamily: "'Ghibli', 'Noto Sans KR', sans-serif",
                      fontSize: '1.1rem',
                    }}
                  >
                    {selectedNote.content}
                  </Typography>
                </>
              )}
            </Box>
          </Paper>
        ) : (
          <Box 
            sx={{ 
              height: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 2,
              opacity: 0.5,
            }}
          >
            <img 
              src="/memo-icon.svg" 
              alt="메모 아이콘" 
              style={{ 
                width: '100px',
                height: '100px',
                opacity: 0.3,
              }}
            />
            <Typography 
              color="text.secondary"
              sx={{
                fontFamily: "'Ghibli', 'Noto Sans KR', sans-serif",
                fontSize: '1.2rem',
              }}
            >
              왼쪽에서 메모를 선택해주세요
            </Typography>
          </Box>
        )}
      </Box>

      {/* 새 메모 작성 버튼 */}
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          bgcolor: '#9cbb9c',
          '&:hover': {
            bgcolor: '#7a9e7a',
          },
        }}
        onClick={() => navigate('/notes/new')}
      >
        <AddIcon />
      </Fab>

      {/* 알림 */}
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
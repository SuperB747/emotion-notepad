import React, { useState, useEffect } from 'react';
import { db, auth } from '../../config/firebase';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import {
  Box,
  List,
  ListItemButton,
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
  Typography,
  Avatar,
  TextField,
  ListItemIcon,
  Switch,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ExitToApp as ExitToAppIcon,
  NoteAlt as NoteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: any;
  userId: string;
  color?: 'yellow' | 'green' | 'blue' | 'pink' | 'pastelPink' | 'pastelBlue' | 'pastelGreen' | 'pastelPurple' | 'pastelOrange' | 'pastelYellow';
}

interface NotePosition {
  x: number;
  y: number;
  rotate: number;
}

interface NoteCardProps {
  note: Note;
  isSelected: boolean;
  position: NotePosition;
  onSelect: () => void;
  onPositionChange: (newPosition: NotePosition) => void;
  isEditing: boolean;
  editedTitle: string;
  editedContent: string;
  onEditTitle: (value: string) => void;
  onEditContent: (value: string) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  formatDate: (date: any) => string;
}

// 노트 색상 설정
export const NOTE_COLORS = {
  yellow: {
    name: '형광 노랑',
    bg: '#ffff8d',
    hover: '#fff59d'
  },
  green: {
    name: '형광 초록',
    bg: '#b2ff59',
    hover: '#ccff90'
  },
  blue: {
    name: '형광 파랑',
    bg: '#81d4fa',
    hover: '#b3e5fc'
  },
  pink: {
    name: '형광 핑크',
    bg: '#ff80ab',
    hover: '#ff9ec7'
  },
  pastelPink: {
    name: '파스텔 핑크',
    bg: '#ffd1dc',
    hover: '#ffe4e9'
  },
  pastelBlue: {
    name: '파스텔 블루',
    bg: '#b5d8eb',
    hover: '#c9e3f0'
  },
  pastelGreen: {
    name: '파스텔 그린',
    bg: '#c1e1c1',
    hover: '#d4ebd4'
  },
  pastelPurple: {
    name: '파스텔 퍼플',
    bg: '#e0c1f0',
    hover: '#e8d3f3'
  },
  pastelOrange: {
    name: '파스텔 오렌지',
    bg: '#ffd4b8',
    hover: '#ffe2cf'
  },
  pastelYellow: {
    name: '파스텔 옐로우',
    bg: '#fff4bd',
    hover: '#fff7d1'
  }
} as const;

export type NoteColor = keyof typeof NOTE_COLORS;

// 색상 유효성 검사 함수
const isValidColor = (color: string | undefined): color is NoteColor => {
  return color !== undefined && color in NOTE_COLORS;
};

// 노트 컴포넌트를 분리하여 Hooks 규칙 준수
const NoteCard = ({ 
  note, 
  isSelected, 
  position,
  onSelect,
  onPositionChange,
  isEditing,
  editedTitle,
  editedContent,
  onEditTitle,
  onEditContent,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  formatDate
}: NoteCardProps) => {
  const selectedScale = 0.9;
  const backgroundScale = 0.6;

  return (
    <motion.div
      layout
      layoutId={note.id}
      initial={false}
      animate={{
        scale: isSelected ? selectedScale : backgroundScale,
        x: isSelected ? 0 : position.x,
        y: isSelected ? 0 : position.y,
        rotate: isSelected ? 0 : position.rotate,
        opacity: isSelected ? 1 : 0.95,
        zIndex: isSelected ? 50 : 10,
        filter: isSelected ? 'blur(0px)' : 'blur(0.5px)'
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 30,
        mass: 1,
        layout: {
          type: "spring",
          stiffness: 400,
          damping: 30
        }
      }}
      drag={!isSelected}
      dragConstraints={{
        top: -100,
        left: -400,
        right: 400,
        bottom: 300,
      }}
      dragElastic={0.1}
      dragMomentum={false}
      onDragEnd={(event, info) => {
        if (!isSelected) {
          const newPosition = {
            x: info.point.x,
            y: info.point.y,
            rotate: position.rotate
          };
          onPositionChange(newPosition);
        }
      }}
      style={{
        position: 'absolute',
        width: '500px',
        transformOrigin: 'center center',
        cursor: isSelected ? 'default' : 'pointer',
        transformStyle: 'preserve-3d'
      }}
      onClick={() => !isSelected && onSelect()}
    >
      <Paper
        elevation={isSelected ? 8 : 3}
        sx={{
          width: '100%',
          minHeight: '350px',
          p: 3,
          bgcolor: isSelected ? '#fdffa1' : '#fff5e6',
          position: 'relative',
          borderRadius: '16px',
          boxShadow: isSelected 
            ? '3px 3px 12px rgba(0,0,0,0.2)' 
            : '2px 2px 8px rgba(0,0,0,0.1)',
          transition: 'all 0.3s ease',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: isSelected ? '80px' : '40px',
            height: isSelected ? '25px' : '15px',
            bgcolor: '#9cbb9c',
            borderRadius: '0 0 12px 12px',
            boxShadow: 'inset 0 -5px 8px rgba(0,0,0,0.1)',
          },
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          {isSelected && isEditing ? (
            <>
              <TextField
                fullWidth
                value={editedTitle}
                onChange={(e) => onEditTitle(e.target.value)}
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
                onChange={(e) => onEditContent(e.target.value)}
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
                  onClick={onCancelEdit}
                  sx={{ color: '#666' }}
                >
                  취소
                </Button>
                <Button
                  startIcon={<SaveIcon />}
                  onClick={onSaveEdit}
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
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: 2 
              }}>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    position: 'relative',
                    color: '#2c5530',
                    fontFamily: "'Ghibli', 'Noto Sans KR', sans-serif",
                    fontWeight: 'bold',
                    textShadow: '1px 1px 0 rgba(255,255,255,0.5)',
                    fontSize: '1.6rem',
                  }}
                >
                  {note.title}
                </Typography>
                {isSelected && (
                  <IconButton 
                    onClick={onStartEdit}
                    sx={{ 
                      position: 'absolute',
                      right: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#9cbb9c',
                      '&:hover': {
                        bgcolor: 'rgba(156, 187, 156, 0.1)',
                      },
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                )}
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
                {note.createdAt ? formatDate(note.createdAt) : ''}
              </Typography>

              <Typography
                sx={{
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.8,
                  color: '#444',
                  fontFamily: "'Ghibli', 'Noto Sans KR', sans-serif",
                  fontSize: '1.1rem',
                  maxHeight: '150px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {note.content}
              </Typography>
            </>
          )}
        </Box>
      </Paper>
    </motion.div>
  );
};

export const NoteList = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [backgroundNotes, setBackgroundNotes] = useState<Note[]>([]);
  const [notePositions, setNotePositions] = useState<Record<string, NotePosition>>({});
  const [isInitialLayout, setIsInitialLayout] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [editedColor, setEditedColor] = useState<NoteColor>('yellow');
  const [recentlySwappedNote, setRecentlySwappedNote] = useState<string | null>(null);
  const [isOCDMode, setIsOCDMode] = useState(false);
  const navigate = useNavigate();

  // Constants for layout calculations
  const MAX_ROTATION = 2; // 최대 회전 각도
  const SAFE_MARGIN = 100; // 화면 경계와의 최소 간격 증가
  const MIN_DISTANCE = 200; // 노트 간 최소 거리
  const MIN_SAME_COLOR_DISTANCE = 350; // 같은 색상 노트 간 최소 거리
  const MIN_MAIN_NOTE_CLEARANCE = 400; // 메인 노트와의 최소 거리
  const MAX_MAIN_NOTE_CLEARANCE = 500; // 메인 노트와의 최대 거리 감소
  const PLACEMENT_ATTEMPTS = 40; // 시도 횟수
  const BASE_SCALE = 0.65; // 배경 노트 기본 스케일
  const HOVER_SCALE = 0.85; // 배경 노트 호버 스케일
  const MAIN_NOTE_WIDTH = 500; // 메인 노트 너비
  const MAIN_NOTE_HEIGHT = 350; // 메인 노트 높이
  const BACKGROUND_NOTE_WIDTH = 300; // 배경 노트 너비
  const BACKGROUND_NOTE_HEIGHT = 220; // 배경 노트 높이
  const FRAME_WIDTH = 1200; // 노트 표시 프레임 너비
  const FRAME_HEIGHT = 800; // 노트 표시 프레임 높이

  // 로그아웃 처리
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      showSnackbar('로그아웃 중 오류가 발생했습니다.');
    }
  };

  // 두 점 사이의 거리 계산
  const getDistance = (x1: number, y1: number, x2: number, y2: number) => {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  };

  // 메인 노트와의 거리 계산
  const getDistanceFromMainNote = (x: number, y: number) => {
    return Math.sqrt(x * x + y * y);
  };

  // 위치가 화면 내에 있는지 확인 (회전을 고려한 체크)
  const isWithinScreen = (x: number, y: number, rotation: number = 0): boolean => {
    const scaledWidth = BACKGROUND_NOTE_WIDTH * BASE_SCALE;
    const scaledHeight = BACKGROUND_NOTE_HEIGHT * BASE_SCALE;
    
    // 회전을 고려한 노트의 실제 차지하는 영역 계산
    const rotationRad = Math.abs(rotation * Math.PI / 180);
    const effectiveWidth = Math.abs(scaledWidth * Math.cos(rotationRad)) + Math.abs(scaledHeight * Math.sin(rotationRad));
    const effectiveHeight = Math.abs(scaledWidth * Math.sin(rotationRad)) + Math.abs(scaledHeight * Math.cos(rotationRad));
    
    // 프레임 내부 여유 공간 계산
    const maxX = FRAME_WIDTH / 2 - effectiveWidth / 2 - SAFE_MARGIN;
    const maxY = FRAME_HEIGHT / 2 - effectiveHeight / 2 - SAFE_MARGIN;
    
    return (
      Math.abs(x) <= maxX &&
      Math.abs(y) <= maxY
    );
  };

  // 위치가 메인 노트와 충분히 떨어져 있는지 확인
  const isPositionValid = (x: number, y: number, positions: Record<string, NotePosition>, currentNote: Note, existingNotes: Note[]): boolean => {
    // 메인 노트와의 거리 체크
    const distanceFromMain = getDistanceFromMainNote(x, y);
    if (distanceFromMain < MIN_MAIN_NOTE_CLEARANCE) {
      return false;
    }

    // 다른 배경 노트들과의 거리 체크
    for (let i = 0; i < existingNotes.length; i++) {
      const otherNote = existingNotes[i];
      const pos = positions[otherNote.id];
      if (!pos) continue;

      const dist = getDistance(x, y, pos.x, pos.y);
      const minRequiredDistance = currentNote.color && otherNote.color && currentNote.color === otherNote.color
        ? MIN_SAME_COLOR_DISTANCE  // 같은 색상일 경우 더 큰 거리 요구
        : MIN_DISTANCE;           // 다른 색상일 경우 기본 거리

      if (dist < minRequiredDistance) {
        return false;
      }
    }

    // 회전을 고려한 화면 범위 체크를 마지막에 수행
    const rotation = (Math.random() - 0.5) * 2 * MAX_ROTATION;
    if (!isWithinScreen(x, y, rotation)) {
      return false;
    }
    
    return true;
  };

  // OCD 모드에서의 노트 위치 계산
  const calculateOCDPosition = (index: number, totalNotes: number): { x: number; y: number } => {
    const GRID_SPACING = 250; // 그리드 간격
    const VERTICAL_OFFSET = 30; // 수직 오프셋
    const OVERLAP_OFFSET = 40; // 겹침 효과를 위한 오프셋
    
    // 3x3 그리드에서 중앙을 제외한 8개 위치 계산
    let gridPosition = index;
    if (gridPosition >= 4) gridPosition++; // 중앙 위치(4)를 건너뛰기

    // 행과 열 계산
    const row = Math.floor(gridPosition / 3) - 1; // -1, 0, 1
    const col = (gridPosition % 3) - 1; // -1, 0, 1

    // 중앙에서 약간 더 가깝게 조정
    const distanceFromCenter = Math.sqrt(col * col + row * row);
    const pullToCenter = 0.2; // 중앙으로 당기는 강도
    
    // 중앙으로 약간 당겨진 위치 계산
    const adjustedX = col * GRID_SPACING * (1 - distanceFromCenter * pullToCenter);
    const adjustedY = row * GRID_SPACING * (1 - distanceFromCenter * pullToCenter);

    // 약간의 오프셋 추가로 자연스러운 겹침 효과
    const offsetX = (index % 2) * OVERLAP_OFFSET;
    const offsetY = (Math.floor(index / 2) % 2) * OVERLAP_OFFSET;

    return {
      x: adjustedX + offsetX,
      y: adjustedY + offsetY + VERTICAL_OFFSET
    };
  };

  // 노트 선택 처리
  const handleNoteSelect = (note: Note) => {
    const oldMainNote = selectedNote;
    const clickedPosition = notePositions[note.id];

    if (oldMainNote?.id === note.id) return; // 같은 노트 선택 시 무시

    setSelectedNote(note);
    setEditedTitle(note.title || '');
    setEditedContent(note.content || '');
    setEditedColor(note.color || 'yellow');
    setIsEditing(false);

    if (oldMainNote) {
      // 배경 노트 배열에서 선택된 노트와 이전 메인 노트의 위치만 교환
      const newBackgroundNotes = backgroundNotes.map(bgNote => 
        bgNote.id === note.id ? oldMainNote : bgNote
      );
      setBackgroundNotes(newBackgroundNotes);

      // 위치 교환 (다른 노트들의 위치는 그대로 유지)
      const newPositions = { ...notePositions };
      // 이전 메인 노트는 선택된 노트의 위치로
      newPositions[oldMainNote.id] = {
        x: clickedPosition.x,
        y: clickedPosition.y,
        rotate: clickedPosition.rotate
      };
      // 새로 선택된 노트는 중앙으로
      newPositions[note.id] = {
        x: 0,
        y: 0,
        rotate: 0
      };
      
      setNotePositions(newPositions);
      setRecentlySwappedNote(oldMainNote.id);
    }
  };

  // OCD 모드 변경 시에만 위치 재계산
  useEffect(() => {
    if (!selectedNote || notes.length === 0) return;

    const currentBackgroundNotes = backgroundNotes;
    const newPositions = { ...notePositions };
    
    if (isOCDMode) {
      // OCD 모드로 전환 시 격자 형태로 재배치
      currentBackgroundNotes.forEach((note, index) => {
        const position = calculateOCDPosition(index, currentBackgroundNotes.length);
        newPositions[note.id] = {
          x: position.x,
          y: position.y,
          rotate: 0
        };
      });
    } else {
      // 일반 모드로 전환 시 랜덤 위치로 재배치
      currentBackgroundNotes.forEach((note, index) => {
        const position = generateRandomPosition(index, newPositions, note, currentBackgroundNotes);
        newPositions[note.id] = {
          x: position.x,
          y: position.y,
          rotate: (Math.random() - 0.5) * 2 * MAX_ROTATION
        };
      });
    }

    // 메인 노트는 항상 중앙에 유지
    newPositions[selectedNote.id] = {
      x: 0,
      y: 0,
      rotate: 0
    };
    
    setNotePositions(newPositions);
  }, [isOCDMode]);

  // Firebase에서 노트 데이터를 가져올 때
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const notesRef = collection(db, `users/${user.uid}/notes`);
    const notesQuery = query(notesRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(notesQuery, (snapshot) => {
      const notesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Note));
      
      setNotes(notesList);
      
      // 초기 로딩 시에만 첫 번째 노트 선택 및 위치 계산
      if (notesList.length > 0 && !selectedNote) {
        const firstNote = notesList[0];
        setSelectedNote(firstNote);
        setEditedTitle(firstNote.title || '');
        setEditedContent(firstNote.content || '');
        setEditedColor(firstNote.color || 'yellow');
        
        const backgroundNotesList = notesList.filter(n => n.id !== firstNote.id);
        setBackgroundNotes(backgroundNotesList);

        // 초기 위치 계산
        const initialPositions: Record<string, NotePosition> = {};
        
        backgroundNotesList.forEach((note, index) => {
          if (isOCDMode) {
            const position = calculateOCDPosition(index, backgroundNotesList.length);
            initialPositions[note.id] = {
              x: position.x,
              y: position.y,
              rotate: 0
            };
          } else {
            const position = generateRandomPosition(index, initialPositions, note, backgroundNotesList);
            initialPositions[note.id] = {
              x: position.x,
              y: position.y,
              rotate: (Math.random() - 0.5) * 2 * MAX_ROTATION
            };
          }
        });

        // 메인 노트는 중앙에
        initialPositions[firstNote.id] = {
          x: 0,
          y: 0,
          rotate: 0
        };
        
        setNotePositions(initialPositions);
        
        setTimeout(() => {
          setIsInitialLayout(false);
        }, 100);
      }
    });

    return () => unsubscribe();
  }, []);

  // 선택된 노트의 내용 업데이트를 위한 별도의 useEffect
  useEffect(() => {
    if (selectedNote && notes.length > 0) {
      const updatedNote = notes.find(note => note.id === selectedNote.id);
      if (updatedNote && !isEditing) {
        setEditedTitle(updatedNote.title || '');
        setEditedContent(updatedNote.content || '');
        setEditedColor(updatedNote.color || 'yellow');
      }
    }
  }, [selectedNote, notes, isEditing]);

  // 노트 삭제 처리
  const handleDeleteClick = (noteId: string) => {
    setNoteToDelete(noteId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const user = auth.currentUser;
      if (!user || !noteToDelete) return;

      await deleteDoc(doc(db, `users/${user.uid}/notes/${noteToDelete}`));
      
      if (selectedNote?.id === noteToDelete) {
        const remainingNote = notes.find(note => note.id !== noteToDelete);
        setSelectedNote(remainingNote || null);
      }
      
      showSnackbar('메모가 삭제되었습니다.');
    } catch (error) {
      showSnackbar('삭제 중 오류가 발생했습니다.');
    }

    setDeleteDialogOpen(false);
    setNoteToDelete(null);
  };

  // 노트 수정 처리
  const handleEditClick = () => {
    if (selectedNote) {
      setEditedTitle(selectedNote.title);
      setEditedContent(selectedNote.content);
      setEditedColor(selectedNote.color || 'yellow');
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
        color: editedColor,
      });

      setIsEditing(false);
      showSnackbar('메모가 수정되었습니다.');
    } catch (error) {
      showSnackbar('수정 중 오류가 발생했습니다.');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (selectedNote) {
      setEditedTitle(selectedNote.title);
      setEditedContent(selectedNote.content);
      setEditedColor(selectedNote.color || 'yellow');
    }
  };

  // 유틸리티 함수
  const formatDate = (date: any) => {
    return new Date(date.toDate()).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const getBackgroundColor = (note: Note | null, isEditing: boolean, editedColor: NoteColor) => {
    if (isEditing) {
      return NOTE_COLORS[editedColor].bg;
    }
    if (note && isValidColor(note.color)) {
      return NOTE_COLORS[note.color].bg;
    }
    return NOTE_COLORS.yellow.bg;
  };

  // 랜덤 위치 생성 (거리에 따른 가중치 적용)
  const generateRandomPosition = (
    index: number,
    positions: Record<string, NotePosition>,
    currentNote: Note,
    existingNotes: Note[],
    maxAttempts: number = PLACEMENT_ATTEMPTS
  ): { x: number; y: number } => {
    // 화면을 8개의 구역으로 나누어 배치
    const sector = index % 8;
    const baseAngle = (sector * Math.PI / 4) + (Math.random() * 0.2 - 0.1);
    
    // 화면 크기에 따른 최대 거리 계산 (회전을 고려한 여유 공간)
    const rotationMargin = Math.sin(Math.PI / 4) * 
      (BACKGROUND_NOTE_WIDTH * BASE_SCALE - BACKGROUND_NOTE_HEIGHT * BASE_SCALE) / 2;
    
    const maxScreenRadius = Math.min(
      FRAME_WIDTH / 2 - BACKGROUND_NOTE_WIDTH * BASE_SCALE - SAFE_MARGIN - rotationMargin,
      FRAME_HEIGHT / 2 - BACKGROUND_NOTE_HEIGHT * BASE_SCALE - SAFE_MARGIN - rotationMargin
    );

    // 실제 사용할 최대 거리 결정
    const effectiveMaxDistance = Math.min(MAX_MAIN_NOTE_CLEARANCE, maxScreenRadius);
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const distance = MIN_MAIN_NOTE_CLEARANCE + 
        Math.random() * (effectiveMaxDistance - MIN_MAIN_NOTE_CLEARANCE);
      
      const angleVariation = (Math.random() - 0.5) * Math.PI / 9;
      const angle = baseAngle + angleVariation;
      
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;

      if (isPositionValid(x, y, positions, currentNote, existingNotes)) {
        return { x, y };
      }
    }

    const safeDistance = MIN_MAIN_NOTE_CLEARANCE + 
      Math.random() * (effectiveMaxDistance - MIN_MAIN_NOTE_CLEARANCE) * 0.8;
    const safeAngle = baseAngle + (Math.random() - 0.5) * Math.PI / 12;
    
    return {
      x: Math.cos(safeAngle) * safeDistance,
      y: Math.sin(safeAngle) * safeDistance
    };
  };

  // 노트 위치 저장 함수
  const saveNotePosition = async (noteId: string, position: NotePosition) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      await updateDoc(doc(db, `users/${user.uid}/notes/${noteId}`), {
        position: position
      });
    } catch (error) {
      console.error('Failed to save note position:', error);
    }
  };

  // 렌더링 컴포넌트
  const renderNoteList = () => (
    <List sx={{ width: '100%', bgcolor: 'background.paper', py: 0 }}>
      {notes.map((note) => (
        <ListItemButton
          key={note.id}
          onClick={() => handleNoteSelect(note)}
          selected={selectedNote?.id === note.id}
          sx={{
            py: 0.5,
            borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
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
          <ListItemIcon sx={{ minWidth: 36 }}>
            <NoteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText 
            primary={note.title}
            secondary={note.createdAt ? formatDate(note.createdAt) : ''}
            primaryTypographyProps={{
              noWrap: true,
              style: { 
                fontWeight: selectedNote?.id === note.id ? 600 : 400,
                color: '#2c5530',
                fontSize: '0.9rem'
              }
            }}
            secondaryTypographyProps={{
              style: { 
                color: '#666',
                fontSize: '0.75rem'
              }
            }}
          />
          <IconButton
            edge="end"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteClick(note.id);
            }}
            sx={{ color: '#666', padding: 0.5 }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </ListItemButton>
      ))}
    </List>
  );

  const renderNoteContent = () => {
    return (
      <Box sx={{ 
        position: 'relative',
        width: '100%',
        maxWidth: '1200px',
        height: '800px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        transform: 'translateY(-5%)',  // 전체를 약간 위로 올림
        margin: '0 auto',  // 좌우 중앙 정렬
        pt: 0,  // 기존 패딩 제거
      }}>
        {/* 배경 노트들 */}
        {backgroundNotes.map((note) => (
          <Paper 
            key={note.id}
            elevation={3} 
            onClick={() => handleNoteSelect(note)}
            onMouseLeave={() => {
              if (recentlySwappedNote === note.id) {
                setRecentlySwappedNote(null);
              }
            }}
            sx={{ 
              position: 'absolute',
              width: '350px',
              minHeight: '250px',
              p: 2,
              bgcolor: note.color ? NOTE_COLORS[note.color].bg : NOTE_COLORS.yellow.bg,
              left: '50%',
              top: '50%',
              transform: `translate(
                calc(-50% + ${notePositions[note.id]?.x || 0}px), 
                calc(-50% + ${notePositions[note.id]?.y || 0}px)
              ) 
              scale(${BASE_SCALE})
              rotate(${notePositions[note.id]?.rotate || 0}deg)`,
              opacity: 0.85,
              transition: isInitialLayout ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              filter: 'none',
              transformOrigin: 'center center',
              borderRadius: '16px',
              zIndex: 1,
              '&:hover': recentlySwappedNote === note.id ? {} : {
                opacity: 1,
                filter: 'none',
                transform: `translate(
                  calc(-50% + ${notePositions[note.id]?.x || 0}px), 
                  calc(-50% + ${notePositions[note.id]?.y || 0}px)
                )
                scale(${HOVER_SCALE})
                rotate(${notePositions[note.id]?.rotate || 0}deg)`,
                zIndex: 60,
                boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
              },
            }}
          >
            <Box sx={{ 
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 1, 
                  textAlign: 'center',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  color: '#2c5530',
                }}
              >
                {note.title}
              </Typography>
              <Typography
                sx={{
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 6,
                  WebkitBoxOrient: 'vertical',
                  fontSize: '0.95rem',
                  lineHeight: 1.5,
                  color: '#444',
                }}
              >
                {note.content}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  mt: 1,
                  textAlign: 'right',
                  color: '#666',
                  fontStyle: 'italic',
                }}
              >
                {note.createdAt ? formatDate(note.createdAt) : ''}
              </Typography>
            </Box>
          </Paper>
        ))}

        {/* 메인 노트 */}
        {selectedNote && (
          <Paper
            elevation={8}
            sx={{
              position: 'absolute',
              width: '500px',
              minHeight: '350px',
              p: 3,
              bgcolor: getBackgroundColor(selectedNote, isEditing, editedColor),
              borderRadius: '16px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              zIndex: 50,
              opacity: 1,
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%) scale(1.05)',
              filter: 'blur(0px)',
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
            {isEditing ? (
              <>
                <TextField
                  fullWidth
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  variant="standard"
                  sx={{
                    mb: 2,
                    '& input': {
                      fontSize: '2rem',
                      fontFamily: "'Ghibli', 'Noto Sans KR', sans-serif",
                      color: '#2c5530',
                      textAlign: 'center',
                    },
                  }}
                />
                
                {/* 색상 선택 버튼 그룹 */}
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
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
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditedColor(colorKey as NoteColor);
                      }}
                      className={editedColor === colorKey ? 'selected' : ''}
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
                <Box sx={{
                  position: 'relative',
                  mb: 2,
                  textAlign: 'center'
                }}>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      color: '#2c5530',
                      fontFamily: "'Ghibli', 'Noto Sans KR', sans-serif",
                      fontWeight: 'bold',
                      textShadow: '1px 1px 0 rgba(255,255,255,0.5)',
                      fontSize: '1.6rem',
                    }}
                  >
                    {selectedNote.title}
                  </Typography>
                </Box>

                <Box sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 3
                }}>
                  <Typography 
                    variant="caption"
                    sx={{
                      color: '#666',
                      fontStyle: 'italic',
                    }}
                  >
                    {selectedNote.createdAt ? formatDate(selectedNote.createdAt) : ''}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton onClick={handleEditClick} size="small" sx={{ color: '#9cbb9c', p: 0.5 }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteClick(selectedNote.id)} size="small" color="error" sx={{ p: 0.5, color: '#9cbb9c' }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>

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
          </Paper>
        )}
      </Box>
    );
  };

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
          overflow: 'auto',
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
          <IconButton onClick={handleLogout} size="small">
            <ExitToAppIcon />
          </IconButton>
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
        pt: 4,
      }}>
        {/* OCD 토글 */}
        <Box sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          bgcolor: 'rgba(255, 255, 255, 0.8)',
          padding: '6px 12px',
          borderRadius: '12px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          transition: 'all 0.2s',
          zIndex: 1000,
          '&:hover': {
            bgcolor: 'rgba(255, 255, 255, 0.9)',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          }
        }}>
          <Typography sx={{ 
            fontWeight: 600,
            fontSize: '0.9rem',
            color: isOCDMode ? '#2c5530' : '#666',
            minWidth: '45px',
          }}>
            OCD
          </Typography>
          <Switch
            size="small"
            checked={isOCDMode}
            onChange={(e) => {
              e.stopPropagation();
              setIsOCDMode(!isOCDMode);
              setIsInitialLayout(true);
              const newPositions = { ...notePositions };
              setNotePositions(newPositions);
            }}
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

        {/* 노트 컨텐츠 영역 */}
        <Box sx={{ 
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
        }}>
          {notes.length > 0 ? renderNoteContent() : (
            <Typography 
              color="text.secondary"
              sx={{
                fontFamily: "'Ghibli', 'Noto Sans KR', sans-serif",
                fontSize: '1.2rem',
              }}
            >
              왼쪽에서 메모를 선택해주세요
            </Typography>
          )}
        </Box>
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

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>메모 삭제</DialogTitle>
        <DialogContent>
          <Typography>이 메모를 삭제하시겠습니까?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>취소</Button>
          <Button onClick={handleDeleteConfirm} color="error">삭제</Button>
        </DialogActions>
      </Dialog>

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
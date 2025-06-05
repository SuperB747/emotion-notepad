import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { db, auth } from '../../config/firebase';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc, addDoc, getDocs, writeBatch, where, serverTimestamp, setDoc, getDoc } from 'firebase/firestore';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Menu,
  CircularProgress,
  Collapse,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ExitToApp as ExitToAppIcon,
  NoteAlt as NoteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  ArrowRight,
  CreateNewFolder as CreateNewFolderIcon,
  Check as CheckIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  ShuffleRounded as ShuffleIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: any;
  userId: string;
  color?: 'yellow' | 'green' | 'blue' | 'pink' | 'pastelPink' | 'pastelBlue' | 'pastelGreen' | 'pastelPurple' | 'pastelOrange' | 'pastelYellow';
  position?: {
    x: number;
    y: number;
    rotate: number;
  };
  folderId?: string;
}

interface Folder {
  id: string;
  name: string;
  userId: string;
  createdAt: any;
}

interface NotePosition {
  x: number;
  y: number;
  rotate: number;
  zIndex?: number;
}

interface FolderLayout {
  id: string;
  positions: Record<string, NotePosition>;
  isOCDMode: boolean;
  originalRotations?: Record<string, number>;
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
  const [isPositionSaved, setIsPositionSaved] = useState<Record<string, boolean>>({});
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    noteId: string;
  } | null>(null);
  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const navigate = useNavigate();
  const isDragging = React.useRef(false);
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);
  const [folderLayouts, setFolderLayouts] = useState<FolderLayout[]>([]);
  const [isLayoutSaving, setIsLayoutSaving] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [maxZIndex, setMaxZIndex] = useState(10);
  const originalZIndexRef = React.useRef<number | null>(null);
  
  // z-index 관련 상수 수정
  const MAIN_NOTE_Z_INDEX = 95;
  const Z_INDEX_THRESHOLD = 80;
  const Z_INDEX_REDUCTION = 50;
  const HOVER_Z_INDEX = 100; // 호버 시 메인 노트보다 더 높게 설정

  // 드래그 관련 상수와 ref를 컴포넌트 최상위에 선언
  const dragStartPosition = React.useRef({ x: 0, y: 0 });
  const DRAG_THRESHOLD = 5;

  // Constants for layout calculations
  const MAX_ROTATION = 5; // 최대 회전 각도
  const SAFE_MARGIN = 150; // 화면 경계와의 최소 간격
  const MIN_DISTANCE = 250; // 노트 간 최소 거리
  const MIN_SAME_COLOR_DISTANCE = 350; // 같은 색상 노트 간 최소 거리
  const MIN_MAIN_NOTE_CLEARANCE = 400; // 메인 노트와의 최소 거리
  const MAX_MAIN_NOTE_CLEARANCE = 500; // 메인 노트와의 최대 거리
  const MAX_VERTICAL_OFFSET = 200; // 위쪽으로 최대 거리 제한
  const PLACEMENT_ATTEMPTS = 40; // 시도 횟수
  const BASE_SCALE = 0.65; // 배경 노트 기본 스케일
  const HOVER_SCALE = 0.85; // 배경 노트 호버 스케일
  const MAIN_NOTE_WIDTH = 400; // 메인 노트 너비
  const MAIN_NOTE_HEIGHT = 300; // 메인 노트 높이
  const BACKGROUND_NOTE_WIDTH = 300; // 배경 노트 너비
  const BACKGROUND_NOTE_HEIGHT = 220; // 배경 노트 높이
  const FRAME_WIDTH = 1200; // 노트 표시 프레임 너비
  const FRAME_HEIGHT = 750; // 노트 표시 프레임 높이

  // 공통 스타일을 상수로 정의
  const commonCardStyle = {
    position: 'absolute',
    top: 16,
    bgcolor: 'rgba(255, 255, 255, 0.8)',
    padding: '6px 16px', // 패딩 통일
    borderRadius: '12px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    height: '36px', // 높이 통일
    display: 'flex',
    alignItems: 'center',
    zIndex: 1000,
    transition: 'all 0.2s',
    '&:hover': {
      bgcolor: 'rgba(255, 255, 255, 0.9)',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    }
  };

  const commonTypographyStyle = {
    fontFamily: "'Ghibli', 'Noto Sans KR', sans-serif",
    fontSize: '0.9rem', // 폰트 크기 통일
    fontWeight: 600,
    color: '#2c5530',
    lineHeight: 1,
    m: 0,
  };

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

  // z-index 정규화 함수
  const normalizeZIndices = (positions: Record<string, NotePosition>): Record<string, NotePosition> => {
    const backgroundNoteIds = Object.keys(positions).filter(
      id => positions[id].zIndex !== MAIN_NOTE_Z_INDEX
    );
    
    const maxZIndex = Math.max(...backgroundNoteIds.map(id => positions[id].zIndex || 0));
    
    if (maxZIndex >= Z_INDEX_THRESHOLD) {
      const newPositions = { ...positions };
      backgroundNoteIds.forEach(id => {
        newPositions[id] = {
          ...newPositions[id],
          zIndex: (newPositions[id].zIndex || 0) - Z_INDEX_REDUCTION
        };
      });
      return newPositions;
    }
    
    return positions;
  };

  // Firebase 업데이트 디바운스 ref 추가
  const updateTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const pendingUpdatesRef = React.useRef<Record<string, NotePosition>>({});

  // Firebase 업데이트를 디바운스하는 함수
  const debouncedUpdateFirebase = useCallback((updates: Record<string, NotePosition>) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // 대기 중인 업데이트와 병합
    pendingUpdatesRef.current = {
      ...pendingUpdatesRef.current,
      ...updates
    };

    updateTimeoutRef.current = setTimeout(async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const batch = writeBatch(db);
        
        // 대기 중인 모든 업데이트를 배치로 처리
        Object.entries(pendingUpdatesRef.current).forEach(([noteId, position]) => {
          const noteRef = doc(db, `users/${user.uid}/notes/${noteId}`);
          batch.update(noteRef, { position });
        });

        await batch.commit();
        pendingUpdatesRef.current = {}; // 성공적으로 업데이트된 후 초기화
      } catch (error) {
        console.error('Failed to update note positions:', error);
        showSnackbar('노트 위치 저장에 실패했습니다.');
      }
    }, 1000); // 1초 디바운스
  }, []);

  // 노트 선택 처리 함수 수정
  const handleNoteSelect = (note: Note) => {
    if (selectedNote?.id === note.id) return;

    const oldMainNote = selectedNote;
    const clickedNotePosition = notePositions[note.id];
    
    // 클릭된 노트의 현재 z-index 저장
    originalZIndexRef.current = clickedNotePosition?.zIndex || 0;

    const newPositions = { ...notePositions };
    const updates: Record<string, NotePosition> = {};

    // 이전 메인 노트 처리
    if (oldMainNote) {
      const oldMainPosition = {
        ...notePositions[oldMainNote.id],
        x: clickedNotePosition.x,
        y: clickedNotePosition.y,
        rotate: clickedNotePosition.rotate,
        zIndex: originalZIndexRef.current
      };
      newPositions[oldMainNote.id] = oldMainPosition;
      updates[oldMainNote.id] = oldMainPosition;
    }

    // 새로 선택된 노트는 중앙에 위치하고 메인 z-index 사용
    const newMainPosition = {
      x: 0,
      y: 0,
      rotate: 0,
      zIndex: MAIN_NOTE_Z_INDEX
    };
    newPositions[note.id] = newMainPosition;
    updates[note.id] = newMainPosition;

    // 상태 업데이트
    setNotePositions(newPositions);
    setSelectedNote(note);
    setEditedTitle(note.title || '');
    setEditedContent(note.content || '');
    setEditedColor(note.color || 'yellow');
    setIsEditing(false);

    // 배경 노트 목록 업데이트
    const newBackgroundNotes = notes.filter(n => {
      const isInCurrentFolder = !currentFolderId || n.folderId === currentFolderId;
      return n.id !== note.id && isInCurrentFolder;
    });

    if (oldMainNote) {
      const isOldMainInCurrentFolder = !currentFolderId || oldMainNote.folderId === currentFolderId;
      if (isOldMainInCurrentFolder && !newBackgroundNotes.find(n => n.id === oldMainNote.id)) {
        newBackgroundNotes.push(oldMainNote);
      }
    }

    setBackgroundNotes(newBackgroundNotes);

    // Firebase 업데이트는 UI 전환 후에 수행
    const user = auth.currentUser;
    if (user) {
      const batch = writeBatch(db);
      
      if (oldMainNote) {
        const oldMainNoteRef = doc(db, `users/${user.uid}/notes/${oldMainNote.id}`);
        batch.update(oldMainNoteRef, { position: newPositions[oldMainNote.id] });
      }
      
      const newMainNoteRef = doc(db, `users/${user.uid}/notes/${note.id}`);
      batch.update(newMainNoteRef, { position: newPositions[note.id] });
      
      batch.commit().catch(error => {
        console.error('Failed to update note positions:', error);
      });
    }
  };

  // 초기 노트 위치 설정 함수 수정
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const notesRef = collection(db, `users/${user.uid}/notes`);
    const notesQuery = query(notesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(notesQuery, async (snapshot) => {
      const notesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Note));
      
      setNotes(notesList);
      
      if ((!selectedNote || !notes.length) && notesList.length > 0) {
        const firstNote = notesList[0];
        const backgroundNotesList = notesList.filter(n => n.id !== firstNote.id);
        
        // 위치 정보가 없는 노트들 초기화
        const notesToInitialize = backgroundNotesList.filter(note => !note.position);
        
        if (notesToInitialize.length > 0) {
          const batch = writeBatch(db);
          const initialPositions: Record<string, NotePosition> = {};

          // 배경 노트들의 위치 초기화 (생성 순서대로 z-index 할당)
          notesToInitialize.forEach((note, index) => {
            const position = generateRandomPosition(index, initialPositions, note, backgroundNotesList);
            const notePosition = {
              ...position,
              rotate: (Math.random() - 0.5) * 2 * MAX_ROTATION,
              zIndex: index // 생성 순서대로 z-index 할당
            };

            initialPositions[note.id] = notePosition;
            const noteRef = doc(db, `users/${user.uid}/notes/${note.id}`);
            batch.update(noteRef, { position: notePosition });
          });

          // 메인 노트 위치 설정
          const mainNotePosition = {
            x: 0,
            y: 0,
            rotate: 0,
            zIndex: MAIN_NOTE_Z_INDEX
          };
          
          // 첫 번째 노트의 위치가 없거나 z-index가 MAIN_NOTE_Z_INDEX가 아닌 경우에만 업데이트
          const firstNotePosition = firstNote.position as NotePosition | undefined;
          if (!firstNotePosition || firstNotePosition.zIndex !== MAIN_NOTE_Z_INDEX) {
            initialPositions[firstNote.id] = mainNotePosition;
            const mainNoteRef = doc(db, `users/${user.uid}/notes/${firstNote.id}`);
            batch.update(mainNoteRef, { position: mainNotePosition });
          }

          await batch.commit();
          
          setNotePositions(prev => ({
            ...prev,
            ...initialPositions
          }));
        } else {
          // 모든 노트가 위치 정보를 가지고 있는 경우에도 메인 노트의 z-index 확인
          const currentPosition = notePositions[firstNote.id];
          if (!currentPosition || currentPosition.zIndex !== MAIN_NOTE_Z_INDEX) {
            const mainNotePosition = {
              ...(currentPosition || { x: 0, y: 0, rotate: 0 }),
              zIndex: MAIN_NOTE_Z_INDEX
            };
            setNotePositions(prev => ({
              ...prev,
              [firstNote.id]: mainNotePosition
            }));
          }
        }

        setSelectedNote(firstNote);
        setEditedTitle(firstNote.title || '');
        setEditedContent(firstNote.content || '');
        setEditedColor(firstNote.color || 'yellow');
        setBackgroundNotes(backgroundNotesList);
        setIsInitialLayout(false);
      }
    });

    return () => unsubscribe();
  }, [currentFolderId]);

  // 드래그 종료 시 z-index 업데이트 함수
  const updateDraggedNoteZIndex = (
    draggedNoteId: string,
    finalX: number,
    finalY: number,
    currentPositions: Record<string, NotePosition>
  ): Record<string, NotePosition> => {
    const newPositions = { ...currentPositions };
    const highestZIndex = findHighestOverlappingZIndex(finalX, finalY, draggedNoteId);
    
    if (highestZIndex >= 0) {
      newPositions[draggedNoteId] = {
        ...newPositions[draggedNoteId],
        zIndex: highestZIndex + 1
      };
      
      // z-index가 임계값을 넘으면 정규화
      if (highestZIndex + 1 >= Z_INDEX_THRESHOLD) {
        return normalizeZIndices(newPositions);
      }
    }
    
    return newPositions;
  };

  // 랜덤 위치 생성 함수 수정
  const generateRandomPosition = (
    index: number,
    positions: Record<string, NotePosition>,
    currentNote: Note,
    existingNotes: Note[],
    maxAttempts: number = PLACEMENT_ATTEMPTS
  ): { x: number; y: number; zIndex: number } => {
    const sector = index % 8;
    const baseAngle = (sector * Math.PI / 4) + (Math.random() * 0.2 - 0.1);
    
    const maxScreenRadius = Math.min(
      FRAME_WIDTH / 2 - BACKGROUND_NOTE_WIDTH * BASE_SCALE - SAFE_MARGIN,
      FRAME_HEIGHT / 2 - BACKGROUND_NOTE_HEIGHT * BASE_SCALE - SAFE_MARGIN
    );

    const effectiveMaxDistance = Math.min(MAX_MAIN_NOTE_CLEARANCE, maxScreenRadius);
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const distance = MIN_MAIN_NOTE_CLEARANCE + 
        Math.random() * (effectiveMaxDistance - MIN_MAIN_NOTE_CLEARANCE);
      
      const angleVariation = (Math.random() - 0.5) * Math.PI / 9;
      const angle = baseAngle + angleVariation;
      
      let x = Math.cos(angle) * distance;
      let y = Math.sin(angle) * distance;

      // 위쪽으로의 거리 제한 강화
      if (y < -MAX_VERTICAL_OFFSET) {
        y = -MAX_VERTICAL_OFFSET;
      }
      
      // 전체적으로 위로 이동
      y += 50; // 배경 노트들을 약간 위로 이동

      if (isPositionValid(x, y, positions, currentNote, existingNotes)) {
        return { x, y, zIndex: index + 1 };
      }
    }

    // 안전한 위치를 찾지 못한 경우의 기본값
    const safeDistance = MIN_MAIN_NOTE_CLEARANCE + 
      Math.random() * (effectiveMaxDistance - MIN_MAIN_NOTE_CLEARANCE) * 0.8;
    const safeAngle = baseAngle + (Math.random() - 0.5) * Math.PI / 12;
    let x = Math.cos(safeAngle) * safeDistance;
    let y = Math.sin(safeAngle) * safeDistance + 50; // 기본값도 위로 이동

    // 위쪽 거리 제한 적용
    if (y < -MAX_VERTICAL_OFFSET) {
      y = -MAX_VERTICAL_OFFSET;
    }
    
    return { x, y, zIndex: index + 1 };
  };

  // Firebase에서 노트 데이터를 가져올 때 위치 정보도 함께 로드
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const notesRef = collection(db, `users/${user.uid}/notes`);
    const notesQuery = query(notesRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(notesQuery, async (snapshot) => {
      const notesList = snapshot.docs.map(doc => {
        const data = doc.data();
        // Firebase에 저장된 위치 정보가 있으면 사용
        if (data.position) {
          const savedPosition = data.position;
          setNotePositions(prev => ({
            ...prev,
            [doc.id]: {
              x: savedPosition.x,
              y: savedPosition.y,
              rotate: savedPosition.rotate,
              zIndex: savedPosition.zIndex || 1
            }
          }));
        }
        return {
          id: doc.id,
          ...data,
        } as Note;
      });
      
      setNotes(notesList);
      
      // 선택된 노트가 없거나 노트 목록이 비어있을 때만 초기화
      if ((!selectedNote || !notes.length) && notesList.length > 0) {
        const firstNote = notesList[0];
        setSelectedNote(firstNote);
        setEditedTitle(firstNote.title || '');
        setEditedContent(firstNote.content || '');
        setEditedColor(firstNote.color || 'yellow');
        
        // 현재 폴더의 노트만 필터링
        const backgroundNotesList = notesList.filter(n => 
          n.id !== firstNote.id && 
          (n.folderId === currentFolderId || (!currentFolderId && !n.folderId))
        );
        setBackgroundNotes(backgroundNotesList);

        // 위치 정보가 없는 노트들에 대해서만 새로운 위치 생성
        const initialPositions: Record<string, NotePosition> = { ...notePositions };
        backgroundNotesList.forEach((note, index) => {
          if (!initialPositions[note.id] && !note.position) {
            const position = generateRandomPosition(
              index,
              initialPositions,
              note,
              backgroundNotesList
            );
            initialPositions[note.id] = {
              x: position.x,
              y: position.y,
              rotate: isOCDMode ? 0 : (Math.random() - 0.5) * 2 * MAX_ROTATION,
              zIndex: position.zIndex
            };
          }
        });
        
        // 새로 생성된 위치만 업데이트
        setNotePositions(prev => ({
          ...prev,
          ...initialPositions
        }));
      }
    });

    return () => unsubscribe();
  }, [currentFolderId]);

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

  // 노트 위치 저장 함수
  const saveNotePosition = async (noteId: string, position: NotePosition) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Firebase에 현재 노트의 위치만 업데이트
      await updateDoc(doc(db, `users/${user.uid}/notes/${noteId}`), {
        position: position
      });

      setIsPositionSaved(prev => ({
        ...prev,
        [noteId]: true
      }));
    } catch (error) {
      console.error('Failed to save note position:', error);
      showSnackbar('노트 위치 저장에 실패했습니다.');
    }
  };

  // 노트의 폴더 변경
  const handleNoteFolder = async (noteId: string, folderId: string | null) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      await updateDoc(doc(db, `users/${user.uid}/notes/${noteId}`), {
        folderId: folderId
      });

      showSnackbar('노트가 폴더에 할당되었습니다.');
    } catch (error) {
      console.error('Failed to update note folder:', error);
      showSnackbar('노트 폴더 할당에 실패했습니다.');
    }
  };

  // 폴더별 노트 필터링
  const filteredBackgroundNotes = useMemo(() => {
    return backgroundNotes.filter(note => {
      if (!currentFolderId) return true; // 폴더가 선택되지 않았으면 모든 노트 표시
      return note.folderId === currentFolderId;
    });
  }, [backgroundNotes, currentFolderId]);

  // 폴더 변경 핸들러
  const handleFolderChange = async (folderId: string | null) => {
    setCurrentFolderId(folderId);
    
    // 현재 폴더의 레이아웃 로드
    const layoutData = folderLayouts.find(layout => layout.id === (folderId || 'default'));
    
    if (layoutData) {
      // 기존 위치 정보 유지하면서 레이아웃 적용
      setNotePositions(prev => ({
        ...prev,
        ...layoutData.positions
      }));
      setIsOCDMode(layoutData.isOCDMode);
    }

    // 현재 폴더의 노트만 배경으로 표시
    const backgroundNotesList = notes.filter(n => 
      n.id !== selectedNote?.id && 
      (n.folderId === folderId || (!folderId && !n.folderId))
    );
    setBackgroundNotes(backgroundNotesList);
  };

  // 폴더 목록 불러오기
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const foldersRef = collection(db, `users/${user.uid}/folders`);
    const foldersQuery = query(foldersRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(foldersQuery, (snapshot) => {
      const foldersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Folder));
      
      setFolders(foldersList);
    });

    return () => unsubscribe();
  }, []);

  // 노트 목록 렌더링
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

  // 폴더 선택 UI 수정
  const renderFolderSelect = () => (
    <Box sx={{
      position: 'absolute',
      top: 20,
      left: 20,
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      gap: 1
    }}>
      <FormControl variant="outlined" size="small">
        <InputLabel>폴더 선택</InputLabel>
        <Select
          value={currentFolderId || ''}
          onChange={(e) => handleFolderChange(e.target.value || null)}
          label="폴더 선택"
          sx={{
            minWidth: 120,
            bgcolor: 'white',
            '&:hover': {
              bgcolor: 'white',
            }
          }}
        >
          <MenuItem value="">전체 보기</MenuItem>
          {folders.map(folder => (
            <MenuItem 
              key={folder.id} 
              value={folder.id}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span>{folder.name}</span>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteFolder(folder.id);
                }}
                sx={{
                  opacity: 0,
                  transition: 'opacity 0.2s',
                  '&:hover': {
                    opacity: 1,
                  }
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <IconButton
        size="small"
        onClick={() => setIsNewFolderDialogOpen(true)}
        sx={{
          bgcolor: 'white',
          '&:hover': {
            bgcolor: 'white',
          }
        }}
      >
        <CreateNewFolderIcon />
      </IconButton>
    </Box>
  );

  // 새 폴더 생성
  const handleCreateFolder = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const folderRef = collection(db, `users/${user.uid}/folders`);
      await addDoc(folderRef, {
        name: newFolderName,
        userId: user.uid,
        createdAt: serverTimestamp(),
      });

      setNewFolderName('');
      setIsNewFolderDialogOpen(false);
      showSnackbar('새 폴더가 생성되었습니다.');
    } catch (error) {
      console.error('Failed to create folder:', error);
      showSnackbar('폴더 생성에 실패했습니다.');
    }
  };

  // 폴더 삭제
  const handleDeleteFolder = async (folderId: string) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // 폴더에 속한 노트들의 folderId를 null로 설정
      const notesRef = collection(db, `users/${user.uid}/notes`);
      const notesQuery = query(notesRef, where('folderId', '==', folderId));
      const notesSnapshot = await getDocs(notesQuery);
      
      const batch = writeBatch(db);
      notesSnapshot.docs.forEach(doc => {
        batch.update(doc.ref, { folderId: null });
      });
      
      // 폴더 삭제
      batch.delete(doc(db, `users/${user.uid}/folders/${folderId}`));
      await batch.commit();

      if (currentFolderId === folderId) {
        setCurrentFolderId(null);
      }
      
      showSnackbar('폴더가 삭제되었습니다.');
    } catch (error) {
      console.error('Failed to delete folder:', error);
      showSnackbar('폴더 삭제에 실패했습니다.');
    }
  };

  // 보드 제목 렌더링 컴포넌트 수정
  const renderBoardTitle = () => {
    const boardName = currentFolderId 
      ? `${folders.find(f => f.id === currentFolderId)?.name || ''} 보드`
      : '메인 보드';

    // 현재 폴더의 메모 개수 계산
    const currentFolderNotes = notes.filter(note => 
      currentFolderId 
        ? note.folderId === currentFolderId 
        : !note.folderId
    );

    return (
      <Box
        sx={{
          position: 'fixed',
          top: 16,
          left: 'calc(280px + (100% - 280px) / 2)',
          transform: 'translateX(-50%)',
          bgcolor: 'rgba(255, 255, 255, 0.8)',
          padding: '6px 16px',
          borderRadius: '12px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          transition: 'all 0.2s',
          minWidth: '200px',
          '&:hover': {
            bgcolor: 'rgba(255, 255, 255, 0.9)',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          }
        }}
      >
        <Typography 
          sx={{ 
            fontFamily: "'Ghibli', 'Noto Sans KR', sans-serif",
            fontSize: '0.9rem',
            fontWeight: 600,
            color: '#2c5530',
            lineHeight: 1,
            m: 0,
            textAlign: 'center',
            width: '100%',
          }}
        >
          {boardName} ({currentFolderNotes.length}개의 메모)
        </Typography>
      </Box>
    );
  };

  // 노트 컨텐츠 영역 렌더링 수정
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
        transform: 'translateY(-8%)',
        margin: '0 auto',
        pt: 0,
      }}>
        {renderBackgroundNotes(filteredBackgroundNotes)}
        {selectedNote && (
          <Paper
            elevation={8}
            sx={{
              position: 'absolute',
              width: '500px',
              minHeight: '400px',
              p: 3,
              bgcolor: getBackgroundColor(selectedNote, isEditing, editedColor),
              borderRadius: '16px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              zIndex: MAIN_NOTE_Z_INDEX,
              opacity: 1,
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -42%)',
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
            {/* z-index 디버그 표시 */}
            <Typography
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: '64px',
                fontWeight: 'bold',
                color: 'rgba(0, 0, 0, 0.15)',
                pointerEvents: 'none',
                userSelect: 'none',
                zIndex: 0,
              }}
            >
              {MAIN_NOTE_Z_INDEX}
            </Typography>

            {isEditing ? (
              <>
                <Box sx={{ position: 'relative', zIndex: 1 }}>
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
                </Box>
              </>
            ) : (
              <>
                <Box sx={{
                  position: 'relative',
                  mb: 2,
                  textAlign: 'center',
                  zIndex: 1,
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
                  mb: 3,
                  zIndex: 1,
                  position: 'relative',
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
                    position: 'relative',
                    zIndex: 1,
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

  // 새 폴더 생성 다이얼로그
  const renderNewFolderDialog = () => (
    <Dialog
      open={isNewFolderDialogOpen}
      onClose={() => setIsNewFolderDialogOpen(false)}
      maxWidth="xs"
      fullWidth
    >
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
          onKeyPress={(e) => {
            if (e.key === 'Enter' && newFolderName.trim()) {
              handleCreateFolder();
            }
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setIsNewFolderDialogOpen(false)}>취소</Button>
        <Button 
          onClick={handleCreateFolder} 
          disabled={!newFolderName.trim()}
        >
          만들기
        </Button>
      </DialogActions>
    </Dialog>
  );

  // 노트 배경 렌더링 수정
  const renderBackgroundNotes = (notes: Note[]) => {
    return notes.map((note) => {
      const position = notePositions[note.id];
      if (!position) return null;

      const isTransitioning = selectedNote?.id === note.id || recentlySwappedNote === note.id;

      return (
        <Paper 
          key={note.id}
          elevation={3} 
          onClick={(e) => {
            if (!isDragging.current) {
              handleNoteSelect(note);
            }
          }}
          onMouseEnter={(e) => {
            if (isTransitioning) return;
            
            // 현재 z-index 값을 저장
            const currentZIndex = notePositions[note.id].zIndex || 0;
            originalZIndexRef.current = currentZIndex;
            
            // 호버 시 z-index 업데이트
            setNotePositions(prev => ({
              ...prev,
              [note.id]: {
                ...prev[note.id],
                zIndex: HOVER_Z_INDEX
              }
            }));
          }}
          onMouseLeave={(e) => {
            if (isTransitioning) return;

            if (recentlySwappedNote === note.id) {
              setRecentlySwappedNote(null);
            }
            
            // 저장된 원래의 z-index 값으로 복구
            const originalZIndex = originalZIndexRef.current;
            if (originalZIndex !== null) {
              setNotePositions(prev => ({
                ...prev,
                [note.id]: {
                  ...prev[note.id],
                  zIndex: originalZIndex
                }
              }));
              originalZIndexRef.current = null;
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
              calc(-50% + ${position.x}px), 
              calc(-50% + ${position.y}px)
            ) 
            scale(${BASE_SCALE})
            rotate(${position.rotate}deg)`,
            opacity: isTransitioning ? 0 : 0.85,
            transition: draggedNoteId === note.id ? 'none' :
              isInitialLayout ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            filter: 'none',
            transformOrigin: 'center center',
            borderRadius: '16px',
            zIndex: position.zIndex || 1,
            cursor: 'grab',
            willChange: draggedNoteId === note.id ? 'transform' : 'auto',
            visibility: isTransitioning ? 'hidden' : 'visible',
            '&:active': {
              cursor: 'grabbing'
            },
            '&:hover': (isTransitioning || recentlySwappedNote === note.id) ? {} : {
              opacity: 1,
              filter: 'none',
              transform: draggedNoteId === note.id ?
                `translate(
                  calc(-50% + ${position.x}px), 
                  calc(-50% + ${position.y}px)
                ) 
                scale(${BASE_SCALE})
                rotate(${position.rotate}deg)` :
                `translate(
                  calc(-50% + ${position.x}px), 
                  calc(-50% + ${position.y}px)
                )
                scale(${HOVER_SCALE})
                rotate(${position.rotate}deg)`,
              zIndex: HOVER_Z_INDEX,
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            },
          }}
        >
          <Box sx={{ 
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
          }}>
            {/* z-index 디버그 표시 */}
            <Typography
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: '64px',
                fontWeight: 'bold',
                color: 'rgba(0, 0, 0, 0.15)',
                pointerEvents: 'none',
                userSelect: 'none',
                zIndex: 0,
              }}
            >
              {position.zIndex || 1}
            </Typography>

            <Typography 
              variant="h6" 
              sx={{ 
                mb: 1, 
                textAlign: 'center',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                color: '#2c5530',
                position: 'relative',
                zIndex: 1,
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
                position: 'relative',
                zIndex: 1,
              }}
            >
              {note.content}
            </Typography>
            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mt: 1
            }}>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: '#666',
                  fontStyle: 'italic',
                }}
              >
                {note.createdAt ? formatDate(note.createdAt) : ''}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {note.folderId && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#666',
                      fontSize: '0.7rem'
                    }}
                  >
                    {folders.find(f => f.id === note.folderId)?.name}
                  </Typography>
                )}
                {isPositionSaved[note.id] && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#9cbb9c',
                      fontSize: '0.7rem'
                    }}
                  >
                    ● 위치 저장됨
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
        </Paper>
      );
    }).filter(Boolean);
  };

  // 컨텍스트 메뉴 닫기
  const handleContextMenuClose = () => {
    setContextMenu(null);
  };

  // 컨텍스트 메뉴 렌더링
  const renderContextMenu = () => (
    <Menu
      open={contextMenu !== null}
      onClose={handleContextMenuClose}
      anchorReference="anchorPosition"
      anchorPosition={
        contextMenu !== null
          ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
          : undefined
      }
    >
      <MenuItem onClick={handleContextMenuClose}>
        <ListItemText primary="폴더 할당" />
        <ArrowRight />
        <Menu
          open={contextMenu !== null}
          anchorEl={contextMenu ? document.getElementById('folder-menu-trigger') : null}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
        >
          <MenuItem 
            onClick={() => {
              handleNoteFolder(contextMenu!.noteId, null);
              handleContextMenuClose();
            }}
          >
            <ListItemText primary="폴더 없음" />
          </MenuItem>
          {folders.map(folder => (
            <MenuItem
              key={folder.id}
              onClick={() => {
                handleNoteFolder(contextMenu!.noteId, folder.id);
                handleContextMenuClose();
              }}
            >
              <ListItemText primary={folder.name} />
            </MenuItem>
          ))}
        </Menu>
      </MenuItem>
    </Menu>
  );

  // 겹치는 노트들 중 가장 높은 z-index를 찾는 함수
  const findHighestOverlappingZIndex = (x: number, y: number, currentNoteId: string): number => {
    let highestZIndex = -1;
    
    Object.entries(notePositions).forEach(([noteId, position]) => {
      if (noteId !== currentNoteId && 
          isNotesOverlapping(x, y, position.x, position.y)) {
        highestZIndex = Math.max(highestZIndex, position.zIndex || 0);
      }
    });
    
    return highestZIndex;
  };

  // 노트 간의 겹침 여부를 확인하는 함수 추가
  const isNotesOverlapping = (note1X: number, note1Y: number, note2X: number, note2Y: number): boolean => {
    const NOTE_WIDTH = 350 * BASE_SCALE;
    const NOTE_HEIGHT = 250 * BASE_SCALE;
    
    const note1Left = note1X - NOTE_WIDTH / 2;
    const note1Right = note1X + NOTE_WIDTH / 2;
    const note1Top = note1Y - NOTE_HEIGHT / 2;
    const note1Bottom = note1Y + NOTE_HEIGHT / 2;
    
    const note2Left = note2X - NOTE_WIDTH / 2;
    const note2Right = note2X + NOTE_WIDTH / 2;
    const note2Top = note2Y - NOTE_HEIGHT / 2;
    const note2Bottom = note2Y + NOTE_HEIGHT / 2;
    
    return !(note1Right < note2Left || 
             note1Left > note2Right || 
             note1Bottom < note2Top || 
             note1Top > note2Bottom);
  };

  // 레이아웃 저장 함수 수정
  const saveFolderLayout = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      setIsLayoutSaving(true);

      const layoutData: FolderLayout = {
        id: currentFolderId || 'default',
        positions: notePositions,
        isOCDMode: isOCDMode,
        originalRotations: isOCDMode ? 
          Object.fromEntries(
            Object.entries(notePositions).map(([noteId, pos]) => [noteId, pos.rotate])
          ) : undefined
      };

      const layoutRef = doc(db, `users/${user.uid}/folderLayouts/${layoutData.id}`);
      await setDoc(layoutRef, layoutData);

      setFolderLayouts(prev => {
        const filtered = prev.filter(layout => layout.id !== layoutData.id);
        return [...filtered, layoutData];
      });

      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 2000);
    } catch (error) {
      console.error('Failed to save layout:', error);
      showSnackbar('레이아웃 저장에 실패했습니다.');
    } finally {
      setIsLayoutSaving(false);
    }
  };

  // Modify loadFolderLayout function
  const loadFolderLayout = useCallback(async (folderId: string | null) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const layoutId = folderId || 'default';
      const layoutRef = doc(db, `users/${user.uid}/folderLayouts/${layoutId}`);
      const layoutDoc = await getDoc(layoutRef);

      if (layoutDoc.exists()) {
        const layoutData = layoutDoc.data() as FolderLayout;
        setNotePositions(layoutData.positions);
        setIsOCDMode(layoutData.isOCDMode);
        setIsInitialLayout(false);

        // Update folderLayouts state
        setFolderLayouts(prev => {
          const filtered = prev.filter(layout => layout.id !== layoutId);
          return [...filtered, layoutData];
        });
      }
    } catch (error) {
      console.error('Failed to load layout:', error);
    }
  }, []);

  // OCD 모드 변경 시 노트 회전 업데이트
  useEffect(() => {
    const updatedPositions = { ...notePositions };
    let hasChanges = false;

    Object.entries(updatedPositions).forEach(([noteId, position]) => {
      if (isOCDMode) {
        // OCD 모드 켜짐: 모든 노트를 0도로
        if (position.rotate !== 0) {
          updatedPositions[noteId] = {
            ...position,
            rotate: 0
          };
          hasChanges = true;
        }
      } else {
        // OCD 모드 꺼짐: 랜덤 회전 적용
        const randomRotation = (Math.random() - 0.5) * 2 * MAX_ROTATION;
        if (position.rotate === 0) {
          updatedPositions[noteId] = {
            ...position,
            rotate: randomRotation
          };
          hasChanges = true;
        }
      }
    });

    if (hasChanges) {
      setNotePositions(updatedPositions);
    }
  }, [isOCDMode]);

  // 노트 섞기 함수 추가
  const shuffleNotes = () => {
    const updatedPositions = { ...notePositions };
    const existingNotes = backgroundNotes;
    
    existingNotes.forEach((note, index) => {
      const position = generateRandomPosition(
        index,
        updatedPositions,
        note,
        existingNotes
      );
      updatedPositions[note.id] = {
        x: position.x,
        y: position.y,
        rotate: isOCDMode ? 0 : (Math.random() - 0.5) * 2 * MAX_ROTATION,
        zIndex: position.zIndex
      };
    });

    setNotePositions(updatedPositions);
  };

  const renderOCDToggle = () => (
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
      transition: 'all 0.2s',
      height: '40px',
      zIndex: 2000,
      pointerEvents: 'auto',
      '&:hover': {
        bgcolor: 'rgba(255, 255, 255, 0.9)',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      }
    }}>
      {/* OCD 토글 */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 0.5 }}>
        <Typography sx={{
          fontWeight: 600,
          fontSize: '1rem',
          color: isOCDMode ? '#2c5530' : '#666',
          minWidth: '20px',
          lineHeight: '40px',
        }}>
          OCD
        </Typography>
        <Switch
          size="small"
          checked={isOCDMode}
          onChange={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOCDMode(!isOCDMode);
          }}
          sx={{
            '& .MuiSwitch-switchBase.Mui-checked': {
              color: '#2c5530',
            },
            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
              backgroundColor: '#9cbb9c',
            },
            ml: -0.5,
          }}
        />
      </Box>

      <Box sx={{ 
        height: '24px', 
        width: '1px', 
        bgcolor: 'rgba(0,0,0,0.1)',
        mx: 0.5 
      }} />

      {/* 노트섞기 버튼 */}
      <Button
        size="small"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          shuffleNotes();
        }}
        startIcon={<ShuffleIcon />}
        sx={{
          bgcolor: 'white',
          color: '#666',
          '&:hover': {
            bgcolor: 'rgba(0,0,0,0.05)',
          },
          transition: 'all 0.3s',
          minWidth: '50px',
          height: '28px',
          ml: -0.5,
          mr: -0.5,
          px: 1,
          textAlign: 'right',
        }}
      >
        노트섞기
      </Button>

      <Box sx={{ 
        height: '24px', 
        width: '1px', 
        bgcolor: 'rgba(0,0,0,0.1)',
        mx: 0.5 
      }} />

      {/* 레이아웃 저장 버튼 */}
      <Button
        size="small"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          saveFolderLayout();
        }}
        disabled={isLayoutSaving}
        startIcon={showSaveSuccess ? <CheckIcon /> : <SaveIcon />}
        sx={{
          bgcolor: showSaveSuccess ? '#9cbb9c' : 'white',
          color: showSaveSuccess ? 'white' : '#666',
          '&:hover': {
            bgcolor: showSaveSuccess ? '#7a9e7a' : 'rgba(0,0,0,0.05)',
          },
          transition: 'all 0.3s',
          minWidth: '50px',
          height: '28px',
          px: 1,
        }}
      >
        {isLayoutSaving ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={14} color="inherit" />
            저장 중...
          </Box>
        ) : showSaveSuccess ? '저장됨' : '레이아웃 저장'}
      </Button>
    </Box>
  );

  // 새로운 z-index 생성 함수 수정
  const getNextZIndex = () => {
    const nextIndex = maxZIndex + 1;
    
    // z-index가 임계값을 넘으면 정규화 실행
    if (nextIndex >= Z_INDEX_THRESHOLD) {
      setNotePositions(prev => normalizeZIndices(prev));
      return maxZIndex - 49; // 정규화 후 다음 사용할 z-index
    }
    
    setMaxZIndex(nextIndex);
    return nextIndex;
  };

  // 폴더 토글 상태 관리
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});

  // 폴더 토글 핸들러
  const handleFolderToggle = (folderId: string) => {
    setOpenFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  // Root 폴더의 노트 목록 렌더링
  const renderRootNotes = () => {
    const rootNotes = notes.filter(note => !note.folderId);
    return (
      <List component="div" disablePadding>
        {rootNotes.map(note => (
          <ListItemButton
            key={note.id}
            selected={selectedNote?.id === note.id}
            onClick={() => setSelectedNote(note)}
            sx={{
              pl: 4,
              '&.Mui-selected': {
                bgcolor: 'rgba(158, 187, 166, 0.2)',
                '&:hover': {
                  bgcolor: 'rgba(158, 187, 166, 0.3)',
                },
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
                style: { 
                  fontWeight: selectedNote?.id === note.id ? 600 : 400,
                  color: '#2c5530'
                }
              }}
            />
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteNote(note.id);
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </ListItemButton>
        ))}
      </List>
    );
  };

  // 왼쪽 사이드바 렌더링
  const renderSidebar = () => (
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

      {/* 폴더 및 노트 목록 */}
      <List sx={{ flex: 1, overflow: 'auto' }}>
        {/* 새 폴더 만들기 버튼 */}
        <ListItemButton onClick={() => setIsNewFolderDialogOpen(true)}>
          <ListItemIcon>
            <CreateNewFolderIcon />
          </ListItemIcon>
          <ListItemText primary="새 폴더 만들기" />
        </ListItemButton>

        {/* Root 폴더 (전체 보기) */}
        <ListItemButton
          selected={!currentFolderId}
          onClick={() => handleFolderChange(null)}
          sx={{
            '&.Mui-selected': {
              bgcolor: 'rgba(158, 187, 166, 0.2)',
              '&:hover': {
                bgcolor: 'rgba(158, 187, 166, 0.3)',
              },
            },
          }}
        >
          <ListItemIcon>
            <NoteIcon />
          </ListItemIcon>
          <ListItemText 
            primary="전체 노트"
            primaryTypographyProps={{
              style: { 
                fontWeight: !currentFolderId ? 600 : 400,
                color: '#2c5530'
              }
            }}
          />
        </ListItemButton>

        {/* Root 폴더의 노트들 */}
        <Collapse in={!currentFolderId || currentFolderId === null} timeout="auto" unmountOnExit>
          {renderRootNotes()}
        </Collapse>

        {/* 폴더 목록 */}
        {folders.map(folder => (
          <React.Fragment key={folder.id}>
            <ListItemButton
              onClick={() => {
                handleFolderToggle(folder.id);
                handleFolderChange(folder.id);
              }}
              selected={currentFolderId === folder.id}
              sx={{
                '&.Mui-selected': {
                  bgcolor: 'rgba(158, 187, 166, 0.2)',
                  '&:hover': {
                    bgcolor: 'rgba(158, 187, 166, 0.3)',
                  },
                },
              }}
            >
              <ListItemIcon>
                {openFolders[folder.id] ? <FolderOpenIcon /> : <FolderIcon />}
              </ListItemIcon>
              <ListItemText 
                primary={folder.name}
                primaryTypographyProps={{
                  style: { 
                    fontWeight: currentFolderId === folder.id ? 600 : 400,
                    color: '#2c5530'
                  }
                }}
              />
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteFolder(folder.id);
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </ListItemButton>

            {/* 폴더 내 노트 목록 */}
            <Collapse in={openFolders[folder.id]} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {notes
                  .filter(note => note.folderId === folder.id)
                  .map(note => (
                    <ListItemButton
                      key={note.id}
                      selected={selectedNote?.id === note.id}
                      onClick={() => setSelectedNote(note)}
                      sx={{
                        pl: 4,
                        '&.Mui-selected': {
                          bgcolor: 'rgba(158, 187, 166, 0.2)',
                          '&:hover': {
                            bgcolor: 'rgba(158, 187, 166, 0.3)',
                          },
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
                          style: { 
                            fontWeight: selectedNote?.id === note.id ? 600 : 400,
                            color: '#2c5530'
                          }
                        }}
                      />
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNote(note.id);
                        }}
                      >
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

  // 노트 삭제 핸들러
  const handleDeleteNote = async (noteId: string) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      await deleteDoc(doc(db, `users/${user.uid}/notes/${noteId}`));
      
      // 선택된 노트가 삭제된 노트인 경우 선택 해제
      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
      }
      
      showSnackbar('노트가 삭제되었습니다.');
    } catch (error) {
      console.error('Failed to delete note:', error);
      showSnackbar('노트 삭제에 실패했습니다.');
    }
  };

  // 삭제 다이얼로그 렌더링
  const renderDeleteDialog = () => (
    <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
      <DialogTitle>삭제 확인</DialogTitle>
      <DialogContent>
        <Typography>
          {noteToDelete ? '이 노트를 삭제하시겠습니까?' : '이 폴더를 삭제하시겠습니까?'}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setDeleteDialogOpen(false)}>취소</Button>
        <Button onClick={handleDeleteConfirm} color="error">삭제</Button>
      </DialogActions>
    </Dialog>
  );

  // 스낵바 렌더링
  const renderSnackbar = () => (
    <Snackbar
      open={snackbarOpen}
      autoHideDuration={2000}
      onClose={() => setSnackbarOpen(false)}
      message={snackbarMessage}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    />
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {renderSidebar()}
      <Box sx={{ flex: 1, position: 'relative' }}>
        {/* 메인 컨텐츠 영역 */}
        <Box sx={{ 
          flex: 1,
          p: 3,
          height: '100%',
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* 상단 고정 요소들 */}
          {renderBoardTitle()}
          {renderOCDToggle()}

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

        {/* 다이얼로그 및 알림 */}
        {renderNewFolderDialog()}
        {renderDeleteDialog()}
        {renderSnackbar()}
        {renderContextMenu()}
      </Box>
    </Box>
  );
}; 
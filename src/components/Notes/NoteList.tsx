import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { db, auth } from '../../config/firebase';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc, addDoc, getDocs, writeBatch, where, serverTimestamp, setDoc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { LoadingButton } from '@mui/lab';
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

  // 노트 선택 처리
  const handleNoteSelect = (note: Note) => {
    const oldMainNote = selectedNote;
    const clickedPosition = notePositions[note.id];

    if (oldMainNote?.id === note.id) return;

    setSelectedNote(note);
    setEditedTitle(note.title || '');
    setEditedContent(note.content || '');
    setEditedColor(note.color || 'yellow');
    setIsEditing(false);

    // 현재 폴더의 노트만 배경으로 표시
    const backgroundNotesList = notes.filter(n => 
      n.id !== note.id && 
      (n.folderId === currentFolderId || (!currentFolderId && !n.folderId))
    );
    setBackgroundNotes(backgroundNotesList);

    if (oldMainNote) {
      const newPositions = { ...notePositions };
      
      if (clickedPosition) {
        newPositions[oldMainNote.id] = {
          x: clickedPosition.x,
          y: clickedPosition.y,
          rotate: clickedPosition.rotate
        };
        
        newPositions[note.id] = {
          x: 0,
          y: 0,
          rotate: 0
        };
        
        setNotePositions(newPositions);
        setRecentlySwappedNote(oldMainNote.id);
      }
    }
  };

  // Modify useEffect for OCD mode changes
  useEffect(() => {
    if (!selectedNote || notes.length === 0) return;

    const newPositions = { ...notePositions };
    
    if (isOCDMode) {
      // OCD 모드로 전환 시 회전값 저장 후 0으로 설정
      const layoutData = folderLayouts.find(layout => layout.id === (currentFolderId || 'default'));
      if (!layoutData) {
        // 처음 OCD 모드로 전환하는 경우, 현재 회전값 저장
        const originalRotations: Record<string, number> = {};
        Object.keys(newPositions).forEach(noteId => {
          originalRotations[noteId] = newPositions[noteId].rotate;
          newPositions[noteId] = {
            ...newPositions[noteId],
            rotate: 0
          };
        });
        // 현재 폴더의 레이아웃에 원래 회전값 저장
        setFolderLayouts(prev => {
          const filtered = prev.filter(layout => layout.id !== (currentFolderId || 'default'));
          return [...filtered, {
            id: currentFolderId || 'default',
            positions: newPositions,
            isOCDMode: true,
            originalRotations
          }];
        });
      } else {
        // 이미 저장된 레이아웃이 있는 경우
        Object.keys(newPositions).forEach(noteId => {
          newPositions[noteId] = {
            ...newPositions[noteId],
            rotate: 0
          };
        });
      }
    } else {
      // 일반 모드로 전환 시 원래 회전값 복원
      const layoutData = folderLayouts.find(layout => layout.id === (currentFolderId || 'default'));
      if (layoutData?.originalRotations) {
        Object.keys(newPositions).forEach(noteId => {
          newPositions[noteId] = {
            ...newPositions[noteId],
            rotate: layoutData.originalRotations![noteId] || 0
          };
        });
      }
    }

    // 메인 노트는 항상 중앙에 유지
    if (selectedNote) {
      newPositions[selectedNote.id] = {
        x: 0,
        y: 0,
        rotate: 0
      };
    }
    
    setNotePositions(newPositions);
  }, [isOCDMode, currentFolderId, folderLayouts]);

  // 랜덤 위치 생성 함수 수정
  const generateRandomPosition = (
    index: number,
    positions: Record<string, NotePosition>,
    currentNote: Note,
    existingNotes: Note[],
    maxAttempts: number = PLACEMENT_ATTEMPTS
  ): { x: number; y: number } => {
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

      // 위쪽으로의 거리만 제한
      if (y < -MAX_VERTICAL_OFFSET) {
        y = -MAX_VERTICAL_OFFSET;
      }

      if (isPositionValid(x, y, positions, currentNote, existingNotes)) {
        return { x, y };
      }
    }

    // 안전한 위치를 찾지 못한 경우의 기본값
    const safeDistance = MIN_MAIN_NOTE_CLEARANCE + 
      Math.random() * (effectiveMaxDistance - MIN_MAIN_NOTE_CLEARANCE) * 0.8;
    const safeAngle = baseAngle + (Math.random() - 0.5) * Math.PI / 12;
    let x = Math.cos(safeAngle) * safeDistance;
    let y = Math.sin(safeAngle) * safeDistance;

    // 위쪽 거리 제한 적용
    if (y < -MAX_VERTICAL_OFFSET) {
      y = -MAX_VERTICAL_OFFSET;
    }
    
    return { x, y };
  };

  // Firebase에서 노트 데이터를 가져올 때 위치 정보도 함께 로드
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // 먼저 폴더 레이아웃을 로드
    const loadFolderLayouts = async () => {
      try {
        const layoutsRef = collection(db, `users/${user.uid}/folderLayouts`);
        const layoutsSnapshot = await getDocs(layoutsRef);
        const layouts = layoutsSnapshot.docs.map(doc => ({
          ...doc.data()
        } as FolderLayout));
        setFolderLayouts(layouts);
      } catch (error) {
        console.error('Failed to load layouts:', error);
      }
    };

    loadFolderLayouts();

    const notesRef = collection(db, `users/${user.uid}/notes`);
    const notesQuery = query(notesRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(notesQuery, async (snapshot) => {
      const notesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Note));
      
      // 새로운 노트 목록 설정
      setNotes(notesList);
      
      // 최초 로드 또는 선택된 노트가 없는 경우에만 초기화
      if (notesList.length > 0 && (!selectedNote || !notes.length)) {
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

        // 현재 폴더의 레이아웃 가져오기
        const currentLayout = folderLayouts.find(layout => 
          layout.id === (currentFolderId || 'default')
        );

        const newPositions: Record<string, NotePosition> = {};
        
        // 배경 노트들의 위치 설정
        backgroundNotesList.forEach((note) => {
          if (currentLayout?.positions[note.id]) {
            // 저장된 레이아웃이 있는 경우 해당 위치 사용
            newPositions[note.id] = currentLayout.positions[note.id];
          } else {
            // 새로운 노트의 경우 랜덤 위치 생성
            const position = generateRandomPosition(
              Object.keys(newPositions).length,
              newPositions,
              note,
              backgroundNotesList
            );
            newPositions[note.id] = {
              x: position.x,
              y: position.y,
              rotate: isOCDMode ? 0 : (Math.random() - 0.5) * 2 * MAX_ROTATION
            };
          }
        });

        // 메인 노트는 항상 중앙에
        newPositions[firstNote.id] = {
          x: 0,
          y: 0,
          rotate: 0
        };
        
        setNotePositions(newPositions);
        
        // OCD 모드 상태 복원
        if (currentLayout) {
          setIsOCDMode(currentLayout.isOCDMode);
        }
        
        setTimeout(() => {
          setIsInitialLayout(false);
        }, 100);
      } else {
        // 노트 목록 업데이트 시 현재 폴더의 노트만 필터링
        const backgroundNotesList = notesList.filter(n => 
          n.id !== selectedNote?.id && 
          (n.folderId === currentFolderId || (!currentFolderId && !n.folderId))
        );
        setBackgroundNotes(backgroundNotesList);
      }
    });

    return () => unsubscribe();
  }, [currentFolderId, folderLayouts]);

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

      await updateDoc(doc(db, `users/${user.uid}/notes/${noteId}`), {
        position: position
      });
      
      setIsPositionSaved(prev => ({
        ...prev,
        [noteId]: true
      }));

      showSnackbar('노트 위치가 저장되었습니다.');
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
      setNotePositions(layoutData.positions);
      setIsOCDMode(layoutData.isOCDMode);
    } else {
      // 레이아웃이 없는 경우 새로 생성
      const newPositions: Record<string, NotePosition> = {};
      const folderNotes = notes.filter(n => 
        (n.folderId === folderId || (!folderId && !n.folderId)) && 
        n.id !== selectedNote?.id
      );

      folderNotes.forEach((note, index) => {
        const position = generateRandomPosition(index, newPositions, note, folderNotes);
        newPositions[note.id] = {
          x: position.x,
          y: position.y,
          rotate: (Math.random() - 0.5) * 2 * MAX_ROTATION
        };
      });

      if (selectedNote) {
        newPositions[selectedNote.id] = {
          x: 0,
          y: 0,
          rotate: 0
        };
      }

      setNotePositions(newPositions);
      setIsOCDMode(false);
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

  // 노트 컨텐츠 영역 렌더링
  const renderNoteContent = () => {
    return (
      <>
        {renderFolderSelect()}
        <Box sx={{ 
          position: 'relative',
          width: '100%',
          maxWidth: '1200px',
          height: '800px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          transform: 'translateY(-15%)',
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
        {renderNewFolderDialog()}
      </>
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

  // 노트 배경 렌더링
  const renderBackgroundNotes = (notes: Note[]) => (
    notes.map((note) => (
      <Paper 
        key={note.id}
        elevation={3} 
        onClick={(e) => {
          if (isDragging.current) {
            e.stopPropagation();
            return;
          }
          handleNoteSelect(note);
        }}
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
          transition: draggedNoteId === note.id ? 'none' :
            isInitialLayout ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          filter: 'none',
          transformOrigin: 'center center',
          borderRadius: '16px',
          zIndex: draggedNoteId === note.id ? 100 : 1,
          cursor: 'grab',
          willChange: draggedNoteId === note.id ? 'transform' : 'auto',
          '&:active': {
            cursor: 'grabbing'
          },
          '&:hover': recentlySwappedNote === note.id ? {} : {
            opacity: 1,
            filter: 'none',
            transform: draggedNoteId === note.id ?
              `translate(
                calc(-50% + ${notePositions[note.id]?.x || 0}px), 
                calc(-50% + ${notePositions[note.id]?.y || 0}px)
              ) 
              scale(${BASE_SCALE})
              rotate(${notePositions[note.id]?.rotate || 0}deg)` :
              `translate(
                calc(-50% + ${notePositions[note.id]?.x || 0}px), 
                calc(-50% + ${notePositions[note.id]?.y || 0}px)
              )
              scale(${HOVER_SCALE})
              rotate(${notePositions[note.id]?.rotate || 0}deg)`,
            zIndex: 60,
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          },
        }}
        draggable={false}
        onMouseDown={(e) => {
          // 우클릭 시 폴더 메뉴 표시
          if (e.button === 2) {
            e.preventDefault();
            e.stopPropagation();
            setContextMenu({
              mouseX: e.clientX,
              mouseY: e.clientY,
              noteId: note.id
            });
            return;
          }

          // 좌클릭은 드래그 처리
          const startX = e.clientX;
          const startY = e.clientY;
          const startPos = notePositions[note.id];
          isDragging.current = false;
          setDraggedNoteId(note.id); // 드래그 시작 시 노트 ID 설정

          const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging.current) {
              isDragging.current = true;
            }
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            // RAF를 사용하여 부드러운 드래그 구현
            requestAnimationFrame(() => {
              setNotePositions(prev => ({
                ...prev,
                [note.id]: {
                  x: startPos.x + deltaX,
                  y: startPos.y + deltaY,
                  rotate: startPos.rotate
                }
              }));
            });
          };

          const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);

            if (isDragging.current) {
              saveNotePosition(note.id, notePositions[note.id]);
              setTimeout(() => {
                isDragging.current = false;
              }, 100);
            }
            setDraggedNoteId(null); // 드래그 종료 시 노트 ID 초기화
          };

          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
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
    ))
  );

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

  // Modify saveFolderLayout function
  const saveFolderLayout = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      setIsLayoutSaving(true);

      // Create layout data for current folder
      const layoutData: FolderLayout = {
        id: currentFolderId || 'default',
        positions: notePositions,
        isOCDMode: isOCDMode,
        originalRotations: isOCDMode ? 
          folderLayouts.find(layout => layout.id === (currentFolderId || 'default'))?.originalRotations : 
          Object.fromEntries(
            Object.entries(notePositions).map(([noteId, pos]) => [noteId, pos.rotate])
          )
      };

      // Save to Firestore
      const layoutRef = doc(db, `users/${user.uid}/folderLayouts/${layoutData.id}`);
      await setDoc(layoutRef, layoutData);

      // Update local state
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

  // Modify renderOCDToggle
  const renderOCDToggle = () => (
    <Box sx={{
      position: 'absolute',
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
      zIndex: 1000,
      '&:hover': {
        bgcolor: 'rgba(255, 255, 255, 0.9)',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      }
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
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
      <Box sx={{ 
        height: '24px', 
        width: '1px', 
        bgcolor: 'rgba(0,0,0,0.1)',
        mx: 1 
      }} />
      <LoadingButton
        size="small"
        onClick={saveFolderLayout}
        loading={isLayoutSaving}
        loadingPosition="start"
        startIcon={showSaveSuccess ? <CheckIcon /> : <SaveIcon />}
        sx={{
          bgcolor: showSaveSuccess ? '#9cbb9c' : 'white',
          color: showSaveSuccess ? 'white' : '#666',
          '&:hover': {
            bgcolor: showSaveSuccess ? '#7a9e7a' : 'rgba(0,0,0,0.05)',
          },
          transition: 'all 0.3s',
          minWidth: '100px',
        }}
      >
        {showSaveSuccess ? '저장됨' : '레이아웃 저장'}
      </LoadingButton>
    </Box>
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

      {renderContextMenu()}
    </Box>
  );
}; 
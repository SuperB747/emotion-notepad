import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  folderName: string | null;  // 폴더 이름 추가
  updatedAt?: any;
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
  const [hoverDisabledNote, setHoverDisabledNote] = useState<string | null>(null);
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
  const isDragging = useRef(false);
  const dragStartPosition = useRef({ x: 0, y: 0 });
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);
  const draggedNotes = useRef(new Map<string, boolean>());
  const dragDistance = useRef(0);
  const dragStartTime = useRef(0);
  const [folderLayouts, setFolderLayouts] = useState<FolderLayout[]>([]);
  const [isLayoutSaving, setIsLayoutSaving] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [maxZIndex, setMaxZIndex] = useState(10);
  const originalZIndexRef = useRef<Record<string, number>>({});  // 여러 노트의 원래 z-index를 저장하기 위해 객체로 변경
  
  // z-index 관련 상수 수정
  const MAIN_NOTE_Z_INDEX = 95;
  const Z_INDEX_THRESHOLD = 80;
  const Z_INDEX_REDUCTION = 50;
  const HOVER_Z_INDEX = 100; // 호버 시 메인 노트보다 더 높게 설정

  // 드래그 관련 상수와 ref를 컴포넌트 최상위에 선언
  const DRAG_THRESHOLD = 5;

  // Constants for layout calculations
  const MAX_ROTATION = 5; // 최대 회전 각도
  const SAFE_MARGIN = 150; // 화면 경계와의 최소 간격
  const MIN_DISTANCE = 250; // 노트 간 최소 거리
  const MIN_SAME_COLOR_DISTANCE = 350; // 같은 색상 노트 간 최소 거리
  const MIN_MAIN_NOTE_CLEARANCE = 100; // 메인 노트와의 최소 거리
  const MAX_MAIN_NOTE_CLEARANCE = 300; // 메인 노트와의 최대 거리
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

  // 메인 노트와의 오버랩 관련 상수 추가
  const MAIN_NOTE_OVERLAP_PERCENT = 30; // 메인 노트와 배경 노트가 겹칠 수 있는 최대 비율 (0-100)
  const MAIN_NOTE_EFFECTIVE_WIDTH = MAIN_NOTE_WIDTH * (1 - MAIN_NOTE_OVERLAP_PERCENT / 100);
  const MAIN_NOTE_EFFECTIVE_HEIGHT = MAIN_NOTE_HEIGHT * (1 - MAIN_NOTE_OVERLAP_PERCENT / 100);

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

  // 두 사각형이 겹치는지 확인하는 함수
  const isRectanglesOverlap = (
    rect1: { left: number; right: number; top: number; bottom: number },
    rect2: { left: number; right: number; top: number; bottom: number }
  ): boolean => {
    return !(
      rect1.right < rect2.left ||
      rect1.left > rect2.right ||
      rect1.bottom < rect2.top ||
      rect1.top > rect2.bottom
    );
  };

  // 두 사각형 간의 최단 거리 계산
  const getRectanglesDistance = (
    rect1: { left: number; right: number; top: number; bottom: number },
    rect2: { left: number; right: number; top: number; bottom: number }
  ): number => {
    const distX = Math.max(rect1.left - rect2.right, 0, rect2.left - rect1.right);
    const distY = Math.max(rect1.top - rect2.bottom, 0, rect2.top - rect1.bottom);
    return Math.sqrt(distX * distX + distY * distY);
  };

  // 메인 노트와의 거리 계산
  const getDistanceFromMainNote = (x: number, y: number): number => {
    // 메인 노트의 경계 계산 (실제 크기)
    const mainNoteLeft = -MAIN_NOTE_WIDTH / 2;
    const mainNoteRight = MAIN_NOTE_WIDTH / 2;
    const mainNoteTop = -MAIN_NOTE_HEIGHT / 2;
    const mainNoteBottom = MAIN_NOTE_HEIGHT / 2;

    // 배경 노트의 경계 계산 (실제 크기와 스케일 고려)
    const bgNoteWidth = BACKGROUND_NOTE_WIDTH * BASE_SCALE;
    const bgNoteHeight = BACKGROUND_NOTE_HEIGHT * BASE_SCALE;
    const bgNoteHalfWidth = bgNoteWidth / 2;
    const bgNoteHalfHeight = bgNoteHeight / 2;

    // 배경 노트의 경계
    const bgNoteLeft = x - bgNoteHalfWidth;
    const bgNoteRight = x + bgNoteHalfWidth;
    const bgNoteTop = y - bgNoteHalfHeight;
    const bgNoteBottom = y + bgNoteHalfHeight;

    // 겹치는 영역 계산
    const overlapLeft = Math.max(mainNoteLeft, bgNoteLeft);
    const overlapRight = Math.min(mainNoteRight, bgNoteRight);
    const overlapTop = Math.max(mainNoteTop, bgNoteTop);
    const overlapBottom = Math.min(mainNoteBottom, bgNoteBottom);

    // 겹치는 영역이 있는지 확인
    if (overlapLeft < overlapRight && overlapTop < overlapBottom) {
      // 겹치는 영역의 넓이 계산
      const overlapWidth = overlapRight - overlapLeft;
      const overlapHeight = overlapBottom - overlapTop;
      const overlapArea = overlapWidth * overlapHeight;

      // 배경 노트의 전체 넓이
      const bgNoteArea = bgNoteWidth * bgNoteHeight;

      // 배경 노트 대비 겹치는 영역의 비율 계산
      const overlapPercent = (overlapArea / bgNoteArea) * 100;

      // 허용된 오버랩 비율보다 크면 충돌로 판정
      if (overlapPercent > MAIN_NOTE_OVERLAP_PERCENT) {
        return 0;
      }
    }

    // 두 사각형 간의 최단 거리 계산
    const dx = Math.max(mainNoteLeft - bgNoteRight, 0, bgNoteLeft - mainNoteRight);
    const dy = Math.max(mainNoteTop - bgNoteBottom, 0, bgNoteTop - mainNoteBottom);
    
    return Math.sqrt(dx * dx + dy * dy);
  };

  // 화면 범위 체크
  const isWithinScreen = (x: number, y: number, rotation: number): boolean => {
    const bgNoteHalfWidth = (BACKGROUND_NOTE_WIDTH * BASE_SCALE) / 2;
    const bgNoteHalfHeight = (BACKGROUND_NOTE_HEIGHT * BASE_SCALE) / 2;
    
    // 회전을 고려한 경계 상자 계산
    const angleRad = (rotation * Math.PI) / 180;
    const cosAngle = Math.cos(angleRad);
    const sinAngle = Math.sin(angleRad);
    
    // 회전된 사각형의 각 꼭지점 계산
    const corners = [
      { x: -bgNoteHalfWidth, y: -bgNoteHalfHeight },
      { x: bgNoteHalfWidth, y: -bgNoteHalfHeight },
      { x: bgNoteHalfWidth, y: bgNoteHalfHeight },
      { x: -bgNoteHalfWidth, y: bgNoteHalfHeight }
    ].map(point => ({
      x: x + (point.x * cosAngle - point.y * sinAngle),
      y: y + (point.x * sinAngle + point.y * cosAngle)
    }));
    
    // 회전된 사각형의 경계 상자 계산
    const minX = Math.min(...corners.map(p => p.x));
    const maxX = Math.max(...corners.map(p => p.x));
    const minY = Math.min(...corners.map(p => p.y));
    const maxY = Math.max(...corners.map(p => p.y));

    // 화면 범위 체크 (여백 고려)
    return (
      minX >= -FRAME_WIDTH / 2 + SAFE_MARGIN &&
      maxX <= FRAME_WIDTH / 2 - SAFE_MARGIN &&
      minY >= -FRAME_HEIGHT / 2 + SAFE_MARGIN &&
      maxY <= FRAME_HEIGHT / 2 - SAFE_MARGIN
    );
  };

  // 위치가 메인 노트와 충분히 떨어져 있는지 확인
  const isPositionValid = (x: number, y: number, positions: Record<string, NotePosition>, currentNote: Note, existingNotes: Note[]): boolean => {
    // 메인 노트와의 거리 체크 (오버랩 허용 비율 적용)
    const distanceFromMain = getDistanceFromMainNote(x, y);
    if (distanceFromMain === 0) {
      return false; // 메인 노트의 유효 영역과 겹침
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

  // 노트 선택 핸들러 수정
  const handleNoteSelect = (note: Note) => {
    if (selectedNote?.id === note.id) return;

    // 클릭한 배경 노트의 현재 위치와 회전값, z-index 저장
    const clickedNotePosition = notePositions[note.id];
    if (!clickedNotePosition) return;

    // 현재 선택된 노트가 있다면 배경으로 전환
    if (selectedNote) {
      const currentMainNote = notes.find(n => n.id === selectedNote.id);
      if (currentMainNote) {
        // 현재 메인 노트를 클릭한 배경 노트의 위치로 이동
        const newZIndex = Math.max(1, ...Object.values(notePositions)
          .filter(pos => pos.zIndex !== MAIN_NOTE_Z_INDEX && pos.zIndex !== HOVER_Z_INDEX)
          .map(pos => pos.zIndex || 0)) + 1;

        setNotePositions(prev => ({
          ...prev,
          [selectedNote.id]: {
            ...clickedNotePosition,
            zIndex: newZIndex // 새로운 z-index 할당
          }
        }));
        setBackgroundNotes(prev => [...prev, currentMainNote]);
        
        // 이전 메인 노트의 호버 효과 비활성화
        setHoverDisabledNote(selectedNote.id);
      }
    }

    // 선택된 노트를 배경에서 제거하고 메인 노트로 설정
    setBackgroundNotes(prev => prev.filter(n => n.id !== note.id));
    setSelectedNote(note);
    setRecentlySwappedNote(note.id);

    // 새로운 메인 노트의 위치 설정 (기존 위치와 회전값 유지)
    setNotePositions(prev => ({
      ...prev,
      [note.id]: {
        ...clickedNotePosition,
        zIndex: MAIN_NOTE_Z_INDEX
      }
    }));

    // 잠시 후 전환 효과 종료
    setTimeout(() => {
      setRecentlySwappedNote(null);
    }, 300);
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

  // 드래그 종료 핸들러 수정
  const handleDragEnd = (e: MouseEvent) => {
    if (!draggedNoteId || !isDragging.current) return;

    const finalX = e.clientX - dragStartPosition.current.x;
    const finalY = e.clientY - dragStartPosition.current.y;

    // 겹치는 노트들 중 가장 높은 z-index 찾기
    const highestZIndex = findHighestOverlappingZIndex(finalX, finalY, draggedNoteId);
    const newZIndex = Math.max(1, highestZIndex + 1);

    setNotePositions(prev => ({
      ...prev,
      [draggedNoteId]: {
        ...prev[draggedNoteId],
        x: finalX,
        y: finalY,
        zIndex: newZIndex
      }
    }));

    setDraggedNoteId(null);
    isDragging.current = false;
  };

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
      // 메인 노트로부터의 최소 거리를 더 크게 설정
      const minDistance = MIN_MAIN_NOTE_CLEARANCE + BACKGROUND_NOTE_WIDTH * BASE_SCALE;
      const distance = minDistance + Math.random() * (effectiveMaxDistance - minDistance);
      
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
    const safeDistance = MIN_MAIN_NOTE_CLEARANCE + BACKGROUND_NOTE_WIDTH * BASE_SCALE + 
      Math.random() * (effectiveMaxDistance - MIN_MAIN_NOTE_CLEARANCE) * 0.8;
    const safeAngle = baseAngle + (Math.random() - 0.5) * Math.PI / 12;
    let x = Math.cos(safeAngle) * safeDistance;
    let y = Math.sin(safeAngle) * safeDistance + 50;

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

    // Firebase에서 노트 데이터를 가져올 때 위치 정보도 함께 로드
    const notesRef = collection(db, `users/${user.uid}/notes`);
    const notesQuery = query(notesRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(notesQuery, async (snapshot) => {
      const notesList = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
        } as Note;
      });
      
      setNotes(notesList);

      // 노트 데이터가 로드된 후 레이아웃도 로드
      try {
        await loadFolderLayout(currentFolderId);
      } catch (error) {
        console.error('Error loading layout after notes:', error);
      }
    });

    return () => unsubscribe();
  }, [currentFolderId]); // currentFolderId를 의존성 배열에 추가

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
    console.log('Changing folder to:', folderId);
    console.log('Current folders:', folders);
    console.log('Is root folder:', !folderId);
    
    setCurrentFolderId(folderId);
    
    // root 폴더이거나 폴더 정보가 로드된 경우에만 레이아웃 로드
    if (!folderId || folders.length > 0) {
      await loadFolderLayout(folderId);
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

    const unsubscribe = onSnapshot(foldersQuery, async (snapshot) => {
      const foldersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Folder));
      
      console.log('Folders loaded:', foldersList);
      setFolders(foldersList);

      // 폴더 로드 후 현재 폴더의 레이아웃도 다시 로드
      try {
        await loadFolderLayout(currentFolderId);
      } catch (error) {
        console.error('Error loading layout after folders:', error);
      }
    });

    return () => unsubscribe();
  }, [currentFolderId]); // currentFolderId를 의존성 배열에 추가

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

      const isTransitioning = recentlySwappedNote === note.id;
      const isHoverDisabled = hoverDisabledNote === note.id;

      return (
        <Paper 
          key={note.id}
          elevation={3} 
          onMouseDown={(e: React.MouseEvent<HTMLDivElement>) => {
            if (e.button === 0) { // 좌클릭만 처리
              e.preventDefault(); // 텍스트 선택 방지
              e.stopPropagation(); // 이벤트 버블링 방지
              isDragging.current = true;
              dragDistance.current = 0;
              dragStartTime.current = Date.now();
              setDraggedNoteId(note.id);
              dragStartPosition.current = {
                x: e.clientX - (position.x || 0),
                y: e.clientY - (position.y || 0)
              };

              // 드래그 시작 시 현재 z-index 저장
              const currentPosition = notePositions[note.id];
              if (currentPosition) {
                originalZIndexRef.current[note.id] = currentPosition.zIndex || 1;
            }

              // 드래그 시작 시 z-index를 100으로 설정
              setNotePositions(prev => ({
                ...prev,
                [note.id]: {
                  ...prev[note.id],
                  zIndex: HOVER_Z_INDEX
                }
              }));
            }
          }}
          onClick={(e: React.MouseEvent<HTMLDivElement>) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
            if (isTransitioning || isHoverDisabled || isDragging.current) return;
            
            const currentPosition = notePositions[note.id];
            if (!currentPosition) return;

            // 현재 z-index를 저장 (undefined인 경우 현재 position의 zIndex 사용)
            originalZIndexRef.current[note.id] = currentPosition.zIndex || currentPosition.zIndex === 0 ? currentPosition.zIndex : 1;
            
            setNotePositions(prev => ({
              ...prev,
              [note.id]: {
                ...prev[note.id],
                zIndex: HOVER_Z_INDEX
              }
            }));
          }}
          onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
            if (isTransitioning) return;

            // 드래그가 끝난 직후에는 z-index를 복원하지 않음
            if (originalZIndexRef.current[note.id] !== undefined && !isDragging.current) {
              const originalZIndex = originalZIndexRef.current[note.id];
              setNotePositions(prev => ({
                ...prev,
                [note.id]: {
                  ...prev[note.id],
                  zIndex: originalZIndex
                }
              }));
              // 복원 후 저장된 z-index 삭제
              delete originalZIndexRef.current[note.id];
            }
            
            // 마우스가 노트를 떠날 때 호버 비활성화 상태 해제
            if (hoverDisabledNote === note.id) {
              setHoverDisabledNote(null);
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
              isInitialLayout ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            filter: 'none',
            transformOrigin: 'center center',
            borderRadius: '16px',
            zIndex: position.zIndex || 1,
            cursor: isDragging.current && draggedNoteId === note.id ? 'grabbing' : 'pointer',
            willChange: draggedNoteId === note.id ? 'transform' : 'auto',
            visibility: isTransitioning ? 'hidden' : 'visible',
            userSelect: 'none',
            '&:hover': (isTransitioning || isHoverDisabled || isDragging.current) ? {} : {
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
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
              cursor: isDragging.current && draggedNoteId === note.id ? 'grabbing' : 'pointer',
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
          position.zIndex !== MAIN_NOTE_Z_INDEX &&
          position.zIndex !== HOVER_Z_INDEX &&
          isNotesOverlapping(x, y, position.x, position.y)) {
        highestZIndex = Math.max(highestZIndex, position.zIndex || 0);
      }
    });
    
    return highestZIndex;
  };

  // 노트 간의 겹침 여부를 확인하는 함수 추가
  const isNotesOverlapping = (x1: number, y1: number, x2: number, y2: number): boolean => {
    const noteWidth = BACKGROUND_NOTE_WIDTH * BASE_SCALE;
    const noteHeight = BACKGROUND_NOTE_HEIGHT * BASE_SCALE;
    
    const rect1 = {
      left: x1 - noteWidth / 2,
      right: x1 + noteWidth / 2,
      top: y1 - noteHeight / 2,
      bottom: y1 + noteHeight / 2
    };
    
    const rect2 = {
      left: x2 - noteWidth / 2,
      right: x2 + noteWidth / 2,
      top: y2 - noteHeight / 2,
      bottom: y2 + noteHeight / 2
    };
    
    return !(rect1.right < rect2.left || 
             rect1.left > rect2.right || 
             rect1.bottom < rect2.top || 
             rect1.top > rect2.bottom);
  };

  // 레이아웃 저장 함수 수정
  const saveFolderLayout = async () => {
    try {
      setIsLayoutSaving(true);
      const user = auth.currentUser;
      if (!user) return;

      // root 폴더가 아닌데 폴더 정보가 로드되지 않았다면 대기
      if (currentFolderId && folders.length === 0) {
        console.log('Waiting for folders to load...');
        setIsLayoutSaving(false);
        return;
      }

      const layoutId = currentFolderId || 'root';
      const layoutRef = doc(db, `users/${user.uid}/layouts/${layoutId}`);
      
      // 현재 폴더 이름 가져오기 (root 폴더는 항상 '전체 보기')
      const folderName = currentFolderId 
        ? folders.find(f => f.id === currentFolderId)?.name || null
        : '전체 보기';

      console.log('Saving layout with folder name:', folderName);
      console.log('Current folder ID:', currentFolderId);
      console.log('Available folders:', folders);
      console.log('Is root folder:', !currentFolderId);

      const layoutData = {
        id: layoutId,
        positions: notePositions,
        isOCDMode: isOCDMode,
        folderName: folderName,
        updatedAt: serverTimestamp()
      };

      console.log('Saving layout data:', layoutData);

      // 현재 레이아웃 정보와 함께 OCD 모드 상태와 폴더 이름도 저장
      await setDoc(layoutRef, layoutData);

      // 저장 후 데이터 확인
      const savedDoc = await getDoc(layoutRef);
      console.log('Saved layout data:', savedDoc.data());

      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 2000);
    } catch (error) {
      console.error('Error saving layout:', error);
    } finally {
      setIsLayoutSaving(false);
    }
  };

  // Modify loadFolderLayout function
  const loadFolderLayout = useCallback(async (folderId: string | null) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const layoutId = folderId || 'root';
      const layoutRef = doc(db, `users/${user.uid}/layouts/${layoutId}`);
    
      console.log('Loading layout for folder:', folderId);
      console.log('Layout ID:', layoutId);
      console.log('Is root folder:', !folderId);

      const layoutDoc = await getDoc(layoutRef);
      console.log('Layout document exists:', layoutDoc.exists());

      if (layoutDoc.exists()) {
        const layoutData = layoutDoc.data() as FolderLayout;
        console.log('Loaded layout data:', layoutData);

        setNotePositions(layoutData.positions);
        setIsOCDMode(layoutData.isOCDMode);
        setIsInitialLayout(false);

        // Update folderLayouts state with folder name
        setFolderLayouts(prev => {
          const filtered = prev.filter(layout => layout.id !== layoutId);
          const newLayouts = [...filtered, layoutData];
          console.log('Updated folder layouts:', newLayouts);
          return newLayouts;
        });

        // 폴더 이름이 변경되었다면 업데이트 (root 폴더는 제외)
        if (folderId && layoutData.folderName && folderId !== 'root') {
          const folder = folders.find(f => f.id === folderId);
          console.log('Found folder:', folder);
          console.log('Layout folder name:', layoutData.folderName);

          if (folder && folder.name !== layoutData.folderName) {
            console.log('Updating folder name from', folder.name, 'to', layoutData.folderName);
            const folderRef = doc(db, `users/${user.uid}/folders/${folderId}`);
            await updateDoc(folderRef, {
              name: layoutData.folderName
            });
          }
        }
      } else {
        // 레이아웃이 없는 경우 기본값 설정
        if (!folderId) {  // root 폴더인 경우
          setNotePositions({});
          setIsOCDMode(false);
          setIsInitialLayout(true);
        }
      }
    } catch (error) {
      console.error('Failed to load layout:', error);
    }
  }, [folders]);

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

  // 전역 마우스 이벤트 핸들러 추가
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !draggedNoteId) return;

      const deltaX = e.clientX - dragStartPosition.current.x;
      const deltaY = e.clientY - dragStartPosition.current.y;
      dragDistance.current = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // 드래그 중인 노트 위치 업데이트
      setNotePositions(prev => ({
        ...prev,
        [draggedNoteId]: {
          ...prev[draggedNoteId],
          x: e.clientX - dragStartPosition.current.x,
          y: e.clientY - dragStartPosition.current.y,
          zIndex: HOVER_Z_INDEX // 드래그 중에는 z-index를 100으로 설정
        }
      }));
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!isDragging.current || !draggedNoteId) return;

      const deltaTime = Date.now() - dragStartTime.current;
      const isQuickAction = deltaTime < 200 && dragDistance.current < 5;

      if (isQuickAction) {
        // 빠른 클릭으로 간주하고 노트 선택
        const note = notes.find(n => n.id === draggedNoteId);
        if (note) {
          handleNoteSelect(note);
        }
      } else {
        // 드래그로 간주하고 위치 업데이트
        const finalX = e.clientX - dragStartPosition.current.x;
        const finalY = e.clientY - dragStartPosition.current.y;

        // 겹치는 노트들 중 가장 높은 z-index 찾기
        let highestZIndex = 1;
        Object.entries(notePositions).forEach(([noteId, pos]) => {
          if (noteId !== draggedNoteId && 
              pos.zIndex !== MAIN_NOTE_Z_INDEX && 
              pos.zIndex !== HOVER_Z_INDEX) {
            // 노트 간의 겹침 여부 확인
            const isOverlapping = Math.abs(pos.x - finalX) < NOTE_WIDTH &&
                                Math.abs(pos.y - finalY) < NOTE_HEIGHT;
            
            if (isOverlapping) {
              highestZIndex = Math.max(highestZIndex, pos.zIndex || 1);
            }
          }
        });

        // 겹치는 노트들보다 1 높은 z-index 설정
        const newZIndex = highestZIndex + 1;

        // 드래그된 노트의 원래 z-index 삭제 (호버 효과 제거)
        delete originalZIndexRef.current[draggedNoteId];

        setNotePositions(prev => ({
          ...prev,
          [draggedNoteId]: {
            ...prev[draggedNoteId],
            x: finalX,
            y: finalY,
            zIndex: newZIndex // HOVER_Z_INDEX 대신 새로 계산된 z-index 사용
          }
        }));

        // 드래그가 끝난 노트의 호버 효과 비활성화
        setHoverDisabledNote(draggedNoteId);
      }

      // 드래그 상태 초기화
      isDragging.current = false;
      setDraggedNoteId(null);
      dragDistance.current = 0;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggedNoteId, notes]);

  // 노트의 크기 상수 추가 (컴포넌트 최상단에 추가)
  const NOTE_WIDTH = 350;  // Paper 컴포넌트의 width와 동일하게 설정
  const NOTE_HEIGHT = 250; // Paper 컴포넌트의 minHeight와 동일하게 설정

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
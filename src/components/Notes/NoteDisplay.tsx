import React, { useRef, useEffect } from 'react';
import { Box, Paper, Typography, CircularProgress, Switch, Button } from '@mui/material';
import { motion } from 'framer-motion';
import { Note, NotePosition, Folder, NoteColor } from '../../types/noteTypes';
import { NoteComponent } from './NoteComponent';
import { EmptyState } from '../Layout/EmptyState';
import { Z_INDEX, LAYOUT } from '../../constants/noteConstants';
import { NoteCard } from './NoteCard';
import { Save, Check, Shuffle } from '@mui/icons-material';

interface NoteDisplayProps {
    notes: Note[];
    folders: Folder[];
    selectedNote: Note | null;
    backgroundNotes: Note[];
    notePositions: Record<string, NotePosition>;
    currentFolderId: string | null;
    onNoteSelect: (note: Note) => void;
    onDragStart: () => void;
    onDragEnd: (note: Note, point: { x: number; y: number }) => void;
    isDragging: boolean;
    isOCDMode: boolean;
    onOCDToggle: (checked: boolean) => void;
    onShuffle: () => void;
    onSaveLayout: () => void;
    isLayoutSaving: boolean;
    showSaveSuccess: boolean;
    currentFolderName: string;
    setContainerSize: (size: { width: number; height: number }) => void;
    // Props for editing
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

const MotionPaper = motion(Paper);
const NOTE_WIDTH = 220;
const NOTE_HEIGHT = 180;

export const NoteDisplay: React.FC<NoteDisplayProps> = ({
    notes,
    folders,
    selectedNote,
    backgroundNotes,
    notePositions,
    isDragging,
    onNoteSelect,
    onDragStart,
    onDragEnd,
    isOCDMode,
    onOCDToggle,
    onShuffle,
    onSaveLayout,
    isLayoutSaving,
    showSaveSuccess,
    currentFolderId,
    currentFolderName,
    setContainerSize,
    ...rest
}) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setContainerSize({ width: rect.width, height: rect.height });
        }
    }, [setContainerSize]);

    const renderBackgroundNotes = () => {
        return backgroundNotes.map(note => {
            const position = notePositions[note.id] || { x: 0, y: 0, zIndex: 1, rotate: 0 };
            const rotation = isOCDMode ? 0 : position.rotate;

            return (
                <MotionPaper
                    key={note.id}
                    drag
                    dragMomentum={false}
                    onTap={() => onNoteSelect(note)}
                    onDragStart={onDragStart}
                    onDragEnd={(e, info) => {
                        const startPosition = notePositions[note.id] || { x: 0, y: 0 };
                        const x = startPosition.x + info.offset.x;
                        const y = startPosition.y + info.offset.y;
                        onDragEnd(note, { x, y });
                    }}
                    whileHover={{ scale: isDragging ? 1 : 1.05, zIndex: Z_INDEX.HOVER }}
                    whileTap={{ cursor: 'grabbing', scale: 1.05, zIndex: Z_INDEX.DRAGGING }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    style={{
                        position: 'absolute',
                        width: NOTE_WIDTH,
                        height: NOTE_HEIGHT,
                        cursor: 'grab',
                        userSelect: 'none',
                        borderRadius: '16px',
                        left: '50%',
                        top: '50%',
                        x: position.x - NOTE_WIDTH / 2,
                        y: position.y - NOTE_HEIGHT / 2,
                    }}
                    animate={{
                        rotate: rotation,
                        zIndex: position.zIndex,
                        opacity: 0.85,
                    }}
                >
                    <NoteComponent note={note} isBackground={true} />
                </MotionPaper>
            );
        });
    };

    const renderSelectedNote = () => {
        if (!selectedNote) {
            return <EmptyState message="메모를 선택해주세요." />;
        }
        return (
            <Box
                sx={{
                  position: 'absolute',
                  width: `${LAYOUT.MAIN_NOTE_WIDTH}px`,
                  height: `${LAYOUT.MAIN_NOTE_HEIGHT}px`,
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: Z_INDEX.MAIN,
                }}
            >
                <NoteCard note={selectedNote} {...rest} />
            </Box>
        );
    };

    const renderNoteControls = () => (
        <Box sx={{
            position: 'fixed', top: 16, right: 16, display: 'flex', alignItems: 'center', gap: 2,
            bgcolor: 'rgba(255, 255, 255, 0.8)', padding: '6px 12px', borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)', zIndex: 2000,
        }}>
            <Typography sx={{ fontWeight: 600, color: '#2c5530', whiteSpace: 'nowrap' }}>
                {currentFolderName}
                <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                    ({notes.filter(note => currentFolderId ? note.folderId === currentFolderId : !note.folderId).length}개)
                </span>
            </Typography>
            <Box sx={{ height: '24px', width: '1px', bgcolor: 'rgba(0,0,0,0.1)' }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography sx={{ fontWeight: 600, color: isOCDMode ? '#2c5530' : '#666' }}>OCD</Typography>
                <Switch size="small" checked={isOCDMode} onChange={(e) => onOCDToggle(e.target.checked)} />
            </Box>
            <Box sx={{ height: '24px', width: '1px', bgcolor: 'rgba(0,0,0,0.1)' }} />
            <Button size="small" onClick={onShuffle} startIcon={<Shuffle />}>섞기</Button>
            <Box sx={{ height: '24px', width: '1px', bgcolor: 'rgba(0,0,0,0.1)' }} />
            <Button size="small" onClick={onSaveLayout} disabled={isLayoutSaving} startIcon={showSaveSuccess ? <Check /> : <Save />} sx={{ minWidth: '120px' }}>
                {isLayoutSaving ? <CircularProgress size={14} /> : (showSaveSuccess ? '저장됨' : '레이아웃 저장')}
            </Button>
        </Box>
    );

    return (
        <Box ref={containerRef} sx={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
            {renderNoteControls()}
            {renderBackgroundNotes()}
            {renderSelectedNote()}
        </Box>
    );
};

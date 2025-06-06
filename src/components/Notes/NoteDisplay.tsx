import React, { useRef, useEffect, useState } from 'react';
import { Box, Paper, Typography, CircularProgress, Switch, Button } from '@mui/material';
import { motion } from 'framer-motion';
import type { Note, NotePosition, Folder, NoteColor } from '../../types/noteTypes';
import { EmptyState } from '../Layout/EmptyState';
import { Z_INDEX, LAYOUT, NOTE_COLORS } from '../../constants/noteConstants';
import { NoteCard } from './NoteCard';
import { Save, Check, Shuffle } from '@mui/icons-material';

const NOTE_WIDTH = 220;
const NOTE_HEIGHT = 180;
const CANVAS_WIDTH = 1500;
const MotionPaper = motion(Paper);

interface NoteDisplayProps {
    notes: Note[];
    folders: Folder[];
    selectedNote: Note | null;
    notePositions: Record<string, NotePosition>;
    currentFolderId: string | null;
    onNoteSelect: (note: Note) => void;
    onDragStart: () => void;
    onDragEnd: () => void;
    onNoteDrag: (id: string, offset: { x: number; y: number }) => void;
    isDragging: boolean;
    isOCDMode: boolean;
    onOCDToggle: (checked: boolean) => void;
    onShuffle: () => void;
    onSaveLayout: () => void;
    isLayoutSaving: boolean;
    showSaveSuccess: boolean;
    currentFolderName: string;
    setContainerSize: (size: { width: number; height: number }) => void;
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

export const NoteDisplay: React.FC<NoteDisplayProps> = ({
    notes,
    folders,
    selectedNote,
    notePositions,
    isDragging,
    onNoteSelect,
    onDragStart,
    onDragEnd,
    onNoteDrag,
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
    const [transitioningNoteId, setTransitioningNoteId] = useState<string | null>(null);

    useEffect(() => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setContainerSize({ width: rect.width, height: rect.height });
            containerRef.current.scrollLeft = (CANVAS_WIDTH - rect.width) / 2;
        }
    }, [setContainerSize]);

    const handleNoteClick = (note: Note) => {
        if (note.id === selectedNote?.id) return;
        setTransitioningNoteId(note.id);
        onNoteSelect(note);
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
            <Button size="small" onClick={onShuffle} startIcon={<Shuffle />}>노트섞기</Button>
            <Box sx={{ height: '24px', width: '1px', bgcolor: 'rgba(0,0,0,0.1)' }} />
            <Button size="small" onClick={onSaveLayout} disabled={isLayoutSaving} startIcon={showSaveSuccess ? <Check /> : <Save />} sx={{ minWidth: '120px' }}>
                {isLayoutSaving ? <CircularProgress size={14} /> : (showSaveSuccess ? '저장됨' : '레이아웃 저장')}
            </Button>
        </Box>
    );

    return (
        <Box 
            ref={containerRef} 
            sx={{ 
                flexGrow: 1, 
                position: 'relative', 
                overflow: 'hidden',
                background: 'radial-gradient(circle, #e0e0e0, #c0c0c0)',
            }}
        >
            <Box sx={{ position: 'relative', width: CANVAS_WIDTH, height: '100%' }}>
                {notes.length === 0 && <EmptyState message="노트를 추가해주세요." />}
                {notes.map(note => {
                    const isSelected = note.id === selectedNote?.id;
                    const isTransitioning = note.id === transitioningNoteId;
                    const position = notePositions[note.id];
                    if (!position) return null;

                    const width = isSelected ? LAYOUT.MAIN_NOTE_WIDTH : NOTE_WIDTH;
                    const height = isSelected ? LAYOUT.MAIN_NOTE_HEIGHT : NOTE_HEIGHT;
                    const x = isSelected ? -width / 2 : position.x - NOTE_WIDTH / 2;
                    const y = isSelected ? -height / 2 : position.y - NOTE_HEIGHT / 2;
                    
                    const getBackgroundColor = () => {
                        const colorKey = rest.isEditing && isSelected ? rest.editedColor : note.color || 'yellow';
                        return NOTE_COLORS[colorKey]?.bg || NOTE_COLORS.yellow.bg;
                    };
                    
                    return (
                        <MotionPaper
                            key={note.id}
                            layout
                            drag
                            dragMomentum={false}
                            onDragStart={onDragStart}
                            onDragEnd={(e, info) => {
                                const wasDragged = Math.abs(info.offset.x) > 2 || Math.abs(info.offset.y) > 2;
                                if (wasDragged) {
                                    onNoteDrag(note.id, { x: info.offset.x, y: info.offset.y });
                                } else {
                                    handleNoteClick(note);
                                }
                                onDragEnd();
                            }}
                            onLayoutAnimationComplete={() => {
                                if (isTransitioning) {
                                    setTransitioningNoteId(null);
                                }
                            }}
                            whileHover={!isSelected && !isDragging ? { scale: 1.05, zIndex: Z_INDEX.HOVER } : {}}
                            whileTap={{ cursor: 'grabbing' }}
                            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                            style={{
                                position: 'absolute',
                                left: `${CANVAS_WIDTH / 2}px`,
                                top: '50%',
                                cursor: isSelected ? 'default' : (isDragging ? 'grabbing' : 'pointer'),
                                userSelect: 'none',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                borderRadius: '16px',
                            }}
                            animate={{
                                width,
                                height,
                                x,
                                y,
                                rotate: isSelected ? 0 : (isOCDMode ? 0 : position.rotate),
                                zIndex: position.zIndex,
                                background: getBackgroundColor(),
                            }}
                        >
                            <NoteCard
                                note={note}
                                viewMode={isSelected && !isTransitioning ? 'full' : 'summary'}
                                {...rest}
                            />
                        </MotionPaper>
                    );
                })}
            </Box>
            {renderNoteControls()}
        </Box>
    );
};

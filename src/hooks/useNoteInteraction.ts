import { useState, useRef, useCallback } from 'react';
import type { Note, NotePosition } from '../types/noteTypes';
import { Z_INDEX } from '../constants/noteConstants';

export const useNoteInteraction = (
    selectedNote: Note | null,
    backgroundNotes: Note[],
    notePositions: Record<string, NotePosition>,
    setSelectedNote: (note: Note | null) => void,
    setBackgroundNotes: (notes: Note[]) => void,
    setNotePositions: React.Dispatch<React.SetStateAction<Record<string, NotePosition>>>,
    normalizeZIndices: () => void,
) => {
    const isDragging = useRef(false);

    const handleNoteSelect = (note: Note) => {
        if (selectedNote?.id === note.id || isDragging.current) return;

        const isCurrentlyBackground = backgroundNotes.some(n => n.id === note.id);
        if (isCurrentlyBackground) {
            if (!selectedNote) return;
            
            const bgZIndexes = backgroundNotes
                .filter(n => n.id !== note.id)
                .map(n => notePositions[n.id]?.zIndex || 0);
            const maxZ = Math.max(0, ...bgZIndexes);
            const newZForOldMain = maxZ + 1;

            const newBackgroundNotes = backgroundNotes.map(n => n.id === note.id ? selectedNote : n);
            
            const mainNoteOriginalPosition = notePositions[selectedNote.id] || { x: 0, y: 0, rotate: 0, zIndex: Z_INDEX.MAIN };
            const backgroundNoteOriginalPosition = notePositions[note.id];
            
            setNotePositions(prev => ({
                ...prev,
                [selectedNote.id]: { ...backgroundNoteOriginalPosition, zIndex: newZForOldMain }, 
                [note.id]: { ...mainNoteOriginalPosition, x: 0, y: 0, rotate: 0, zIndex: Z_INDEX.MAIN } 
            }));
            
            setBackgroundNotes(newBackgroundNotes);
            setSelectedNote(note);

            if (newZForOldMain >= Z_INDEX.THRESHOLD) {
                normalizeZIndices();
            }

        } else { // Selected from sidebar
             if (selectedNote) {
                const newBackgroundNotes = [...backgroundNotes, selectedNote];
                setBackgroundNotes(newBackgroundNotes);
            }
            setSelectedNote(note);
            setBackgroundNotes(backgroundNotes.filter(n => n.id !== note.id));
        }
    };

    const handleDragStart = () => {
        isDragging.current = true;
    };

    const handleDragEnd = (note: Note, point: { x: number; y: number }) => {
        setNotePositions(prev => {
            const currentHighestZ = Math.max(0, ...Object.values(prev).map(p => p.zIndex || 0).filter(z => z < Z_INDEX.MAIN));
            return {
                ...prev,
                [note.id]: {
                    ...prev[note.id],
                    x: point.x,
                    y: point.y,
                    zIndex: currentHighestZ + 1
                }
            }
        });

        // Use timeout to prevent click event from firing after drag
        setTimeout(() => {
            isDragging.current = false;
        }, 100);
        normalizeZIndices();
    };

    return {
        isDragging: isDragging.current,
        handleNoteSelect,
        handleDragStart,
        handleDragEnd
    };
};

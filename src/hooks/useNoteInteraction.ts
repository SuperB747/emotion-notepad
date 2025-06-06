import { useCallback, useState } from 'react';
import type { Note, NotePosition } from '../types/noteTypes';
import { Z_INDEX } from '../constants/noteConstants';

export const useNoteInteraction = (
    notes: Note[],
    selectedNote: Note | null,
    setSelectedNote: (note: Note | null) => void,
    notePositions: Record<string, NotePosition>,
    setNotePositions: React.Dispatch<React.SetStateAction<Record<string, NotePosition>>>,
    updateNoteInFirestore: (noteId: string, updates: Partial<Note>) => Promise<void>
) => {
    const [isDragging, setIsDragging] = useState(false);

    const normalizeZIndices = useCallback(() => {
        if (isDragging) return;

        setNotePositions(prev => {
            const newPositions = { ...prev };
            const backgroundNotes = Object.keys(newPositions)
                .filter(id => newPositions[id].zIndex < Z_INDEX.MAIN)
                .sort((a, b) => newPositions[a].zIndex - newPositions[b].zIndex);

            backgroundNotes.forEach((id, index) => {
                newPositions[id].zIndex = Z_INDEX.BACKGROUND + index;
            });
            
            return newPositions;
        });
    }, [isDragging, setNotePositions]);

    const handleNoteSelect = useCallback((noteToSelect: Note) => {
        if (noteToSelect.id === selectedNote?.id) return;

        setNotePositions(prev => {
            const newPositions = { ...prev };
            const currentSelectedId = selectedNote?.id;

            if (!currentSelectedId || !newPositions[currentSelectedId] || !newPositions[noteToSelect.id]) {
                return prev;
            }

            const oldMainPos = newPositions[currentSelectedId];
            const newBgPos = newPositions[noteToSelect.id];

            // 1. 위치와 회전값을 교환합니다.
            newPositions[currentSelectedId] = {
                ...oldMainPos,
                x: newBgPos.x,
                y: newBgPos.y,
                rotate: newBgPos.rotate,
                zIndex: 0, // z-index는 아래에서 정규화됩니다.
            };

            newPositions[noteToSelect.id] = {
                ...newBgPos,
                x: oldMainPos.x,
                y: oldMainPos.y,
                rotate: oldMainPos.rotate,
                zIndex: Z_INDEX.MAIN,
            };

            // 2. 단일 업데이트 내에서 모든 배경 노트의 z-index를 정규화합니다.
            const backgroundNotes = Object.keys(newPositions)
                .filter(id => id !== noteToSelect.id) 
                .sort((a, b) => (prev[a]?.zIndex || 0) - (prev[b]?.zIndex || 0));

            backgroundNotes.forEach((id, index) => {
                newPositions[id].zIndex = Z_INDEX.BACKGROUND + index;
            });
            
            return newPositions;
        });

        setSelectedNote(noteToSelect);
    }, [selectedNote, setSelectedNote, setNotePositions]);

    const handleDragStart = useCallback(() => {
        setIsDragging(true);
    }, []);

    const handleDragEnd = useCallback(() => {
        setIsDragging(false);
        normalizeZIndices();
    }, [normalizeZIndices]);

    const handleNoteDrag = useCallback((id: string, offset: { x: number; y: number }) => {
        setNotePositions(prev => {
            const currentPos = prev[id];
            if (!currentPos) return prev;

            const newX = currentPos.x + offset.x;
            const newY = currentPos.y + offset.y;

            const maxZ = Math.max(
                Z_INDEX.BACKGROUND,
                ...Object.entries(prev)
                    .filter(([noteId]) => noteId !== id)
                    .map(([, pos]) => pos.zIndex)
                    .filter(z => z < Z_INDEX.MAIN)
            );
            const newZIndex = maxZ + 1;
            
            updateNoteInFirestore(id, { x: newX, y: newY, zIndex: newZIndex });

            return {
                ...prev,
                [id]: {
                    ...currentPos,
                    x: newX,
                    y: newY,
                    zIndex: newZIndex,
                }
            };
        });
    }, [setNotePositions, updateNoteInFirestore]);


    const handleNoteUpdate = useCallback(async (id: string, content: string) => {
        try {
            await updateNoteInFirestore(id, { content });
        } catch (error) {
            console.error('Error updating note:', error);
        }
    }, [updateNoteInFirestore]);

    return {
        isDragging,
        handleNoteSelect,
        handleDragStart,
        handleDragEnd,
        handleNoteDrag,
        handleNoteUpdate,
    };
};

import { useCallback, useState, useRef, useEffect } from 'react';
import type { Note, NotePosition } from '../types/noteTypes';
import { Z_INDEX } from '../constants/noteConstants';

const isOverlapping = (pos1: NotePosition, pos2: NotePosition, noteWidth: number, noteHeight: number) => {
    const threshold = 0.5; // 50% 이상 겹칠 때만 충돌로 간주
    const overlapX = Math.abs(pos1.x - pos2.x) < noteWidth * threshold;
    const overlapY = Math.abs(pos1.y - pos2.y) < noteHeight * threshold;
    return overlapX && overlapY;
};

export const useNoteInteraction = (
    notes: Note[],
    selectedNote: Note | null,
    setSelectedNote: (note: Note | null) => void,
    notePositions: Record<string, NotePosition>,
    setNotePositions: React.Dispatch<React.SetStateAction<Record<string, NotePosition>>>,
    updateNoteInFirestore: (noteId: string, updates: Partial<Note>) => Promise<void>
) => {
    const [isDragging, setIsDragging] = useState(false);
    const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);
    const lastZIndices = useRef<Record<string, number>>({});
    const previousSelectedNoteId = useRef<string | null>(null);

    const normalizeZIndices = useCallback(() => {
        if (isDragging) return;

        setNotePositions(prev => {
            const newPositions = { ...prev };
            const backgroundNotes = Object.keys(newPositions)
                .filter(id => newPositions[id].zIndex < Z_INDEX.MAIN)
                .sort((a, b) => {
                    // 드래그된 노트의 z-index는 유지
                    if (draggedNoteId === a) return 1;
                    if (draggedNoteId === b) return -1;
                    // 이전 z-index 순서 유지
                    const prevOrderA = lastZIndices.current[a] || newPositions[a].zIndex;
                    const prevOrderB = lastZIndices.current[b] || newPositions[b].zIndex;
                    return prevOrderA - prevOrderB;
                });

            // 현재 z-index 상태 저장
            backgroundNotes.forEach(id => {
                lastZIndices.current[id] = newPositions[id].zIndex;
            });

            // z-index 재할당
            backgroundNotes.forEach((id, index) => {
                newPositions[id].zIndex = Z_INDEX.BACKGROUND + index;
            });
            
            return newPositions;
        });
    }, [isDragging, draggedNoteId]);

    // 선택된 노트가 변경될 때마다 이전 선택된 노트 ID 업데이트
    useEffect(() => {
        if (selectedNote) {
            previousSelectedNoteId.current = selectedNote.id;
        }
    }, [selectedNote]);

    const handleNoteSelect = useCallback((noteToSelect: Note) => {
        if (noteToSelect.id === selectedNote?.id) return;

        setNotePositions(prev => {
            const newPositions = { ...prev };
            
            // 이전 선택된 노트가 있다면 배경으로 이동
            if (previousSelectedNoteId.current && newPositions[previousSelectedNoteId.current]) {
                const maxBackgroundZ = Math.max(
                    Z_INDEX.BACKGROUND,
                    ...Object.values(prev)
                        .map(pos => pos.zIndex)
                        .filter(z => z < Z_INDEX.MAIN)
                );
                newPositions[previousSelectedNoteId.current].zIndex = maxBackgroundZ + 1;
            }

            // 새로 선택된 노트를 메인으로 설정
            if (newPositions[noteToSelect.id]) {
                newPositions[noteToSelect.id].zIndex = Z_INDEX.MAIN;
            }

            return newPositions;
        });

        setSelectedNote(noteToSelect);
    }, [selectedNote, setSelectedNote, setNotePositions]);

    const handleDragStart = useCallback((noteId: string) => {
        setIsDragging(true);
        setDraggedNoteId(noteId);
        // 드래그 시작 시 현재 z-index 상태 저장
        lastZIndices.current = Object.entries(notePositions).reduce((acc, [id, pos]) => {
            acc[id] = pos.zIndex;
            return acc;
        }, {} as Record<string, number>);
    }, [notePositions]);

    const handleDragEnd = useCallback(() => {
        setIsDragging(false);
        setDraggedNoteId(null);
        normalizeZIndices();
    }, [normalizeZIndices]);

    const handleNoteDrag = useCallback((id: string, offset: { x: number; y: number }) => {
        setNotePositions(prev => {
            const currentPos = prev[id];
            if (!currentPos) return prev;

            const newX = currentPos.x + offset.x;
            const newY = currentPos.y + offset.y;

            // 새로운 위치 계산
            const newPosition = {
                ...currentPos,
                x: newX,
                y: newY,
            };

            // 다른 노트들과의 충돌 검사
            const overlappingNoteId = Object.entries(prev)
                .find(([noteId, pos]) => {
                    if (noteId === id || pos.zIndex >= Z_INDEX.MAIN) return false;
                    return isOverlapping(newPosition, pos, 220, 180);
                })?.[0];

            // z-index 업데이트
            const maxZ = Math.max(
                Z_INDEX.BACKGROUND,
                ...Object.entries(prev)
                    .filter(([noteId]) => noteId !== id)
                    .map(([, pos]) => pos.zIndex)
                    .filter(z => z < Z_INDEX.MAIN)
            );

            const newZIndex = overlappingNoteId ? prev[overlappingNoteId].zIndex - 1 : maxZ + 1;
            
            // 현재 선택된 노트의 z-index는 변경하지 않음
            if (id === selectedNote?.id) {
                updateNoteInFirestore(id, { x: newX, y: newY });
                return {
                    ...prev,
                    [id]: {
                        ...newPosition,
                        zIndex: Z_INDEX.MAIN,
                    }
                };
            }

            updateNoteInFirestore(id, { x: newX, y: newY, zIndex: newZIndex });

            return {
                ...prev,
                [id]: {
                    ...newPosition,
                    zIndex: newZIndex,
                }
            };
        });
    }, [setNotePositions, updateNoteInFirestore, selectedNote]);

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
        handleDragStart: (noteId: string) => handleDragStart(noteId),
        handleDragEnd,
        handleNoteDrag,
        handleNoteUpdate,
    };
};

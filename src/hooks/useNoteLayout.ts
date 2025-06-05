import { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '../config/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import type { Note, FolderLayout, NotePosition } from '../types/noteTypes';
import { generateRandomPosition } from '../utils/noteUtils';
import { Z_INDEX, LAYOUT } from '../constants/noteConstants';

export const useNoteLayout = (
  user: any,
  notes: Note[],
  currentFolderId: string | null,
  folders: {id: string, name: string}[],
  containerSize: { width: number; height: number } | null,
) => {
  const [notePositions, setNotePositions] = useState<Record<string, NotePosition>>({});
  const [isOCDMode, setIsOCDMode] = useState(false);
  const [isLayoutSaving, setIsLayoutSaving] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const prevFolderIdRef = useRef<string | null>(null);

  const shuffleNotes = useCallback(() => {
    if (!containerSize) return;
    const newPositions: Record<string, NotePosition> = {};
    const backgroundNotes = notes.filter(n => notePositions[n.id]?.zIndex !== Z_INDEX.MAIN);
    
    backgroundNotes.forEach((note, index) => {
        const pos = generateRandomPosition(index, newPositions, note, backgroundNotes, containerSize);
        newPositions[note.id] = {
            ...pos,
            rotate: isOCDMode ? 0 : (Math.random() - 0.5) * 2 * LAYOUT.MAX_ROTATION,
            zIndex: index + 1
        };
    });

    setNotePositions(prev => {
        const updatedPositions = { ...prev };
        backgroundNotes.forEach(note => {
            if(newPositions[note.id]) {
                updatedPositions[note.id] = newPositions[note.id];
            }
        });
        return updatedPositions;
    });
  }, [notes, containerSize, isOCDMode]);

  useEffect(() => {
    const loadLayout = async () => {
      if (!user || !containerSize) return;
      const layoutId = currentFolderId || 'root';
  
      // Avoid reloading for the same folder
      if (prevFolderIdRef.current === currentFolderId) return;
      prevFolderIdRef.current = currentFolderId;

      try {
        const layoutRef = doc(db, `users/${user.uid}/layouts/${layoutId}`);
        const layoutDoc = await getDoc(layoutRef);
        if (layoutDoc.exists()) {
          const layoutData = layoutDoc.data() as FolderLayout;
          setNotePositions(layoutData.positions || {});
          setIsOCDMode(layoutData.isOCDMode || false);
        } else {
          // If no layout, shuffle notes
          shuffleNotes();
        }
      } catch (error) {
        console.error('Failed to load layout:', error);
        shuffleNotes(); // Also shuffle on error
      }
    };

    loadLayout();
  }, [user, currentFolderId, containerSize, shuffleNotes]);


  const saveFolderLayout = async () => {
    if (!user) return;
    setIsLayoutSaving(true);
    const layoutId = currentFolderId || 'root';
    const folderName = currentFolderId ? folders.find(f => f.id === currentFolderId)?.name || null : '전체 보기';
    
    const layoutData: FolderLayout = {
      id: layoutId,
      positions: notePositions,
      isOCDMode,
      folderName,
      updatedAt: serverTimestamp()
    };

    try {
      await setDoc(doc(db, `users/${user.uid}/layouts/${layoutId}`), layoutData);
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 2000);
    } catch (error)
    {
      console.error('Error saving layout:', error);
    } finally {
      setIsLayoutSaving(false);
    }
  };
  
  const normalizeZIndices = useCallback(() => {
    const backgroundNoteIds = Object.keys(notePositions).filter(
      id => notePositions[id] && notePositions[id].zIndex !== Z_INDEX.MAIN
    );
    if (backgroundNoteIds.length === 0) return;
    const zIndexes = backgroundNoteIds.map(id => notePositions[id].zIndex || 0);
    const maxZ = Math.max(0, ...zIndexes);
    if (maxZ >= Z_INDEX.THRESHOLD) {
      setNotePositions(prev => {
        const newPositions = { ...prev };
        backgroundNoteIds.forEach(id => {
          if (newPositions[id]) {
            const currentZ = newPositions[id].zIndex || Z_INDEX.BACKGROUND;
            newPositions[id].zIndex = Math.max(Z_INDEX.BACKGROUND, currentZ - Z_INDEX.REDUCTION); 
          }
        });
        return newPositions;
      });
    }
  }, [notePositions]);

  return {
    notePositions,
    isOCDMode,
    isLayoutSaving,
    showSaveSuccess,
    setNotePositions,
    setIsOCDMode,
    saveFolderLayout,
    shuffleNotes,
    normalizeZIndices,
  };
};

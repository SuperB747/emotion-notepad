import { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '../config/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import type { Note, FolderLayout, NotePosition } from '../types/noteTypes';
import { Z_INDEX } from '../constants/noteConstants';

export const useNoteLayout = (
  user: any,
  notes: Note[],
  currentFolderId: string | null,
  folders: {id: string, name: string}[],
  notePositions: Record<string, NotePosition>,
  setNotePositions: React.Dispatch<React.SetStateAction<Record<string, NotePosition>>>,
  isOCDMode: boolean,
  setIsOCDMode: React.Dispatch<React.SetStateAction<boolean>>,
  containerSize: { width: number, height: number } | null,
  selectedNote: Note | null,
  setSelectedNote: (note: Note | null) => void,
) => {
  const [isLayoutSaving, setIsLayoutSaving] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const prevFolderIdRef = useRef<string | null>(null);

  const shuffleNotes = useCallback(() => {
    if (!containerSize || notes.length === 0) return;

    const notesInCurrentFolder = notes.filter(n =>
      currentFolderId ? n.folderId === currentFolderId : (!n.folderId)
    );

    if (notesInCurrentFolder.length === 0) return;

    let mainNote = notesInCurrentFolder.find(n => n.id === selectedNote?.id);
    if (!mainNote) {
        mainNote = notesInCurrentFolder[0];
    }
    
    const allNewPositions: Record<string, NotePosition> = {};
    const backgroundNotes = notesInCurrentFolder.filter(note => note.id !== mainNote!.id);

    // 메인 노트 위치 설정
    allNewPositions[mainNote.id] = {
        x: 0,
        y: 0,
        rotate: isOCDMode ? 0 : (Math.random() - 0.5) * 10,
        zIndex: Z_INDEX.MAIN,
    };

    // 배경 노트 위치 및 정수 z-index 설정
    backgroundNotes.forEach((note, index) => {
        allNewPositions[note.id] = {
            x: (Math.random() - 0.5) * containerSize.width,
            y: (Math.random() - 0.5) * containerSize.height * 0.9,
            rotate: isOCDMode ? 0 : (Math.random() - 0.5) * 20,
            zIndex: Z_INDEX.BACKGROUND + index,
        };
    });

    setNotePositions(allNewPositions);
    setSelectedNote(mainNote);

  }, [containerSize, notes, currentFolderId, isOCDMode, setNotePositions, selectedNote, setSelectedNote]);

  useEffect(() => {
    const loadLayout = async () => {
      // notes가 아직 로드되지 않았으면 레이아웃 로딩을 시도하지 않음
      if (!user || notes.length === 0) return;
      
      const layoutId = currentFolderId || 'root';
  
      // 동일한 폴더의 레이아웃을 중복으로 로드하지 않도록 함
      if (prevFolderIdRef.current === layoutId) return;
      prevFolderIdRef.current = layoutId;

      try {
        const layoutRef = doc(db, `users/${user.uid}/layouts/${layoutId}`);
        const layoutDoc = await getDoc(layoutRef);

        if (layoutDoc.exists()) {
          const layoutData = layoutDoc.data() as FolderLayout;
          // Firestore에서 로드한 위치 데이터로 상태 업데이트
          if (layoutData.positions && Object.keys(layoutData.positions).length > 0) {
            setNotePositions(layoutData.positions);
          } else {
            shuffleNotes();
          }
          setIsOCDMode(layoutData.isOCDMode || false);
        } else {
          // 저장된 레이아웃이 없으면 노트를 섞음
          shuffleNotes();
        }
      } catch (error) {
        console.error('Failed to load layout:', error);
        shuffleNotes(); // 에러 발생 시에도 노트를 섞음
      }
    };

    loadLayout();
  }, [user, currentFolderId, notes, setNotePositions, shuffleNotes, setIsOCDMode]);


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

  return {
    isLayoutSaving,
    showSaveSuccess,
    saveFolderLayout,
    shuffleNotes,
  };
};

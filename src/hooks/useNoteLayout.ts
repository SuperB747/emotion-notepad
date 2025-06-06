import { useState, useEffect, useCallback } from 'react';
import { db } from '../config/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import type { Note, FolderLayout } from '../types/noteTypes';

export const useNoteLayout = (
  user: any,
  notes: Note[],
  currentFolderId: string | null,
  folders: { id: string; name: string }[],
) => {
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isOCDMode, setIsOCDMode] = useState(false);
  const [isLayoutSaving, setIsLayoutSaving] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  // 폴더의 레이아웃 설정을 로드
  useEffect(() => {
    const loadLayout = async () => {
      if (!user || !currentFolderId) return;

      try {
        const layoutRef = doc(db, `users/${user.uid}/layouts/${currentFolderId}`);
        const layoutDoc = await getDoc(layoutRef);

        if (layoutDoc.exists()) {
          const layoutData = layoutDoc.data() as FolderLayout;
          setIsOCDMode(layoutData.isOCDMode || false);
        }
      } catch (error) {
        console.error('Failed to load layout:', error);
      }
    };

    loadLayout();
  }, [user, currentFolderId]);

  // 노트 섞기
  const shuffleNotes = useCallback(() => {
    // 새로운 레이아웃을 구현할 때 이 부분을 수정하면 됩니다
    console.log('Shuffle notes');
  }, []);

  // 레이아웃 저장
  const saveLayout = async () => {
    if (!user || !currentFolderId) return;
    
    setIsLayoutSaving(true);
    const folderName = folders.find(f => f.id === currentFolderId)?.name || null;
    
    const layoutData: FolderLayout = {
      id: currentFolderId,
      isOCDMode,
      folderName,
      updatedAt: serverTimestamp(),
      positions: {} // 새로운 레이아웃 구현 시 이 부분을 수정하면 됩니다
    };

    try {
      await setDoc(doc(db, `users/${user.uid}/layouts/${currentFolderId}`), layoutData);
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 2000);
    } catch (error) {
      console.error('Error saving layout:', error);
    } finally {
      setIsLayoutSaving(false);
    }
  };

  return {
    selectedNote,
    setSelectedNote,
    isOCDMode,
    setIsOCDMode,
    isLayoutSaving,
    showSaveSuccess,
    shuffleNotes,
    saveLayout,
  };
};

import { useState, useEffect, useCallback } from 'react';
import { db, auth } from '../config/firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  addDoc,
  writeBatch,
  serverTimestamp,
  setDoc,
  getDoc,
  where,
  getDocs,
} from 'firebase/firestore';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import type { Note, Folder, NotePosition, FolderLayout } from '../types/noteTypes';

export const useNoteData = () => {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [backgroundNotes, setBackgroundNotes] = useState<Note[]>([]);
  const navigate = useNavigate();

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (!user) {
        setNotes([]);
        setFolders([]);
        setSelectedNote(null);
        setBackgroundNotes([]);
        setCurrentFolderId(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch folders
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, `users/${user.uid}/folders`), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const foldersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Folder[];
      setFolders(foldersData);
    });
    return () => unsubscribe();
  }, [user]);

  // Fetch notes
  useEffect(() => {
    if (!user) {
        setNotes([]);
        return;
    };
    const notesQuery = query(collection(db, `users/${user.uid}/notes`), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(notesQuery, (snapshot) => {
        const notesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note));
        setNotes(notesList);

        // 최초 로딩 시에만 선택된 노트 설정 (페이지가 처음 로드될 때만)
        if (!selectedNote && notesList.length > 0 && !document.hidden && !localStorage.getItem('hasInitialLoad')) {
          const firstNoteInFolder = notesList.find(n => currentFolderId ? n.folderId === currentFolderId : !n.folderId);
          setSelectedNote(firstNoteInFolder || notesList[0]);
          localStorage.setItem('hasInitialLoad', 'true');
        }
    });
    return () => unsubscribe();
  }, [user]);

  // Logic to determine background notes based on the selected one
  useEffect(() => {
    const filteredNotes = notes.filter(note => {
        if (currentFolderId === 'all') return true;
        return currentFolderId ? note.folderId === currentFolderId : !note.folderId;
    });

    if (selectedNote) {
      // 선택된 노트가 현재 폴더에 속하지 않으면 선택 해제
      const isSelectedNoteInCurrentFolder = currentFolderId === 'all' || 
        (currentFolderId ? selectedNote.folderId === currentFolderId : !selectedNote.folderId);
      
      if (!isSelectedNoteInCurrentFolder) {
        setSelectedNote(null);
        setBackgroundNotes(filteredNotes);
      } else {
        setBackgroundNotes(filteredNotes.filter(n => n.id !== selectedNote.id));
      }
    } else {
      setBackgroundNotes(filteredNotes);
    }
   }, [notes, currentFolderId, selectedNote]);

  // 페이지 언로드 시 localStorage 초기화
  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.removeItem('hasInitialLoad');
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
  

  const handleLogout = () => {
    signOut(auth);
    navigate('/login');
  };

  const handleCreateFolder = async (folderName: string) => {
    if (!user) return;
    await addDoc(collection(db, `users/${user.uid}/folders`), {
      name: folderName,
      createdAt: serverTimestamp(),
    });
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!user) return;
    const batch = writeBatch(db);
    const notesInFolderQuery = query(collection(db, `users/${user.uid}/notes`), where('folderId', '==', folderId));
    const notesSnapshot = await getDocs(notesInFolderQuery);
    notesSnapshot.forEach(doc => batch.delete(doc.ref));
    batch.delete(doc(db, `users/${user.uid}/folders/${folderId}`));
    await batch.commit();
    if (currentFolderId === folderId) {
      setCurrentFolderId(null);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!user) return;
    await deleteDoc(doc(db, `users/${user.uid}/notes/${noteId}`));
  };

  const handleNoteUpdate = async (noteId: string, data: Partial<Omit<Note, 'id'>>) => {
    if (!user) return;
    await updateDoc(doc(db, `users/${user.uid}/notes/${noteId}`), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  };

  const formatDate = useCallback((date: any) => {
    if (!date?.toDate) return '';
    return new Date(date.toDate()).toLocaleDateString('ko-KR', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }, []);

  return {
    user,
    notes,
    folders,
    currentFolderId,
    selectedNote,
    backgroundNotes,
    setCurrentFolderId,
    setSelectedNote,
    setBackgroundNotes,
    handleLogout,
    handleCreateFolder,
    handleDeleteFolder,
    handleDeleteNote,
    handleNoteUpdate,
    formatDate,
  };
};

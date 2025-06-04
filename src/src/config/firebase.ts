import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { 
  getFirestore, 
  connectFirestoreEmulator, 
  enableMultiTabIndexedDbPersistence 
} from 'firebase/firestore';

const firebaseConfig = {
  // Firebase 설정을 여기에 넣으세요
  apiKey: "AIzaSyDHUz_6AtW3i5puJEWDn930gLbyCFji0uU",
  authDomain: "emotion-notepad-1b731.firebaseapp.com",
  projectId: "emotion-notepad-1b731",
  storageBucket: "emotion-notepad-1b731.appStorage.googleapis.com",
  messagingSenderId: "547128078413",
  appId: "1:547128078413:web:17e63a05a423dc602fec04"
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Enable multi-tab persistence
enableMultiTabIndexedDbPersistence(db)
  .then(() => {
    console.log('Multi-tab persistence enabled successfully');
  })
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Multi-tab persistence failed: Multiple tabs might be open');
    } else if (err.code === 'unimplemented') {
      console.warn('Multi-tab persistence is not supported in this browser');
    }
  });

export const auth = getAuth(app);

// 개발 환경에서만 에뮬레이터 사용
if (import.meta.env.DEV) {
  try {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    console.log('Firebase Emulators connected successfully');
  } catch (error) {
    console.warn('Failed to connect to Firebase Emulators:', error);
    console.warn('Make sure to run: firebase emulators:start');
  }
} 
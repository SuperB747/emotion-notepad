import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC8UNQlECkyPSRnEYp5SK7suFVEmzksqzY",
  authDomain: "emotion-notepad-b9bcb.firebaseapp.com",
  projectId: "emotion-notepad-b9bcb",
  storageBucket: "emotion-notepad-b9bcb.firebasestorage.app",
  messagingSenderId: "817361000108",
  appId: "1:817361000108:web:718c7375c7d5411290f109"
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore with persistent cache and multi-tab support
export const db = initializeFirestore(app, {
  cache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

export const auth = getAuth(app); 
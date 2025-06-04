import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  CACHE_SIZE_UNLIMITED
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC8UNQlECkyPSRnEYp5SK7suFVEmzksqzY",
  authDomain: "emotion-notepad-b9bcb.firebaseapp.com",
  projectId: "emotion-notepad-b9bcb",
  storageBucket: "emotion-notepad-b9bcb.firebasestorage.app",
  messagingSenderId: "817361000108",
  appId: "1:817361000108:web:718c7375c7d5411290f109",
  cacheSizeBytes: CACHE_SIZE_UNLIMITED
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with optimized settings
const firestoreSettings = {
  experimentalAutoDetectLongPolling: true,
  useFetchStreams: false,
  cache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
    cacheSizeBytes: CACHE_SIZE_UNLIMITED
  })
};

// Initialize Firestore with settings
export const db = initializeFirestore(app, firestoreSettings);

// Initialize Auth
export const auth = getAuth(app); 
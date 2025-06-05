import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, inMemoryPersistence, setPersistence } from 'firebase/auth';
import { 
  getFirestore, 
  connectFirestoreEmulator, 
  CACHE_SIZE_UNLIMITED,
  persistentLocalCache,
  persistentMultipleTabManager 
} from 'firebase/firestore';

// Emulator 설정을 위한 최소한의 Firebase 설정
const firebaseConfig = {
  projectId: "emotion-notepad-demo",
  apiKey: "demo-key",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with optimized settings for emulator
const firestoreSettings = {
  experimentalAutoDetectLongPolling: true,
  useFetchStreams: false,
  cache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
    cacheSizeBytes: CACHE_SIZE_UNLIMITED
  })
};

// Initialize Firestore and Auth
const db = getFirestore(app);
const auth = getAuth(app);

// Emulator 연결 설정
  console.log('Connecting to emulators...');
  connectFirestoreEmulator(db, 'localhost', 9090);
  connectAuthEmulator(auth, 'http://localhost:9095', { disableWarnings: true });
  setPersistence(auth, inMemoryPersistence);
  console.log('Connected to emulators');

export { auth, db }; 
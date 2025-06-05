import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

// 에뮬레이터 모드를 위한 최소 설정
const firebaseConfig = {
  apiKey: "dummy-api-key",
  projectId: "emotion-notepad-b9bcb",
  authDomain: "emotion-notepad-b9bcb.firebaseapp.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 항상 에뮬레이터에 연결
console.log('Connecting to emulators...');
connectFirestoreEmulator(db, '127.0.0.1', 8080);
connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
console.log('Connected to emulators');

export { db, auth }; 
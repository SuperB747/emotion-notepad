import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  enableMultiTabIndexedDbPersistence 
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
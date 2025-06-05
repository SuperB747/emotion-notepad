import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, collection, addDoc, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "dummy-api-key",
  projectId: "emotion-notepad-b9bcb",
  authDomain: "emotion-notepad-b9bcb.firebaseapp.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Connect to emulators
connectFirestoreEmulator(db, '127.0.0.1', 8080);
connectAuthEmulator(auth, 'http://127.0.0.1:9099');

async function seedData() {
  try {
    // Create a test user
    const userCredential = await createUserWithEmailAndPassword(auth, 'test@example.com', 'password123');
    const user = userCredential.user;
    console.log('Created test user:', user.uid);

    // Create some test notes
    const notesCollectionRef = collection(db, `users/${user.uid}/notes`);
    
    await addDoc(notesCollectionRef, {
      title: '환영합니다!',
      content: '감성 메모장에 오신 것을 환영합니다. 이곳에서 당신의 생각과 감정을 자유롭게 기록해보세요.',
      createdAt: new Date(),
      userId: user.uid
    });

    await addDoc(notesCollectionRef, {
      title: '오늘의 감정',
      content: '오늘은 특별히 기분이 좋은 날이에요. 이런 날의 기분을 기록해두면 나중에 읽을 때 미소 짓게 될 것 같아요.',
      createdAt: new Date(),
      userId: user.uid
    });

    console.log('Created test notes');
    
  } catch (error) {
    console.error('Error seeding data:', error);
  }
}

// Run the seeding
seedData().then(() => {
  console.log('Seeding completed');
  process.exit(0);
}); 
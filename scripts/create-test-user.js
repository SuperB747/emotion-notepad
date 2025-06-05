import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const USER_ID = '5Xorlp4452f3xIbCE62zkOPLlCE2';

// 에뮬레이터 설정을 먼저 해야 함
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9095';
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:9090';

// Firebase Admin SDK 초기화
const serviceAccount = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../serviceAccountKey.json'), 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // 에뮬레이터 사용을 위한 추가 설정
  projectId: 'emotion-notepad-b9bcb'
});

async function createTestUser() {
  try {
    // 기존 사용자가 있다면 삭제
    try {
      await admin.auth().deleteUser(USER_ID);
      console.log('Deleted existing user:', USER_ID);
    } catch (error) {
      if (error.code !== 'auth/user-not-found') {
        console.error('Error deleting user:', error);
      }
    }

    // Create user in Auth emulator
    const userRecord = await admin.auth().createUser({
      uid: USER_ID,
      email: 'test@example.com',
      password: 'password123',
      emailVerified: true,
      displayName: 'Test User'
    });

    console.log('Successfully created test user:', userRecord.uid);
    
    // Firestore에 사용자 문서 생성
    const db = admin.firestore();
    await db.collection('users').doc(USER_ID).set({
      email: 'test@example.com',
      displayName: 'Test User',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('Created user document in Firestore');

  } catch (error) {
    console.error('Error:', error);
    console.error('Error details:', error.message);
  } finally {
    process.exit();
  }
}

createTestUser(); 
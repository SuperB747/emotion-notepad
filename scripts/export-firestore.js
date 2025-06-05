import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const USER_ID = '5Xorlp4452f3xIbCE62zkOPLlCE2';

// Firebase Admin SDK 초기화
const serviceAccount = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../serviceAccountKey.json'), 'utf8')
);

// 에뮬레이터 설정
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:9090';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function exportUserData() {
  try {
    // Get user's notes
    const notesSnapshot = await db.collection('users').doc(USER_ID).collection('notes').get();
    const notes = [];
    
    notesSnapshot.forEach(doc => {
      notes.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // 단순화된 데이터 구조
    const exportData = {
      "firestore_export": {
        "database": {
          "name": "projects/emotion-notepad-b9bcb/databases/(default)"
        },
        "document_data": {}
      }
    };

    // Add user document
    exportData.firestore_export.document_data[`users/${USER_ID}`] = {
      fields: {
        email: { stringValue: "test@example.com" },
        displayName: { stringValue: "Test User" }
      }
    };

    // Add notes
    notes.forEach(note => {
      exportData.firestore_export.document_data[`users/${USER_ID}/notes/${note.id}`] = {
        fields: {
          title: { stringValue: note.title },
          content: { stringValue: note.content },
          color: { stringValue: note.color },
          userId: { stringValue: note.userId || USER_ID },
          position: {
            mapValue: {
              fields: {
                x: { doubleValue: note.position.x },
                y: { doubleValue: note.position.y },
                rotate: { doubleValue: note.position.rotate },
                zIndex: { integerValue: note.position.zIndex || 0 }
              }
            }
          },
          createdAt: {
            timestampValue: new Date(note.createdAt._seconds * 1000).toISOString()
          }
        }
      };
    });

    // 데이터를 JSON 파일로 저장
    const exportPath = path.join(__dirname, '../firestore-export/firestore_export/all_namespaces/all_kinds/all_namespaces_all_kinds.export_metadata');
    
    // 디렉토리 생성
    fs.mkdirSync(path.join(__dirname, '../firestore-export/firestore_export/all_namespaces/all_kinds'), { recursive: true });
    
    // 데이터 저장
    fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
    console.log(`Data exported to ${exportPath}`);

  } catch (error) {
    console.error('Export failed:', error);
    console.error('Error details:', error.message);
  } finally {
    process.exit();
  }
}

exportUserData(); 
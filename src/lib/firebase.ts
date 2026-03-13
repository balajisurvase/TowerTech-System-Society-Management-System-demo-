import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, getDocFromServer, doc } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

console.log("Initializing Firebase with Project ID:", firebaseConfig.projectId);
console.log("Using Firestore Database ID:", firebaseConfig.firestoreDatabaseId);

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const storage = getStorage(app);

// Connection test
async function testConnection() {
  try {
    console.log("Testing Firestore connection...");
    await getDocFromServer(doc(db, '_connection_test_', 'ping'));
    console.log("Firestore connection successful.");
  } catch (error: any) {
    if (error.code === 'permission-denied') {
      console.log("Firestore reachable (Permission Denied - this is expected if not logged in).");
    } else if (error.message && error.message.includes('offline')) {
      console.error("The Cloud Firestore backend is unreachable. Check network/config.");
    } else {
      console.error("Firestore connection test error:", error);
    }
  }
}

testConnection();

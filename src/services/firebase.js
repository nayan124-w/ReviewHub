import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.AIzaSyClXLcrYbi3Ra3ZI5rr5Zv7bNK3pq5O1Ho,
  authDomain: import.meta.env.website-27637.firebaseapp.com,
  projectId: import.meta.env.website-27637,
  storageBucket: import.meta.env.website-27637.firebasestorage.app,
  messagingSenderId: import.meta.env.278857827471,
  appId: import.meta.env.1:278857827471:web:222322a595378da03d5cfa,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;

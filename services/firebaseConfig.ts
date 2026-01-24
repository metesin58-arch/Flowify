
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDS0Hr4x2FRA-_bDkYJyB12zxf27e32ChQ",
  authDomain: "rhymelife00.firebaseapp.com",
  databaseURL: "https://rhymelife00-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: "rhymelife00",
  storageBucket: "rhymelife00.firebasestorage.app",
  messagingSenderId: "36128275638",
  appId: "1:36128275638:web:faef5af5a0e4b3b44cfa17"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app); // En basit hali

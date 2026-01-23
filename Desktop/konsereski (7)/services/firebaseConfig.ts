
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

// TODO: BURAYA KENDİ FIREBASE BİLGİLERİNİ GİR
const firebaseConfig = {
  apiKey: "AIzaSyBLueVgUVS1mcclrU4ujnjqtC1eHsfoApQ",
  authDomain: "rhymelife00.firebaseapp.com",
  databaseURL: "https://rhymelife00-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: "rhymelife00",
  storageBucket: "rhymelife00.firebasestorage.app",
  messagingSenderId: "36128275638",
  appId: "1:36128275638:web:faef5af5a0e4b3b44cfa17"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);

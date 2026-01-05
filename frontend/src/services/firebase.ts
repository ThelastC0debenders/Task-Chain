// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC-ieDrm6MTE5lpko7RcxF9XVmiAnN6_90",
  authDomain: "taskchain-cit.firebaseapp.com",
  projectId: "taskchain-cit",
  storageBucket: "taskchain-cit.firebasestorage.app",
  messagingSenderId: "826305909238",
  appId: "1:826305909238:web:614915730a52f850db37d7",
  measurementId: "G-5SNEWVT2X4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app)
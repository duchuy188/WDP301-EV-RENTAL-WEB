// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";


const firebaseConfig = {
  apiKey: "AIzaSyDYCU6nY4U3nr0Botyd31aX85NmWYZAzU8",
  authDomain: "ev-renter.firebaseapp.com",
  projectId: "ev-renter",
  storageBucket: "ev-renter.firebasestorage.app",
  messagingSenderId: "1001290868749",
  appId: "1:1001290868749:web:c5a896fba62893f5c60d44",
  measurementId: "G-LTRJDT957X"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);


export { app };
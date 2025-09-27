// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const analytics = getAnalytics(app);

export { app };
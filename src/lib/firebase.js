// Import the functions you need from the SDKs you need
// import { initializeApp } from "firebase/app";
// import { getAuth } from "firebase/auth";
// import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// const firebaseConfig = {
//   apiKey: "AIzaSyAbbKbnbJrficxYnghFexQV3VyHojoDNTM",
//   authDomain: "holstein-3b411.firebaseapp.com",
//   projectId: "holstein-3b411",
//   storageBucket: "holstein-3b411.firebasestorage.app",
//   messagingSenderId: "268956873883",
//   appId: "1:268956873883:web:b8fe304610eb9ed6ca023e",
//   measurementId: "G-KCDPV0NNQM"
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);
// export const auth = getAuth(app);
// export default app;
// export const db = getFirestore(app);


// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA0DK-BebeoyP_ftUJE1iuO4GnxfYafTIM",
  authDomain: "holstein-e6876.firebaseapp.com",
  projectId: "holstein-e6876",
  storageBucket: "holstein-e6876.firebasestorage.app",
  messagingSenderId: "840058803687",
  appId: "1:840058803687:web:d6e33b8076dcdcbceb5942",
  measurementId: "G-DST4ENWB31"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;

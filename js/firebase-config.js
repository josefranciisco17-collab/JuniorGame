import { initializeApp } from
  "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";

import { getAuth } from
  "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import { getFirestore } from
  "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBhzBbr_1veqxOzZ72xnKYl3ojvcUm-wUE",
  authDomain: "juniorgame-production.firebaseapp.com",
  projectId: "juniorgame-production",
  storageBucket:
    "juniorgame-production.firebasestorage.app",
  messagingSenderId: "1038375558020",
  appId:
    "1:1038375558020:web:8035bc253d08b05db1dbd1"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

export {
  app,
  auth,
  db
};

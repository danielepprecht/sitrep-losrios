// ==========================================================================
// config/firebase-config.js — Configuración de Firebase (Auth + Firestore)
// ==========================================================================
const firebaseConfig = {
  apiKey: "AIzaSyDvThtGpCfhTANiUEuBgqdHAQ-BjuDcBSQ",
  authDomain: "sitrep-4c3c0.firebaseapp.com",
  projectId: "sitrep-4c3c0",
  storageBucket: "sitrep-4c3c0.firebasestorage.app",
  messagingSenderId: "968370011734",
  appId: "1:968370011734:web:6f669b0607b781602c85f7"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
db.enablePersistence().catch(() => {});

// Correo del usuario administrador: ve el listado completo de usuarios registrados.
const ADMIN_EMAIL = 'danielepprecht@gmail.com';

// firebase.js
const firebaseConfig = {
  apiKey: "AIzaSyCzsuBkwoJP_uxWEkIk2EWCOfqA560ij3M",
  authDomain: "darkchat-man.firebaseapp.com",
  projectId: "MAN-Chat",
  storageBucket: "darkchat-man.firebasestorage.app",
  messagingSenderId: "118052023438",
  appId: "1:118052023438:web:32de622f6d2d82041aeddf"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();
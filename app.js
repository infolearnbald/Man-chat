// app.js (ATUALIZADO: validação team code + PWA friendly)
// Import libs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  sendPasswordResetEmail, signOut, onAuthStateChanged, updateProfile
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  getFirestore, doc, setDoc, getDoc, collection, addDoc,
  query, where, orderBy, onSnapshot, serverTimestamp, getDocs, limit
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  getStorage, ref, uploadBytes, getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

/* FIREBASE CONFIG (usa a tua config) */
const firebaseConfig = {
  apiKey: "AIzaSyAQDWD507uCjjbhFJUfSPJBGnZxAWDWcsY",
  authDomain: "man-chat-a09aa.firebaseapp.com",
  projectId: "man-chat-a09aa",
  storageBucket: "man-chat-a09aa.firebasestorage.app",
  messagingSenderId: "269622658988",
  appId: "1:269622658988:web:9307052f4733d7e04d1c09"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

/* ---------- HELPERS ---------- */
function safeGet(obj, key, fallback=''){ try{return obj?.[key] ?? fallback}catch(e){return fallback} }

/* ---------- AUTH ACTIONS ---------- */
const authActions = {
  // login
  login: async (email, password) => {
    if(!email || !password) return alert('Email e senha são obrigatórios.');
    try{ await signInWithEmailAndPassword(auth, email, password); }
    catch(e){ alert('Erro: ' + e.message); throw e; }
  },

  // signup com validação de team code
  signup: async (displayName, email, password, teamCode) => {
    if(!displayName || !email || !password || !teamCode) throw new Error('Todos os campos, incluindo o código da equipa, são obrigatórios.');

    // verificar teamCode na colecção teams (campo code)
    const teamsRef = collection(db, 'teams');
    const q = query(teamsRef, where('code', '==', teamCode), limit(1));
    const snaps = await getDocs(q);

    const teamIsValid = !snaps.empty;
    if(!teamIsValid) throw new Error('Código da equipa inválido.');

    // criar user
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    // atualizar displayName no auth
    await updateProfile(cred.user, { displayName });

    // criar documento do user com teamVerified = true
    await setDoc(doc(db, 'users', cred.user.uid), {
      uid: cred.user.uid,
      email: cred.user.email,
      displayName,
      photoURL: null,
      teamVerified: true,
      teamCode,
      createdAt: serverTimestamp()
    });

    return cred.user;
  },

  resetPassword: async (email) => {
    try{ await sendPasswordResetEmail(auth, email); alert('Email de recuperação enviado.'); }
    catch(e){ alert('Erro: ' + e.message); }
  },

  logout: async () => {
    await signOut(auth);
    location.href = 'login.html';
  },

  onAuthChange: (cb) => onAuthStateChanged(auth, cb),

  requireAuthRedirect: (loginPage = 'login.html') => {
    onAuthStateChanged(auth, user => {
      if (!user) location.href = loginPage;
    });
  },

  // redirect to profile if not teamVerified
  requireTeamVerifiedRedirect: async (redirectTo='profile.html', loginPage='login.html') => {
    onAuthStateChanged(auth, async (user) => {
      if(!user) { location.href = loginPage; return; }
      const snap = await getDoc(doc(db, 'users', user.uid));
      const data = snap.exists() ? snap.data() : null;
      if(!data || !data.teamVerified) location.href = redirectTo;
    });
  },

  currentUser: () => auth.currentUser || null
};

/* ---------- PROFILE ACTIONS ---------- */
const profileActions = {
  getProfile: async () => {
    const u = auth.currentUser;
    if(!u) return null;
    const snap = await getDoc(doc(db, 'users', u.uid));
    const data = snap.exists() ? snap.data() : { uid: u.uid, email: u.email, displayName: u.displayName, photoURL: u.photoURL || null, teamVerified: false };
    return data;
  },

  updateProfile: async ({ displayName, photoFile }) => {
    const u = auth.currentUser;
    if(!u) throw new Error('Usuário não autenticado.');
    let photoURL = null;

    if(photoFile){
      const ext = photoFile.name.split('.').pop();
      const storageRef = ref(storage, `profiles/${u.uid}.${ext}`);
      await uploadBytes(storageRef, photoFile);
      photoURL = await getDownloadURL(storageRef);
    }

    const upd = {};
    if(displayName) upd.displayName = displayName;
    if(photoURL) upd.photoURL = photoURL;
    if(Object.keys(upd).length) await updateProfile(u, upd); // atualiza auth

    const userDoc = {
      uid: u.uid,
      email: u.email,
      displayName: displayName || u.displayName || '',
      photoURL: photoURL || safeGet((await getDoc(doc(db,'users',u.uid))).data(), 'photoURL', null),
      updatedAt: serverTimestamp()
    };
    await setDoc(doc(db, 'users', u.uid), userDoc, { merge: true });

    return userDoc;
  },

  // verificar team code depois do sign-up (caso user precise)
  verifyTeamCode: async (code) => {
    const u = auth.currentUser;
    if(!u) throw new Error('Login necessário.');
    if(!code) throw new Error('Código inválido.');
    const teamsRef = collection(db, 'teams');
    const q = query(teamsRef, where('code', '==', code), limit(1));
    const snaps = await getDocs(q);
    if(snaps.empty) throw new Error('Código inválido.');
    await setDoc(doc(db, 'users', u.uid), { teamVerified: true, teamCode: code }, { merge: true });
    return true;
  }
};

/* ---------- CHAT ACTIONS ---------- */
const chatActions = {
  sendText: async (text) => {
    const u = auth.currentUser;
    if(!u) throw new Error('Login necessário');
    const userSnap = await getDoc(doc(db, 'users', u.uid));
    const userData = userSnap.exists() ? userSnap.data() : { displayName: u.displayName, email: u.email, photoURL: u.photoURL };
    if(!userData.teamVerified) throw new Error('Acesso ao chat negado: utilizador não verificado na equipa.');
    await addDoc(collection(db, 'messages'), {
      text,
      uid: u.uid,
      displayName: userData.displayName || u.email,
      email: u.email,
      photoURL: userData.photoURL || null,
      time: Date.now()
    });
  },

  sendFile: async (file) => {
    const u = auth.currentUser;
    if(!u) throw new Error('Login necessário');
    const userSnap = await getDoc(doc(db, 'users', u.uid));
    const userData = userSnap.exists() ? userSnap.data() : { displayName: u.displayName, email: u.email, photoURL: u.photoURL };
    if(!userData.teamVerified) throw new Error('Acesso ao chat negado: utilizador não verificado na equipa.');

    const ext = file.name.split('.').pop();
    const fileRef = ref(storage, `files/${u.uid}_${Date.now()}.${ext}`);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);

    await addDoc(collection(db, 'messages'), {
      file: url,
      fileName: file.name,
      uid: u.uid,
      displayName: userData.displayName || u.email,
      email: u.email,
      photoURL: userData.photoURL || null,
      time: Date.now()
    });
  },

  // onMessages: devolve array de mensagens em tempo real (ordenadas)
  onMessages: (cb) => {
    const q = query(collection(db, 'messages'), orderBy('time'));
    return onSnapshot(q, snap => {
      const msgs = [];
      snap.forEach(d => {
        const data = d.data();
        msgs.push({
          id: d.id,
          text: data.text || null,
          file: data.file || null,
          fileName: data.fileName || null,
          uid: data.uid,
          displayName: data.displayName,
          email: data.email,
          photoURL: data.photoURL,
          time: data.time || 0,
          isMe: auth.currentUser ? (data.uid === auth.currentUser.uid) : false
        });
      });
      cb(msgs);
    });
  }
};

/* ---------- EXPORTS ---------- */
export { authActions, profileActions, chatActions };

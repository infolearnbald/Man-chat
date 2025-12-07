// app.js
// Módulo central: inicializa Firebase e exporta ações reutilizáveis.
// Usa ES modules — carregar em <script type="module" src="app.js"></script> nas páginas.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  sendPasswordResetEmail, signOut, onAuthStateChanged, updateProfile
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  getFirestore, doc, setDoc, getDoc, collection, addDoc,
  query, orderBy, onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  getStorage, ref, uploadBytes, getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

/* ---------------------------
   CONFIGURAÇÃO DO FIREBASE
   (usa a tua config que enviaste)
---------------------------- */
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

/* ---------- UTILIDADES ---------- */
function safeGet(obj, key, fallback=''){ try{return obj?.[key] ?? fallback}catch(e){return fallback} }

/* ---------- AÇÕES DE AUTENTICAÇÃO ---------- */
const authActions = {
  login: async (email, password) => {
    if(!email || !password) return alert('Email e senha são obrigatórios.');
    try{ await signInWithEmailAndPassword(auth, email, password); }
    catch(e){ alert('Erro: ' + e.message); throw e; }
  },

  signup: async (displayName, email, password) => {
    if(!displayName || !email || !password) throw new Error('Campos inválidos');
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    // Atualiza displayName no Auth
    await updateProfile(cred.user, { displayName });
    // Cria documento do usuário em users/{uid}
    await setDoc(doc(db, 'users', cred.user.uid), {
      uid: cred.user.uid,
      email: cred.user.email,
      displayName,
      photoURL: null,
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

  // Redireciona para pagina de login se não houver user, ou para destino se houver
  requireAuthRedirect: (loginPage = 'login.html') => {
    onAuthStateChanged(auth, user => {
      if (!user) location.href = loginPage;
    });
  },

  // Obter utilizador atual (camada adicional)
  currentUser: () => auth.currentUser || null
};

/* ---------- AÇÕES DE PERFIL ---------- */
const profileActions = {
  getProfile: async () => {
    const u = auth.currentUser;
    if(!u) return null;
    const snap = await getDoc(doc(db, 'users', u.uid));
    const data = snap.exists() ? snap.data() : { uid: u.uid, email: u.email, displayName: u.displayName, photoURL: u.photoURL || null };
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

    // Atualiza auth profile
    const upd = {};
    if(displayName) upd.displayName = displayName;
    if(photoURL) upd.photoURL = photoURL;
    if(Object.keys(upd).length) await updateProfile(u, upd);

    // Atualiza Firestore users doc
    const userDoc = {
      uid: u.uid,
      email: u.email,
      displayName: displayName || u.displayName || '',
      photoURL: photoURL || safeGet((await getDoc(doc(db,'users',u.uid))).data(), 'photoURL', null),
      updatedAt: serverTimestamp()
    };
    await setDoc(doc(db, 'users', u.uid), userDoc, { merge: true });

    return userDoc;
  }
};

/* ---------- AÇÕES DE CHAT ---------- */
const chatActions = {
  // envia mensagem de texto
  sendText: async (text) => {
    const u = auth.currentUser;
    if(!u) throw new Error('Login necessário');
    const userDocSnap = await getDoc(doc(db, 'users', u.uid));
    const userData = userDocSnap.exists() ? userDocSnap.data() : { displayName: u.displayName, email: u.email, photoURL: u.photoURL };
    await addDoc(collection(db, 'messages'), {
      text,
      uid: u.uid,
      displayName: userData.displayName || u.email,
      email: u.email,
      photoURL: userData.photoURL || null,
      time: Date.now()
    });
  },

  // envia ficheiro (upload + mensagem com link)
  sendFile: async (file) => {
    const u = auth.currentUser;
    if(!u) throw new Error('Login necessário');
    const ext = file.name.split('.').pop();
    const fileRef = ref(storage, `files/${u.uid}_${Date.now()}.${ext}`);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);
    const userDocSnap = await getDoc(doc(db, 'users', u.uid));
    const userData = userDocSnap.exists() ? userDocSnap.data() : { displayName: u.displayName, email: u.email, photoURL: u.photoURL };
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

  // ouve mensagens em tempo real — callback recebe array de mensagens ordenadas
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

/* ---------- EXPORTS (úteis para as páginas) ---------- */
export { authActions, profileActions, chatActions };

/* ---------- exemplo de debug (opcional) ----------
onAuthStateChanged(auth, u => console.log('Auth state changed', u && u.email));
-------------------------------------------------- */

const ACCESS_CODE = "MAN001";

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import {
  getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, setDoc
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import {
  getStorage, ref as sref, uploadBytes, getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";

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

function msgStatus(text, err=false){
    const status = document.getElementById("status");
    if(!status) return;
    status.textContent = text;
    status.style.color = err?"#b00":"#0f0";
    if(text) setTimeout(()=> status.textContent="",4000);
}

// Registro
const regBtn = document.getElementById("btn-register");
if(regBtn){
    regBtn.onclick = async () => {
        const email = document.getElementById("reg-email").value;
        const pass = document.getElementById("reg-pass").value;
        const code = document.getElementById("reg-code").value;

        if(code !== ACCESS_CODE) return msgStatus("Código inválido",true);

        try{
            const user = await createUserWithEmailAndPassword(auth,email,pass);
            await setDoc(doc(db,"users",user.user.uid),{
                email: email,
                code: code,
                createdAt: serverTimestamp()
            });
            msgStatus("Conta criada!");
        }catch(e){ msgStatus(e.message,true);}
    }
}

// Login
const loginBtn = document.getElementById("btn-login");
if(loginBtn){
    loginBtn.onclick = async () => {
        const email = document.getElementById("login-email").value;
        const pass = document.getElementById("login-pass").value;
        const code = document.getElementById("login-code").value;

        if(code !== ACCESS_CODE) return msgStatus("Código inválido",true);

        try{ await signInWithEmailAndPassword(auth,email,pass);}
        catch(e){ msgStatus(e.message,true);}
    }
}

// Logout
const logoutBtn = document.getElementById("btn-logout");
if(logoutBtn) logoutBtn.onclick = ()=>signOut(auth);

// Monitor Auth
onAuthStateChanged(auth,user=>{
    if(user && window.location.pathname.includes("index.html") || window.location.pathname.includes("register.html")){
        window.location.href = "chat.html";
    }
});

// Chat
const sendBtn = document.getElementById("send-btn");
if(sendBtn){
    sendBtn.onclick = async ()=>{
        const input = document.getElementById("msg-input");
        if(!input.value) return;
        await addDoc(collection(db,"messages"),{
            type:"text",
            text: input.value,
            email: auth.currentUser.email,
            timestamp: serverTimestamp()
        });
        input.value="";
    }
}

// File Upload
const fileBtn = document.getElementById("btn-file");
const fileInput = document.getElementById("file-input");
if(fileBtn && fileInput){
    fileBtn.onclick = ()=> fileInput.click();
    fileInput.onchange = async (e)=>{
        const file = e.target.files[0];
        if(!file) return;
        const path = "uploads/"+Date.now()+"-"+file.name;
        const ref = sref(storage,path);
        await uploadBytes(ref,file);
        const url = await getDownloadURL(ref);
        await addDoc(collection(db,"messages"),{
            type:"file",
            fileName:file.name,
            fileUrl:url,
            email: auth.currentUser.email,
            timestamp: serverTimestamp()
        });
    }
}

// Listen messages
const messagesDiv = document.getElementById("messages");
if(messagesDiv){
    const q = query(collection(db,"messages"),orderBy("timestamp"));
    onSnapshot(q,snap=>{
        messagesDiv.innerHTML="";
        snap.forEach(doc=>{
            const m = doc.data();
            const div = document.createElement("div");
            div.className="message "+(m.email===auth.currentUser.email?"me":"other");
            if(m.type==="text") div.textContent = m.email+": "+m.text;
            else div.innerHTML = m.email+": <a href='"+m.fileUrl+"' target='_blank'>📎 "+m.fileName+"</a>";
            messagesDiv.appendChild(div);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        });
    });
}


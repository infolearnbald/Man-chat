import { auth, db, onAuthStateChanged } from "./firebase.js";
import {
    collection,
    addDoc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

import { signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

onAuthStateChanged(auth, user => {
    if (!user) window.location.href = "index.html";
});

const messagesDiv = document.getElementById("messages");
const msgInput = document.getElementById("msgInput");

// ENVIAR MENSAGEM
document.getElementById("sendBtn")?.addEventListener("click", async () => {
    const text = msgInput.value;
    if (!text) return;

    await addDoc(collection(db, "messages"), {
        user: auth.currentUser.displayName,
        message: text,
        timestamp: serverTimestamp()
    });

    msgInput.value = "";
});

// RECEBER MENSAGENS EM TEMPO REAL
const q = query(collection(db, "messages"), orderBy("timestamp"));
onSnapshot(q, snapshot => {
    messagesDiv.innerHTML = "";
    snapshot.forEach(doc => {
        const d = doc.data();
        const p = document.createElement("p");
        p.textContent = `${d.user}: ${d.message}`;
        messagesDiv.appendChild(p);
    });
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

// LOGOUT
document.getElementById("logoutBtn").addEventListener("click", () => {
    signOut(auth).then(() => window.location.href = "index.html");
});

import { auth, onAuthStateChanged } from "./firebase.js";
import { updateProfile } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

onAuthStateChanged(auth, user => {
    if (!user) window.location.href = "index.html";
    document.getElementById("displayName").value = user.displayName || "";
});

document.getElementById("updateProfileBtn").addEventListener("click", () => {
    const newName = document.getElementById("displayName").value;

    updateProfile(auth.currentUser, { displayName: newName })
        .then(() => document.getElementById("msg").innerText = "Perfil atualizado!")
        .catch(e => document.getElementById("msg").innerText = e.message);
});

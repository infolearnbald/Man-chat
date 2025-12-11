import { auth } from "./firebase.js";
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// LOGIN
document.getElementById("loginBtn")?.addEventListener("click", () => {
    const email = email.value;
    const password = password.value;

    signInWithEmailAndPassword(auth, email, password)
        .then(() => window.location.href = "chat.html")
        .catch(e => errorMsg.innerText = e.message);
});

// CADASTRO
document.getElementById("registerBtn")?.addEventListener("click", () => {
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    createUserWithEmailAndPassword(auth, email, password)
        .then(user => {
            updateProfile(auth.currentUser, { displayName: name });
        })
        .then(() => window.location.href = "chat.html")
        .catch(e => errorMsg.innerText = e.message);
});

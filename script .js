const codename = localStorage.getItem("codename");
if (!codename) window.location = "index.html";

function sendMessage() {
    let text = document.getElementById("msgInput").value.trim();
    if (text === "") return;

    db.collection("messages").add({
        sender: codename,
        text: text,
        time: firebase.firestore.FieldValue.serverTimestamp(),
        type: "text"
    });

    document.getElementById("msgInput").value = "";
}

function sendFile(files) {
    let file = files[0];
    if (!file) return;

    let ref = storage.ref("files/" + Date.now() + "_" + file.name);
    ref.put(file).then(() => {
        ref.getDownloadURL().then(url => {
            db.collection("messages").add({
                sender: codename,
                fileUrl: url,
                fileName: file.name,
                time: firebase.firestore.FieldValue.serverTimestamp(),
                type: "file"
            });
        });
    });
}

db.collection("messages").orderBy("time")
.onSnapshot(snapshot => {
    let box = document.getElementById("messagesBox");
    box.innerHTML = "";

    snapshot.forEach(doc => {
        let msg = doc.data();

        let div = document.createElement("div");
        div.className = "msg";

        if (msg.type === "text") {
            div.innerHTML = `<b>${msg.sender}:</b> ${msg.text}`;
        } else {
            div.innerHTML = `<b>${msg.sender}:</b> <a href="${msg.fileUrl}" download>${msg.fileName}</a>`;
        }

        box.appendChild(div);
    });

    box.scrollTop = box.scrollHeight;
});
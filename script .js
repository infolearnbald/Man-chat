const codename = localStorage.getItem('codename');
const team = localStorage.getItem('team');
const uid = localStorage.getItem('uid');

if(!codename || !team || !uid) window.location.href='index.html';
document.getElementById('userBadge').textContent = `@${codename}`;

function logout(){
    localStorage.clear();
    window.location.href='index.html';
}

function sendMessage(){
    const msg = document.getElementById('msgInput').value.trim();
    if(!msg) return;
    db.collection('teams').doc(team).collection('messages').add({
        senderName: codename,
        senderUid: uid,
        type:'text',
        text:msg,
        createdAt:firebase.firestore.FieldValue.serverTimestamp()
    });
    document.getElementById('msgInput').value='';
}

function sendFile(files){
    const file = files[0]; if(!file) return;
    const ref = storage.ref(`${team}/${Date.now()}_${file.name}`);
    ref.put(file).then(snapshot=>{
        snapshot.ref.getDownloadURL().then(url=>{
            db.collection('teams').doc(team).collection('messages').add({
                senderName: codename,
                senderUid: uid,
                type:'file',
                fileName:file.name,
                fileUrl:url,
                createdAt:firebase.firestore.FieldValue.serverTimestamp()
            });
        });
    });
}

db.collection('teams').doc(team).collection('messages').orderBy('createdAt')
.onSnapshot(snapshot=>{
    const box = document.getElementById('messagesBox');
    box.innerHTML='';
    snapshot.forEach(doc=>{
        const msg = doc.data();
        const div=document.createElement('div');
        div.className='msg';
        if(msg.type==='text'){
            div.innerHTML=`<b>${msg.senderName}:</b> ${msg.text}`;
        } else {
            div.innerHTML=`<b>${msg.senderName}:</b> <a href="${msg.fileUrl}" target="_blank">${msg.fileName}</a>`;
        }
        box.appendChild(div);
    });
    box.scrollTop=box.scrollHeight;
});
/* CHATBOT CODE*/

var step = "idle";
var firstName = "";
var lastName = "";
var email = "";
var currentUser = null;
var homeUser = null;

function toggleChat() {
    var box = document.getElementById("chat-box");
    if (!box) return;
    if (box.classList.contains("open")) {
        box.classList.remove("open");
    } else {
        box.classList.add("open");
        checkUserSession();
    }
}

function checkUserSession() {
    var token = localStorage.getItem("chat_token");
    if (!token) {
      step = "choose";
      botSay("👋 Welcome to TeamNotes");
      botSay("Type Register or Login");
      return;
    }
    fetch("/api/validate-token", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            token: token
        })
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            currentUser = result.user;
            botSay(
                "Welcome Back " +
                currentUser.first_name +
                " 👋"
            );
            botSay(
                "Enter a note to save."
            );
            step = "note";
        } else {
            localStorage.removeItem("chat_token");
            step = "choose";
            botSay("👋 Welcome to TeamNotes");
            botSay("Type Register or Login");
        }
    })
    .catch(error => {
        console.log(error);
        botSay("Unable to connect.");
    });
}


function registerUser() {
    fetch("/api/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            first_name: firstName,
            last_name: lastName,
            email: email
        })
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            currentUser = result.user;
            localStorage.setItem(
                "chat_token",
                result.token
            );
            botSay(
                "Welcome " +
                currentUser.first_name +
                "!"
            );
            botSay("Registration Successful 🎉");
            botSay("Enter your first note.");
            step = "note";
        } else {
            botSay(result.message);
        }
    })
    .catch(error => {
        console.log(error);
        botSay("Registration failed.");
    });
}

function saveChatMessage(note) {

    if (!currentUser) return;

    fetch("/api/chat-message", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({

            user_id: currentUser.id,
            message: note

        })

    })

    .then(response => response.json())
    .then(result => {

        console.log("Note Saved");

    })

    .catch(error => {

        console.log(error);

    });
}


function botSay(text) {

    var msgs = document.getElementById("msgs");
    if (!msgs) return;

    var d = document.createElement("div");
    d.className = "bot";
    d.innerText = text;

    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
}


function userSay(text) {

    var msgs = document.getElementById("msgs");
    if (!msgs) return;

    var d = document.createElement("div");
    d.className = "user";
    d.innerText = text;

    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
}


function sendMsg() {
    var input = document.getElementById("msg-input");

    if (!input) return;

    var text = input.value.trim();

    if (!text) return;

    userSay(text);
    input.value = "";

    if (step === "choose") {
        if (text.toLowerCase() === "register") {
            step = "ask_first";
            botSay("Enter First Name");
        } 
        else if (text.toLowerCase() === "login") {
            step = "login_email";
            botSay("Enter Email Address");
        } 
        else {
            botSay("Please type Register or Login");
        }

        return;
    }

    if (step === "ask_first") {
        firstName = text;
        step = "ask_last";

        botSay("Enter Last Name");

        return;
    }

    if (step === "ask_last") {
        lastName = text;
        step = "ask_email";
        botSay("Enter Email Address");
        return;
    }
    if (step === "ask_email") {
        email = text;
        var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            botSay("Please enter a valid Email");
            return;
        }
        registerUser();
        return;
    }
    if (step === "login_email") {
        fetch("/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: text
            })
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                currentUser = result.user;
                localStorage.setItem(
                    "chat_token",
                    result.user.token
                );
                botSay(
                    "Welcome Back " +
                    currentUser.first_name
                );
                botSay("Enter your note");
                step = "note";
            } 
            else {
                botSay(
                    "Email not found. Please Register."
                );
            }
        });
        return;
    }
    if (step === "note") {
        saveChatMessage(text);
        botSay("✅ Note Saved Successfully");
        botSay("Enter another note");
        return;
    }
}

/* NOTES PANEL CODE*/
function loginHome() {

    var email = document
        .getElementById("login-email")
        .value
        .trim();

    if (email === "") {
        alert("Please enter Email");
        return;
    }

    fetch("/api/login", {
        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            email: email
        })
    })

    .then(response => response.json())

    .then(result => {

        if(result.success){

            homeUser = result.user;

            localStorage.setItem(
                "chat_token",
                result.user.token
            );

            loadHomeUser();

        }

        else{

            alert("Email not found");

        }

    });

}
function registerHome() {

    var first = document
        .getElementById("reg-first")
        .value
        .trim();

    var last = document
        .getElementById("reg-last")
        .value
        .trim();

    var email = document
        .getElementById("reg-email")
        .value
        .trim();

    if(first=="" || last=="" || email==""){

        alert("Fill all fields");

        return;

    }

    fetch("/api/register",{

        method:"POST",

        headers:{
            "Content-Type":"application/json"
        },

        body:JSON.stringify({

            first_name:first,
            last_name:last,
            email:email

        })

    })

    .then(response=>response.json())

    .then(result=>{

        if(result.success){

            homeUser=result.user;

            localStorage.setItem(
                "chat_token",
                result.token
            );

            loadHomeUser();

        }

        else{

            alert(result.message);

        }

    });

}
function checkHomeLogin(){
    var token = localStorage.getItem("chat_token");
    if(!token){
        return;
    }
    fetch("/api/validate-token",{
        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },
        body:JSON.stringify({
            token:token
        })
    })
    .then(response=>response.json())
    .then(result=>{
      if(result.success){
        homeUser=result.user;
        loadHomeUser();
      }
      else{
        localStorage.removeItem("chat_token");
      }
    });
}

function loadHomeUser(){
    var guest = document.getElementById("guest-panel");
    var user = document.getElementById("user-panel");
    if(guest) guest.style.display="none";
    if(user) user.style.display="block";
    document.getElementById("welcome-user").innerHTML =
        "Welcome " + homeUser.first_name;
    loadUserNotes();
}

function logoutHome(){

    localStorage.removeItem("chat_token");

    location.reload();

}
function loadUserNotes(){
    if(!homeUser){
        return;
    }
    fetch("/api/user-notes/" + homeUser.id)
    .then(response=>response.json())
    .then(result=>{
        if(!result.success){
            return;
        }
        var html="";
        result.notes.forEach(function(note){
            html+=`
            <div class="note-item">
                <p>${note.message}</p>
                <button onclick="editNote(${note.id}, '${encodeURIComponent(note.message)}')">
                    Edit
                </button>
                <button onclick="deleteNote(${note.id})">
                    Delete
                </button>
            </div>
            `;
        });
        document.getElementById("user-notes").innerHTML=html;
    });
}


function showAddNote(){

    var box = document.getElementById("add-note-box");

    if(!box) return;

    if(box.style.display === "none"){
        box.style.display = "block";
    }
    else{
        box.style.display = "none";
    }

}

function saveNoteHome(){
    var textarea = document.getElementById("new-note");
    if(!textarea) return;
    var note = textarea.value.trim();
    if(note===""){
        alert("Enter a note");
        return;
    }
    fetch("/api/add-note",{
        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },
        body:JSON.stringify({
            user_id:homeUser.id,
            message:note
        })
    })
    .then(response=>response.json())
    .then(result=>{
        if(result.success){
            textarea.value = "";
            document.getElementById("add-note-box").style.display="none";
            if(homeUser){
              loadUserNotes();
            }
        }
        else{
            alert(result.message);
        }
    });
}

function editNote(id, message){

    message = decodeURIComponent(message);

    var newMessage = prompt("Edit your note", message);

    if(newMessage === null){
        return;
    }

    newMessage = newMessage.trim();

    if(newMessage === ""){
        return;
    }

    fetch("/api/update-note/" + id, {
        method: "PUT",
        headers:{
            "Content-Type":"application/json"
        },
        body: JSON.stringify({
            message: newMessage
        })
    })
    .then(response => response.json())
    .then(result => {
        if(result.success){
            if(homeUser){
              loadUserNotes();
            }
        }
    });
}

function deleteNote(id){
    if(!confirm("Delete this note?")){
        return;
    }
    fetch("/api/delete-note/"+id,{
        method:"DELETE"
    })
    .then(response=>response.json())
    .then(result=>{
        if(result.success){
            if(homeUser){
              loadUserNotes();
            }
        }
    });
}

document.addEventListener("DOMContentLoaded",function(){
    checkHomeLogin();
});
/* CONTACT FORM WITH FLASK + SUPABASE */

var records = [];
var editId = null;
var step = "idle";

var firstName = "";
var lastName = "";
var email = "";

var currentUser = null;

function showMessage(text, type) {
  var msg = document.getElementById("message");
  if (!msg) return;

  msg.innerHTML = text;
  msg.className = type;
}

function resetForm() {
  var form = document.getElementById("contactForm");

  if (form) {
    form.reset();
  }

  editId = null;
  showMessage("", "");
}

function loadRecords() {
  fetch("/api/records")
    .then(function (response) {
      return response.json();
    })
    .then(function (result) {
      if (result.success) {
        records = result.records;
        displayTable();
      } else {
        showMessage(result.message, "error");
      }
    })
    .catch(function (error) {
      showMessage("Unable to load records", "error");
      console.log(error);
    });
}

function displayTable() {
  var table = document.getElementById("dataTable");

  if (!table) return;

  table.innerHTML = `
    <tr>
      <th>First Name</th>
      <th>Last Name</th>
      <th>Age</th>
      <th>Gender</th>
      <th>Mobile</th>
      <th>Email</th>
      <th>Address</th>
      <th>Description</th>
      <th>Timestamp</th>
      <th>Actions</th>
    </tr>
  `;

  records.forEach(function (r) {
    var timestamp = r.created_at
      ? new Date(r.created_at).toLocaleString()
      : "-";

    table.innerHTML += `
      <tr>
        <td>${r.first_name || ""}</td>
        <td>${r.last_name || ""}</td>
        <td>${r.age || ""}</td>
        <td>${r.gender || ""}</td>
        <td>${r.mobile_number || ""}</td>
        <td>${r.email || ""}</td>
        <td>${r.address || ""}</td>
        <td>${r.description || "-"}</td>
        <td>${timestamp}</td>
        <td>
          <button onclick="editRecord(${r.id})">Edit</button>
          <button onclick="deleteRecord(${r.id})">Delete</button>
        </td>
      </tr>
    `;
  });
}

function editRecord(id) {
  var record = records.find(function (r) {
    return r.id === id;
  });

  if (!record) return;

  document.getElementById("fname").value = record.first_name || "";
  document.getElementById("lname").value = record.last_name || "";
  document.getElementById("age").value = record.age || "";
  document.getElementById("mobile").value = record.mobile_number || "";
  document.getElementById("email").value = record.email || "";
  document.getElementById("address").value = record.address || "";
  document.getElementById("description").value = record.description || "";

  var genderRadio = document.querySelector(
    `input[name="gender"][value="${record.gender}"]`
  );

  if (genderRadio) {
    genderRadio.checked = true;
  }

  editId = id;
  showMessage("You can now edit this record and click Submit.", "success");

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function deleteRecord(id) {
  if (!confirm("Delete this record?")) return;

  fetch("/api/records/" + id, {
    method: "DELETE"
  })
    .then(function (response) {
      return response.json();
    })
    .then(function (result) {
      if (result.success) {
        showMessage("Record deleted successfully", "success");
        loadRecords();
      } else {
        showMessage(result.message, "error");
      }
    })
    .catch(function (error) {
      showMessage("Unable to delete record", "error");
      console.log(error);
    });
}

document.addEventListener("DOMContentLoaded", function () {
  var form = document.getElementById("contactForm");

  if (!form) return;

  loadRecords();

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var fname = document.getElementById("fname").value.trim();
    var lname = document.getElementById("lname").value.trim();
    var age = document.getElementById("age").value;
    var mobile = document.getElementById("mobile").value.trim();
    var email = document.getElementById("email").value.trim();
    var address = document.getElementById("address").value.trim();
    var description = document.getElementById("description").value.trim();
    var genderObj = document.querySelector('input[name="gender"]:checked');

    if (fname === "") {
      showMessage("First Name cannot be empty", "error");
      return;
    }

    if (lname === "") {
      showMessage("Last Name cannot be empty", "error");
      return;
    }

    if (age < 1 || age > 99) {
      showMessage("Age must be between 1 and 99", "error");
      return;
    }

    if (!genderObj) {
      showMessage("Please select Gender", "error");
      return;
    }

    if (!/^[0-9]{10}$/.test(mobile)) {
      showMessage("Mobile Number must contain exactly 10 digits", "error");
      return;
    }

    if (!/^[^ ]+@[^ ]+\.[a-z]{2,}$/i.test(email)) {
      showMessage("Invalid Email Address", "error");
      return;
    }

    var data = {
      first_name: fname,
      last_name: lname,
      age: age,
      gender: genderObj.value,
      mobile_number: mobile,
      email: email,
      address: address,
      description: description
    };

    var url = "/api/records";
    var method = "POST";

    if (editId !== null) {
      url = "/api/records/" + editId;
      method = "PUT";
    }

    fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    })
      .then(function (response) {
        return response.json();
      })
      .then(function (result) {
        if (result.success) {
          showMessage(result.message, "success");
          form.reset();
          editId = null;
          loadRecords();
        } else {
          showMessage(result.message, "error");
        }
      })
      .catch(function (error) {
        showMessage("Database connection failed", "error");
        console.log(error);
      });
  });
});

/* CHATBOT CODE*/

var step = "idle";

var firstName = "";
var lastName = "";
var email = "";


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
    localStorage.removeItem("chat_token");

    step = "choose";
    botSay("👋 Welcome to Notes Circle");
    botSay("Type Register or Login");

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

            botSay("👋 Welcome to Notes Circle");
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
                    currentUser.token
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
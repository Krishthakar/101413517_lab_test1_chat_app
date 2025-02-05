const socket = io("http://localhost:5000");
let room = "";
let username = localStorage.getItem("username");

// Join Room
function joinRoom() {
    room = document.getElementById("roomSelect").value;
    document.getElementById("roomName").textContent = room;
    socket.emit("joinRoom", { username, room });
}

// Leave Room
function leaveRoom() {
    if (room) {
        socket.emit("leaveRoom", { username, room });
        room = "";
        document.getElementById("roomName").textContent = "-";
        document.getElementById("chatMessages").innerHTML = "<p>You left the room.</p>";
        document.getElementById("usersList").innerHTML = "";
    }
}

// Send Message
function sendMessage() {
    const message = document.getElementById("messageInput").value;
    if (room && message) {
        socket.emit("sendMessage", { from_user: username, room, message });
        document.getElementById("messageInput").value = "";
    }
}

// Display Received Messages
socket.on("receiveMessage", (data) => {
    document.getElementById("chatMessages").innerHTML += `<p><strong>${data.from_user}:</strong> ${data.message}</p>`;
});

// Typing Indicator
function handleTyping() {
    socket.emit("typing", { username, room });
}

socket.on("userTyping", (user) => {
    document.getElementById("typingIndicator").innerText = `${user} is typing...`;
    setTimeout(() => {
        document.getElementById("typingIndicator").innerText = "";
    }, 2000);
});

// Display Room Members
socket.on("updateUsers", (users) => {
    let userList = "";
    users.forEach(user => {
        userList += `<li>${user}</li>`;
    });
    document.getElementById("usersList").innerHTML = userList;
});

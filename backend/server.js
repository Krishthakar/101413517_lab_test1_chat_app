require("dotenv").config();
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.log("MongoDB Connection Error:", err));

// Import Routes
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

// Track Users in Rooms
let users = {};

// Socket.io Connection
io.on("connection", (socket) => {
    console.log("A user connected");

    // Handle Joining a Room
    socket.on("joinRoom", ({ username, room }) => {
        socket.join(room);
        users[socket.id] = { username, room };

        // Notify others in the room
        io.to(room).emit("receiveMessage", { from_user: "Chat Bot", message: `${username} has joined the chat!` });

        // Send updated user list
        let roomUsers = Object.values(users).filter(user => user.room === room).map(user => user.username);
        io.to(room).emit("updateUsers", roomUsers);
    });

    // Handle Leaving a Room
    socket.on("leaveRoom", ({ username, room }) => {
        socket.leave(room);
        io.to(room).emit("receiveMessage", { from_user: "Chat Bot", message: `${username} has left the chat.` });

        delete users[socket.id];

        let roomUsers = Object.values(users).filter(user => user.room === room).map(user => user.username);
        io.to(room).emit("updateUsers", roomUsers);
    });

    // Send Messages
    socket.on("sendMessage", ({ from_user, room, message }) => {
        io.to(room).emit("receiveMessage", { from_user, message });
    });

    // Typing Indicator
    socket.on("typing", ({ username, room }) => {
        socket.to(room).emit("userTyping", username);
    });

    socket.on("disconnect", () => {
        if (users[socket.id]) {
            const { username, room } = users[socket.id];
            io.to(room).emit("receiveMessage", { from_user: "Chat Bot", message: `${username} has left the chat.` });

            delete users[socket.id];

            let roomUsers = Object.values(users).filter(user => user.room === room).map(user => user.username);
            io.to(room).emit("updateUsers", roomUsers);
        }
    });
});

// Default Route
app.get("/", (req, res) => {
    res.send("Chat Server is Running...");
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

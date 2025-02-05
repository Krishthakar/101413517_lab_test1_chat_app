const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
    from_user: { type: String, required: true },
    to_user: { type: String },  // Optional for private messages
    room: { type: String },     // Optional for group messages
    message: { type: String, required: true },
    date_sent: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Message", MessageSchema);

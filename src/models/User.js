const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
	username: { type: String, required: true, unique: true },
	password: { type: String, required: true },
	articlesWritten: { type: Number, default: 0 },
	commentsMade: { type: Number, default: 0 },
	likesReceived: { type: Number, default: 0 },
});

const User = mongoose.model("User", UserSchema);

module.exports = User;

// const mongoose = require("mongoose");

// const UserSchema = new mongoose.Schema({
// 	username: { type: String, required: true, unique: true },
// 	password: { type: String, required: true },
// });

// const User = mongoose.model("User", UserSchema);

// module.exports = User;

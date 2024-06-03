const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middleware/middleware");
const User = require("../models/User");

const router = express.Router();

const getUserProfile = async (req, res) => {
	try {
		console.log("Fetching profile for user ID:", req.user.userId); // Log user ID
		const user = await User.findById(req.user.userId).select("-password");
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}
		res.json(user);
	} catch (error) {
		console.error("Server error fetching user profile:", error); // Log error
		res.status(500).json({ message: "Server error" });
	}
};

const setAuthCookie = (res, token) => {
	res.cookie("authToken", token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
	});
};

router.get("/me", authMiddleware, getUserProfile);

router.post("/signup", async (req, res) => {
	const { username, password } = req.body;
	const hashedPassword = await bcrypt.hash(password, 10);
	const user = new User({ username, password: hashedPassword });
	await user.save();
	const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
	setAuthCookie(res, token);
	res.status(201).send({ token });
});

router.post("/signin", async (req, res) => {
	const { username, password } = req.body;
	const user = await User.findOne({ username });
	if (!user) return res.status(400).send("Invalid credentials");
	const isMatch = await bcrypt.compare(password, user.password);
	if (!isMatch) return res.status(400).send("Invalid credentials");
	const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
	setAuthCookie(res, token);
	res.send({ token });
});

router.post("/logout", authMiddleware, (req, res) => {
	res.clearCookie("authToken");
	res.send("Logged out");
});

module.exports = router;

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middleware/middleware");
const User = require("../models/User");

const router = express.Router();

const getUserProfile = async (req, res) => {
	try {
		const user = await User.findById(req.user.userId).select("-password");
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}
		res.json(user);
	} catch (error) {
		res.status(500).json({ message: "Server error" });
	}
};

const updateUserProfile = async (req, res) => {
	try {
		const { username, email } = req.body;
		const user = await User.findById(req.user.userId);

		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		if (username) user.username = username;
		if (email) user.email = email;

		await user.save();

		res.json(user);
	} catch (error) {
		res.status(500).json({ message: "Server error" });
	}
};

const setAuthCookie = (res, token) => {
	res.cookie("authToken", token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "None",
		maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
	});
};

router.get("/me", authMiddleware, getUserProfile);
router.put("/me", authMiddleware, updateUserProfile);

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

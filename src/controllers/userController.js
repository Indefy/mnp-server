const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Article = require("../models/Article");
const authMiddleware = require("../middleware/middleware");

const router = express.Router();

// Helper function to set authentication cookie
const setAuthCookie = (res, token) => {
	res.cookie("authToken", token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "None",
		maxAge: 30 * 24 * 60 * 60 * 1000,
	});
};

// Register new user and set authentication cookie
router.post("/signup", async (req, res) => {
	const { username, password } = req.body;
	const hashedPassword = await bcrypt.hash(password, 10);
	const user = new User({ username, password: hashedPassword });
	await user.save();
	const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
	setAuthCookie(res, token);
	res.status(201).send({ token });
});

// Handle user login and set authentication cookie
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

// Fetch current user's profile, authenticated by middleware
const getUserProfile = async (req, res) => {
	try {
		const user = await User.findById(req.user.userId).select("-password");
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		// Calculate additional statistics
		const articlesWritten = await Article.countDocuments({ author: user._id });
		const commentsMade = await Article.aggregate([
			{ $unwind: "$comments" },
			{ $match: { "comments.user": user._id } },
			{ $count: "total" },
		]);
		const likesReceived = await Article.aggregate([
			{ $match: { author: user._id } },
			{ $group: { _id: null, totalLikes: { $sum: { $size: "$likes" } } } },
		]);

		// Include the calculated statistics in the response
		user.articlesWritten = articlesWritten;
		user.commentsMade = commentsMade[0] ? commentsMade[0].total : 0;
		user.likesReceived = likesReceived[0] ? likesReceived[0].totalLikes : 0;

		res.json(user);
	} catch (error) {
		res.status(500).json({ message: "Server error" });
	}
};

// Update current user's profile, require authentication
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

// Fetch current user profile, ensure the user is authenticated
router.get("/me", authMiddleware, async (req, res) => {
	try {
		const user = await User.findById(req.user.userId).select("-password");
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		// Calculate additional statistics
		const articlesWritten = await Article.countDocuments({ author: user._id });
		const commentsMade = await Article.aggregate([
			{ $unwind: "$comments" },
			{ $match: { "comments.user": user._id } },
			{ $count: "total" },
		]);
		const likesReceived = await Article.aggregate([
			{ $match: { author: user._id } },
			{ $group: { _id: null, totalLikes: { $sum: { $size: "$likes" } } } },
		]);

		// Include the calculated statistics in the response
		user.articlesWritten = articlesWritten;
		user.commentsMade = commentsMade[0] ? commentsMade[0].total : 0;
		user.likesReceived = likesReceived[0] ? likesReceived[0].totalLikes : 0;

		res.json(user);
	} catch (error) {
		console.error("Error fetching user profile:", error);
		res.status(500).json({ message: "Server error" });
	}
});

// Routes for fetching and updating user profile, secured by authentication middleware
router.get("/me", authMiddleware, getUserProfile);
router.put("/me", authMiddleware, updateUserProfile);

// Logout user and clear authentication cookie
router.post("/logout", authMiddleware, (req, res) => {
	res.clearCookie("authToken");
	res.send("Logged out");
});

module.exports = router;

// const express = require("express");
// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");
// const User = require("../models/User");
// const authMiddleware = require("../middleware/middleware");

// const router = express.Router();

// // Helper function to set authentication cookie
// const setAuthCookie = (res, token) => {
// 	res.cookie("authToken", token, {
// 		httpOnly: true,
// 		secure: process.env.NODE_ENV === "production",
// 		sameSite: "None",
// 		maxAge: 30 * 24 * 60 * 60 * 1000,
// 	});
// };

// // Register new user and set authentication cookie
// router.post("/signup", async (req, res) => {
// 	const { username, password } = req.body;
// 	const hashedPassword = await bcrypt.hash(password, 10);
// 	const user = new User({ username, password: hashedPassword });
// 	await user.save();
// 	const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
// 	setAuthCookie(res, token);
// 	res.status(201).send({ token });
// });

// // Handle user login and set authentication cookie
// router.post("/signin", async (req, res) => {
// 	const { username, password } = req.body;
// 	const user = await User.findOne({ username });
// 	if (!user) return res.status(400).send("Invalid credentials");
// 	const isMatch = await bcrypt.compare(password, user.password);
// 	if (!isMatch) return res.status(400).send("Invalid credentials");
// 	const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
// 	setAuthCookie(res, token);
// 	res.send({ token });
// });

// // Fetch current user's profile, authenticated by middleware
// const getUserProfile = async (req, res) => {
// 	try {
// 		const user = await User.findById(req.user.userId).select("-password");
// 		if (!user) {
// 			return res.status(404).json({ message: "User not found" });
// 		}
// 		res.json(user);
// 	} catch (error) {
// 		res.status(500).json({ message: "Server error" });
// 	}
// };

// // Update current user's profile, require authentication
// const updateUserProfile = async (req, res) => {
// 	try {
// 		const { username, email } = req.body;
// 		const user = await User.findById(req.user.userId);

// 		if (!user) {
// 			return res.status(404).json({ message: "User not found" });
// 		}

// 		if (username) user.username = username;
// 		if (email) user.email = email;

// 		await user.save();

// 		res.json(user);
// 	} catch (error) {
// 		res.status(500).json({ message: "Server error" });
// 	}
// };

// // Fetch current user profile, ensure the user is authenticated
// router.get("/me", authMiddleware, async (req, res) => {
// 	try {
// 		const user = await User.findById(req.user.userId).select("-password");
// 		if (!user) {
// 			return res.status(404).json({ message: "User not found" });
// 		}
// 		res.json(user);
// 	} catch (error) {
// 		console.error("Error fetching user profile:", error);
// 		res.status(500).json({ message: "Server error" });
// 	}
// });

// // Routes for fetching and updating user profile, secured by authentication middleware
// router.get("/me", authMiddleware, getUserProfile);
// router.put("/me", authMiddleware, updateUserProfile);

// // Logout user and clear authentication cookie
// router.post("/logout", authMiddleware, (req, res) => {
// 	res.clearCookie("authToken");
// 	res.send("Logged out");
// });

// module.exports = router;

const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// Validate authentication token and retrieve user information
router.get("/validate-token", async (req, res) => {
	const token = req.headers.authorization?.split(" ")[1];
	if (!token) {
		return res.status(401).send("No token provided");
	}

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		const user = await User.findById(decoded.userId).select("-password");
		if (!user) {
			return res.status(401).send("Invalid token");
		}
		res.send({ user });
	} catch (error) {
		res.status(401).send("Invalid token");
	}
});

module.exports = router;

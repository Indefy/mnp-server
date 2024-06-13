const jwt = require("jsonwebtoken");

// Middleware to verify authentication token and authorize user access
const authMiddleware = (req, res, next) => {
	const token =
		req.cookies.authToken ||
		req.header("Authorization")?.replace("Bearer ", "");
	if (!token) {
		return res.status(401).json({ message: "No token, authorization denied" });
	}

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		req.user = decoded;
		next();
	} catch (err) {
		console.error("Token verification failed:", err);
		res.status(401).json({ message: "Token is not valid" });
	}
};

module.exports = authMiddleware;

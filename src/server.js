require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const userRouter = require("./controllers/userController"); // Import userController
const articleRouter = require("./controllers/articleController");
const authRouter = require("./controllers/authController"); // Updated

const app = express();

// Configure CORS
app.use(
	cors({
		credentials: true,
		origin: process.env.CORS_ORIGIN,
		methods: ["GET", "POST", "PUT", "DELETE"],
	})
);

app.use(express.json());
app.use(cookieParser());

// Centralized error handling middleware for logging
app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).send({ message: "Internal Server Error" });
});

// Establish connection to MongoDB
const connectToDatabase = async () => {
	try {
		await mongoose.connect(process.env.MONGODB_URI, {});
		console.log("Connected to MongoDB");
	} catch (err) {
		console.error("Failed to connect to MongoDB", err);
		process.exit(1);
	}
};

connectToDatabase();

// Routing middleware for different entity operations
app.use("/api/users", userRouter);
app.use("/api/articles", articleRouter);
app.use("/api/auth", authRouter);

// 404 error handling middleware
app.use((req, res, next) => {
	res.status(404).send({ message: "Not Found" });
});

// Error handling middleware
app.use((err, req, res, next) => {
	console.error("An error occurred:", err);
	res
		.status(err.status || 500)
		.send({ message: err.message || "Internal Server Error" });
});

if (process.env.NODE_ENV === "production") {
	app.use(express.static(path.join(__dirname, "client/build")));

	app.get("*", (req, res) => {
		res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
	});
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
	console.log(`Server running on port http://localhost:${PORT}`)
);

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const userRouter = require("./controllers/userController");
const articleRouter = require("./controllers/articleController");

const app = express();

app.use(
	cors({
		credentials: true,
		origin: process.env.FRONTEND_URL,
		methods: ["GET", "POST", "PUT", "DELETE"],
	})
);
app.use(express.json());
app.use(cookieParser());

// Middleware for logging errors
app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).send({ message: "Internal Server Error" });
});

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

app.use("/api/users", userRouter);
app.use("/api/articles", articleRouter);

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
	console.log(`Server running on port http://localhost:${PORT}`)
);

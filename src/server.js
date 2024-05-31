require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const userRouter = require("./controllers/userController");
const articleRouter = require("./article");
const app = express();

app.use(cors());
app.use(express.json());

const connectToDatabase = async () => {
	try {
		await mongoose.connect(process.env.MONGODB_URI, {});
		console.log("Connected to MongoDB");
	} catch (err) {
		console.error("Failed to connect to MongoDB", err);
	}
};

connectToDatabase();

app.use("/api/users", userRouter);
app.use("/api/articles", articleRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
	console.log(`Server running on port http://localhost:${PORT}`)
);

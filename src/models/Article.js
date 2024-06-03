const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema({
	user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
	content: { type: String, required: true },
	date: { type: Date, default: Date.now },
});

const ArticleSchema = new mongoose.Schema({
	title: { type: String, required: true },
	content: { type: String, required: true },
	author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
	date: { type: Date, default: Date.now },
	category: { type: String, required: true },
	comments: [CommentSchema],
	likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
	bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
	image: { type: String },
});

const Article = mongoose.model("Article", ArticleSchema);

module.exports = Article;

const express = require("express");
const auth = require("./middleware/middleware");
const Article = require("./models/Article"); // Import the Article model

const router = express.Router();

router.post("/", auth, async (req, res) => {
	const article = new Article({ ...req.body, author: req.user.userId });
	await article.save();
	res.status(201).send(article);
});

router.get("/", async (req, res) => {
	const articles = await Article.find().populate("author", "username");
	res.send(articles);
});

router.get("/:id", async (req, res) => {
	try {
		const article = await Article.findById(req.params.id)
			.populate("author", "username")
			.populate("comments.user", "username"); // Populate comments with user info
		if (!article) {
			return res.status(404).send("Article not found");
		}
		res.send(article);
	} catch (error) {
		res.status(500).send("Server error");
	}
});

router.put("/:id", auth, async (req, res) => {
	const article = await Article.findById(req.params.id);
	if (article.author.toString() !== req.user.userId)
		return res.status(403).send("Forbidden");
	Object.assign(article, req.body);
	await article.save();
	res.send(article);
});

router.delete("/:id", auth, async (req, res) => {
	const article = await Article.findById(req.params.id);
	if (article.author.toString() !== req.user.userId)
		return res.status(403).send("Forbidden");
	await article.remove();
	res.send("Article deleted");
});

router.post("/:id/comments", auth, async (req, res) => {
	try {
		const article = await Article.findById(req.params.id);
		article.comments.push({ user: req.user.userId, content: req.body.content });
		await article.save();
		const populatedArticle = await Article.findById(req.params.id)
			.populate("author", "username")
			.populate("comments.user", "username"); // Populate comments with user info
		res.send(populatedArticle);
	} catch (error) {
		res.status(500).send("Server error");
	}
});

router.post("/:id/like", auth, async (req, res) => {
	try {
		const article = await Article.findById(req.params.id);
		if (!article.likes.includes(req.user.userId)) {
			article.likes.push(req.user.userId);
		} else {
			article.likes.pull(req.user.userId);
		}
		await article.save();
		const populatedArticle = await Article.findById(req.params.id)
			.populate("author", "username")
			.populate("comments.user", "username");
		res.send(populatedArticle);
	} catch (error) {
		res.status(500).send("Server error");
	}
});

router.post("/:id/bookmark", auth, async (req, res) => {
	try {
		const article = await Article.findById(req.params.id);
		if (!article.bookmarks.includes(req.user.userId)) {
			article.bookmarks.push(req.user.userId);
		} else {
			article.bookmarks.pull(req.user.userId);
		}
		await article.save();
		const populatedArticle = await Article.findById(req.params.id)
			.populate("author", "username")
			.populate("comments.user", "username");
		res.send(populatedArticle);
	} catch (error) {
		res.status(500).send("Server error");
	}
});

module.exports = router;

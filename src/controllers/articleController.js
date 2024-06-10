const express = require("express");
const auth = require("../middleware/middleware");
const Article = require("../models/Article");

const router = express.Router();

// Route to fetch articles with optional category and search query parameters
router.get("/", async (req, res) => {
	const { category, search } = req.query;
	let filter = {};

	if (category) {
		filter.category = category;
	}

	if (search) {
		filter.title = { $regex: search, $options: "i" };
	}

	try {
		const articles = await Article.find(filter).populate("author", "username");
		res.send(articles);
	} catch (error) {
		res.status(500).send("Server error");
	}
});

// Route to fetch distinct categories
router.get("/categories", async (req, res) => {
	try {
		const categories = await Article.distinct("category");
		res.json(categories);
	} catch (error) {
		res.status(500).send("Server error");
	}
});

// Route to fetch a single article by ID
router.get("/:id", async (req, res) => {
	try {
		const article = await Article.findById(req.params.id)
			.populate("author", "username")
			.populate("comments.user", "username");
		if (!article) {
			return res.status(404).send("Article not found");
		}
		res.send(article);
	} catch (error) {
		res.status(500).send("Server error");
	}
});

// Route to create a new article
router.post("/", auth, async (req, res) => {
	const article = new Article({ ...req.body, author: req.user.userId });
	await article.save();
	res.status(201).send(article);
});

// Route to update an existing article
router.put("/:id", auth, async (req, res) => {
	const article = await Article.findById(req.params.id);
	if (article.author.toString() !== req.user.userId)
		return res.status(403).send("Forbidden");
	Object.assign(article, req.body);
	await article.save();
	res.send(article);
});

// Route to delete an existing article
router.delete("/:id", auth, async (req, res) => {
	const article = await Article.findById(req.params.id);
	if (article.author.toString() !== req.user.userId)
		return res.status(403).send("Forbidden");
	await article.remove();
	res.send("Article deleted");
});

// Route to add a comment to an article
router.post("/:id/comments", auth, async (req, res) => {
	try {
		const article = await Article.findById(req.params.id);
		article.comments.push({ user: req.user.userId, content: req.body.content });
		await article.save();
		const populatedArticle = await Article.findById(req.params.id)
			.populate("author", "username")
			.populate("comments.user", "username");
		res.send(populatedArticle);
	} catch (error) {
		res.status(500).send("Server error");
	}
});

// Route to like or unlike an article
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

// Route to bookmark or unbookmark an article
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

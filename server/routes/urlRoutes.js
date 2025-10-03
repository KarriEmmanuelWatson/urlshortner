import express from "express";
import { nanoid } from "nanoid";
import Url from "../models/Url.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

/**
 * POST /api/shorten
 * Create a new short URL
 * Body: { originalUrl, duration (optional, in minutes), prefix (optional) }
 */
router.post("/shorten", authMiddleware, async (req, res) => {
  try {
    const { originalUrl, duration, prefix } = req.body;

    if (!originalUrl)
      return res.status(400).json({ error: "Original URL is required" });

    // 1️⃣ Calculate expiration time
    const expireMinutes = duration ? parseInt(duration) : 10; // default 10 minutes
    const expireAt = new Date(Date.now() + expireMinutes * 60 * 1000);

    // 2️⃣ Generate shortId
    const nanoIdPart = nanoid(6); // unique random part
    const shortId = prefix ? prefix + nanoIdPart : nanoIdPart;
    const shortUrl = `${req.protocol}://${req.get("host")}/${shortId}`;

    // 3️⃣ Save URL to DB
    const url = new Url({
      originalUrl,
      shortId,
      user: req.user.userId,
      expireAt,
    });

    await url.save();

    res.json({
      originalUrl,
      shortUrl,
      expireAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * GET /api/my-urls
 * Get all URLs created by the logged-in user
 */
router.get("/my-urls", authMiddleware, async (req, res) => {
  try {
    const urls = await Url.find({ user: req.user.userId }).sort({
      createdAt: -1,
    });
    res.json(urls);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * DELETE /api/:shortId
 * Delete a URL if it belongs to the logged-in user
 */
router.delete("/:shortId", authMiddleware, async (req, res) => {
  try {
    const url = await Url.findOne({
      shortId: req.params.shortId,
      user: req.user.userId,
    });
    if (!url) return res.status(404).json({ error: "URL not found" });

    await url.deleteOne();
    res.json({ message: "URL deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * GET /:shortId
 * Redirect to the original URL if it exists and is not expired
 * Note: This route is usually mounted at root, not under /api
 */
router.get("/:shortId", async (req, res) => {
  try {
    const url = await Url.findOne({ shortId: req.params.shortId });

    if (!url) return res.status(404).send("URL not found");

    if (new Date() > url.expireAt) {
      return res.status(410).send("URL has expired"); // 410 Gone
    }

    res.redirect(url.originalUrl);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

export default router;

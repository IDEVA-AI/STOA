import { Router } from "express";
import * as postService from "../services/postService";

const router = Router();

router.get("/feed", (req, res) => {
  const posts = postService.listPosts();
  res.json(posts);
});

router.post("/posts", (req, res) => {
  const { content, userId } = req.body;
  const result = postService.createPost(userId || 1, content);
  res.json({ id: result.lastInsertRowid });
});

export default router;

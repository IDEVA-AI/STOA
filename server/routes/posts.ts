import { Router } from "express";
import * as postService from "../services/postService";

const router = Router();

router.get("/community/sidebar", (req, res) => {
  const topPosters = postService.getTopPosters(5);
  const trendingPosts = postService.getTrendingPosts(5);
  res.json({ topPosters, trendingPosts });
});

router.get("/feed", (req, res) => {
  const posts = postService.listPosts();
  res.json(posts);
});

router.post("/posts", (req, res) => {
  const { content, userId } = req.body;
  const result = postService.createPost(userId || 1, content);
  res.json({ id: result.lastInsertRowid });
});

router.post("/posts/:id/like", (req, res) => {
  const postId = Number(req.params.id);
  const userId = Number(req.body?.userId) || 1;
  const liked = postService.toggleLike(postId, userId);
  res.json({ liked });
});

router.get("/posts/:id/comments", (req, res) => {
  const postId = Number(req.params.id);
  const comments = postService.getComments(postId);
  res.json(comments);
});

router.post("/posts/:id/comments", (req, res) => {
  const postId = Number(req.params.id);
  const { userId, content } = req.body;
  const comment = postService.createComment(postId, userId || 1, content);
  res.json(comment);
});

export default router;

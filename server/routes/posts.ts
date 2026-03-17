import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import * as postService from "../services/postService";

const router = Router();
router.use(authMiddleware);

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
  const { content } = req.body;
  const result = postService.createPost(req.userId!, content);
  res.json({ id: result.lastInsertRowid });
});

router.post("/posts/:id/like", (req, res) => {
  const postId = Number(req.params.id);
  const liked = postService.toggleLike(postId, req.userId!);
  res.json({ liked });
});

router.get("/posts/:id/comments", (req, res) => {
  const postId = Number(req.params.id);
  const comments = postService.getComments(postId);
  res.json(comments);
});

router.post("/posts/:id/comments", (req, res) => {
  const postId = Number(req.params.id);
  const { content } = req.body;
  const comment = postService.createComment(postId, req.userId!, content);
  res.json(comment);
});

export default router;

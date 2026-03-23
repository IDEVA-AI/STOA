import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import * as postService from "../services/postService";

const router = Router();
router.use(authMiddleware);

router.get("/community/sidebar", async (req, res) => {
  const topPosters = await postService.getTopPosters(5);
  const trendingPosts = await postService.getTrendingPosts(5);
  res.json({ topPosters, trendingPosts });
});

router.get("/feed", async (req, res) => {
  const posts = await postService.listPosts();
  res.json(posts);
});

router.post("/posts", async (req, res) => {
  const { content } = req.body;
  const result = await postService.createPost(req.userId!, content);
  res.json({ id: result.rows[0]?.id });
});

router.post("/posts/:id/like", async (req, res) => {
  const postId = Number(req.params.id);
  const liked = await postService.toggleLike(postId, req.userId!);
  res.json({ liked });
});

router.get("/posts/:id/comments", async (req, res) => {
  const postId = Number(req.params.id);
  const comments = await postService.getComments(postId);
  res.json(comments);
});

router.post("/posts/:id/comments", async (req, res) => {
  const postId = Number(req.params.id);
  const { content } = req.body;
  const comment = await postService.createComment(postId, req.userId!, content);
  res.json(comment);
});

export default router;

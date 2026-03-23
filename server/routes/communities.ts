import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import * as communityService from "../services/communityService";

const router = Router();
router.use(authMiddleware);

// List communities for workspace
router.get("/workspace/:workspaceId", async (req, res) => {
  try {
    const workspaceId = Number(req.params.workspaceId);
    const communities = await communityService.listByWorkspace(workspaceId);
    res.json(communities);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get community for a course
router.get("/course/:courseId", async (req, res) => {
  try {
    const courseId = Number(req.params.courseId);
    const communities = await communityService.getByCourse(courseId);
    res.json(communities);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get community with categories
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const community = await communityService.getById(id);
    if (!community) {
      res.status(404).json({ error: "Community not found" });
      return;
    }
    res.json(community);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create community
router.post("/", async (req, res) => {
  try {
    const { workspace_id, course_id, name, description } = req.body;
    if (!workspace_id || !name) {
      res.status(400).json({ error: "workspace_id and name are required" });
      return;
    }
    const result = await communityService.create({ workspace_id, course_id, name, description });
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update community
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, description } = req.body;
    await communityService.update(id, { name, description });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete community
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await communityService.remove(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// List categories
router.get("/:id/categories", async (req, res) => {
  try {
    const communityId = Number(req.params.id);
    const categories = await communityService.getCategories(communityId);
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create category
router.post("/:id/categories", async (req, res) => {
  try {
    const communityId = Number(req.params.id);
    const { name, position } = req.body;
    if (!name) {
      res.status(400).json({ error: "name is required" });
      return;
    }
    const result = await communityService.createCategory(communityId, name, position ?? 0);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update category
router.put("/categories/:categoryId", async (req, res) => {
  try {
    const categoryId = Number(req.params.categoryId);
    const { name, position } = req.body;
    await communityService.updateCategory(categoryId, { name, position });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete category
router.delete("/categories/:categoryId", async (req, res) => {
  try {
    const categoryId = Number(req.params.categoryId);
    await communityService.removeCategory(categoryId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create post in community
router.post("/:id/posts", async (req, res) => {
  try {
    const communityId = Number(req.params.id);
    const userId = req.userId;
    const { content, categoryId } = req.body;
    if (!content?.trim()) {
      return res.status(400).json({ error: "Content is required" });
    }
    const result = await communityService.createPost(communityId, userId!, content, categoryId);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// List posts for community
router.get("/:id/posts", async (req, res) => {
  try {
    const communityId = Number(req.params.id);
    const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const offset = req.query.offset ? Number(req.query.offset) : undefined;
    const userId = req.userId;
    const posts = await communityService.getPosts(communityId, { categoryId, userId, limit, offset });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Pinned posts for community
router.get("/:id/posts/pinned", async (req, res) => {
  try {
    const communityId = Number(req.params.id);
    const posts = await communityService.getPinnedPosts(communityId);
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id/posts/:postId/pin", async (req, res) => {
  try {
    const postId = Number(req.params.postId);
    if (req.userRole !== "admin") {
      return res.status(403).json({ error: "Only admins can pin posts" });
    }
    const result = await communityService.togglePin(postId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id/posts/:postId", async (req, res) => {
  try {
    const postId = Number(req.params.postId);
    const post = await communityService.getPostById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    if (post.user_id !== req.userId && req.userRole !== "admin") {
      return res.status(403).json({ error: "Not authorized" });
    }
    await communityService.deletePost(postId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id/posts/:postId", async (req, res) => {
  try {
    const postId = Number(req.params.postId);
    const { content } = req.body;
    const post = await communityService.getPostById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    if (post.user_id !== req.userId) {
      return res.status(403).json({ error: "Not authorized" });
    }
    if (!content?.trim()) {
      return res.status(400).json({ error: "Content is required" });
    }
    await communityService.updatePost(postId, content);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

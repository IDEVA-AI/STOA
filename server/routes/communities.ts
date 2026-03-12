import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import * as communityService from "../services/communityService";

const router = Router();
router.use(authMiddleware);

// List communities for workspace
router.get("/workspace/:workspaceId", (req, res) => {
  try {
    const workspaceId = Number(req.params.workspaceId);
    const communities = communityService.listByWorkspace(workspaceId);
    res.json(communities);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get community for a course
router.get("/course/:courseId", (req, res) => {
  try {
    const courseId = Number(req.params.courseId);
    const communities = communityService.getByCourse(courseId);
    res.json(communities);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get community with categories
router.get("/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    const community = communityService.getById(id);
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
router.post("/", (req, res) => {
  try {
    const { workspace_id, course_id, name, description } = req.body;
    if (!workspace_id || !name) {
      res.status(400).json({ error: "workspace_id and name are required" });
      return;
    }
    const result = communityService.create({ workspace_id, course_id, name, description });
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update community
router.put("/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, description } = req.body;
    communityService.update(id, { name, description });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete community
router.delete("/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    communityService.remove(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// List categories
router.get("/:id/categories", (req, res) => {
  try {
    const communityId = Number(req.params.id);
    const categories = communityService.getCategories(communityId);
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create category
router.post("/:id/categories", (req, res) => {
  try {
    const communityId = Number(req.params.id);
    const { name, position } = req.body;
    if (!name) {
      res.status(400).json({ error: "name is required" });
      return;
    }
    const result = communityService.createCategory(communityId, name, position ?? 0);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update category
router.put("/categories/:categoryId", (req, res) => {
  try {
    const categoryId = Number(req.params.categoryId);
    const { name, position } = req.body;
    communityService.updateCategory(categoryId, { name, position });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete category
router.delete("/categories/:categoryId", (req, res) => {
  try {
    const categoryId = Number(req.params.categoryId);
    communityService.removeCategory(categoryId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// List posts for community
router.get("/:id/posts", (req, res) => {
  try {
    const communityId = Number(req.params.id);
    const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const offset = req.query.offset ? Number(req.query.offset) : undefined;
    const userId = req.userId;
    const posts = communityService.getPosts(communityId, { categoryId, userId, limit, offset });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Pinned posts for community
router.get("/:id/posts/pinned", (req, res) => {
  try {
    const communityId = Number(req.params.id);
    const posts = communityService.getPinnedPosts(communityId);
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import * as productService from "../services/productService";

const router = Router();

// List products for a workspace
router.get("/workspace/:workspaceId", authMiddleware, async (req, res) => {
  try {
    const workspaceId = Number(req.params.workspaceId);
    const products = await productService.listByWorkspace(workspaceId);
    res.json(products);
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || "Internal server error" });
  }
});

// Get single product with courses
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const product = await productService.getById(id);

    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    const courses = await productService.getCourses(id);
    res.json({ ...product, courses });
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || "Internal server error" });
  }
});

// Create product
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { workspace_id, title, description, price, type, is_published, courseIds } = req.body;

    if (!workspace_id || !title) {
      res.status(400).json({ error: "workspace_id and title are required" });
      return;
    }

    const id = await productService.create({
      workspace_id,
      title,
      description,
      price,
      type,
      is_published,
      courseIds,
    });

    const product = await productService.getById(id);
    res.status(201).json(product);
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || "Internal server error" });
  }
});

// Update product
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await productService.getById(id);

    if (!existing) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    const { title, description, price, type, is_published, courseIds } = req.body;
    await productService.update(id, { title, description, price, type, is_published, courseIds });

    const updated = await productService.getById(id);
    res.json(updated);
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || "Internal server error" });
  }
});

// Delete product
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await productService.getById(id);

    if (!existing) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    await productService.remove(id);
    res.json({ success: true });
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || "Internal server error" });
  }
});

// Set courses for a product
router.post("/:id/courses", authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await productService.getById(id);

    if (!existing) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    const { courseIds } = req.body;
    if (!Array.isArray(courseIds)) {
      res.status(400).json({ error: "courseIds must be an array" });
      return;
    }

    await productService.setCourses(id, courseIds);
    const courses = await productService.getCourses(id);
    res.json({ success: true, courses });
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || "Internal server error" });
  }
});

export default router;

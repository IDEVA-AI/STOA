import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import * as productService from "../services/productService";

const router = Router();

// List products for a workspace
router.get("/workspace/:workspaceId", authMiddleware, (req, res) => {
  try {
    const workspaceId = Number(req.params.workspaceId);
    const products = productService.listByWorkspace(workspaceId);
    res.json(products);
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || "Internal server error" });
  }
});

// Get single product with courses
router.get("/:id", authMiddleware, (req, res) => {
  try {
    const id = Number(req.params.id);
    const product = productService.getById(id);

    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    const courses = productService.getCourses(id);
    res.json({ ...product, courses });
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || "Internal server error" });
  }
});

// Create product
router.post("/", authMiddleware, (req, res) => {
  try {
    const { workspace_id, title, description, price, type, is_published, courseIds } = req.body;

    if (!workspace_id || !title) {
      res.status(400).json({ error: "workspace_id and title are required" });
      return;
    }

    const id = productService.create({
      workspace_id,
      title,
      description,
      price,
      type,
      is_published,
      courseIds,
    });

    const product = productService.getById(id);
    res.status(201).json(product);
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || "Internal server error" });
  }
});

// Update product
router.put("/:id", authMiddleware, (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = productService.getById(id);

    if (!existing) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    const { title, description, price, type, is_published, courseIds } = req.body;
    productService.update(id, { title, description, price, type, is_published, courseIds });

    const updated = productService.getById(id);
    res.json(updated);
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || "Internal server error" });
  }
});

// Delete product
router.delete("/:id", authMiddleware, (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = productService.getById(id);

    if (!existing) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    productService.remove(id);
    res.json({ success: true });
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || "Internal server error" });
  }
});

// Set courses for a product
router.post("/:id/courses", authMiddleware, (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = productService.getById(id);

    if (!existing) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    const { courseIds } = req.body;
    if (!Array.isArray(courseIds)) {
      res.status(400).json({ error: "courseIds must be an array" });
      return;
    }

    productService.setCourses(id, courseIds);
    const courses = productService.getCourses(id);
    res.json({ success: true, courses });
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || "Internal server error" });
  }
});

export default router;

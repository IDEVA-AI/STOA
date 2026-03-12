import { Router, Request, Response } from "express";
import * as workspaceService from "../services/workspaceService";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.use(authMiddleware);

// List workspaces for current user
router.get("/", (req: Request, res: Response) => {
  try {
    const workspaces = workspaceService.listByUser(req.userId!);
    res.status(200).json(workspaces);
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || "Internal server error" });
  }
});

// Get workspace by slug
router.get("/:slug", (req: Request, res: Response) => {
  try {
    const workspace = workspaceService.getBySlug(req.params.slug);
    res.status(200).json(workspace);
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || "Internal server error" });
  }
});

// Create workspace
router.post("/", (req: Request, res: Response) => {
  try {
    const { name, slug, logo } = req.body;
    const workspace = workspaceService.create(req.userId!, { name, slug, logo });
    res.status(201).json(workspace);
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || "Internal server error" });
  }
});

// Update workspace
router.put("/:id", (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { name, slug, logo } = req.body;
    const workspace = workspaceService.update(id, req.userId!, { name, slug, logo });
    res.status(200).json(workspace);
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || "Internal server error" });
  }
});

// Delete workspace
router.delete("/:id", (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    workspaceService.remove(id, req.userId!);
    res.status(200).json({ message: "Workspace deleted" });
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || "Internal server error" });
  }
});

// List workspace members
router.get("/:id/members", (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const members = workspaceService.getMembers(id);
    res.status(200).json(members);
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || "Internal server error" });
  }
});

// Add member to workspace
router.post("/:id/members", (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { userId, role } = req.body;
    const members = workspaceService.addMember(id, userId, role);
    res.status(201).json(members);
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || "Internal server error" });
  }
});

// Update member role
router.put("/:id/members/:userId", (req: Request, res: Response) => {
  try {
    const workspaceId = Number(req.params.id);
    const targetUserId = Number(req.params.userId);
    const { role } = req.body;
    const members = workspaceService.updateMemberRole(workspaceId, targetUserId, role, req.userId!);
    res.status(200).json(members);
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || "Internal server error" });
  }
});

// Remove member from workspace
router.delete("/:id/members/:userId", (req: Request, res: Response) => {
  try {
    const workspaceId = Number(req.params.id);
    const targetUserId = Number(req.params.userId);
    const members = workspaceService.removeMember(workspaceId, targetUserId, req.userId!);
    res.status(200).json(members);
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || "Internal server error" });
  }
});

export default router;

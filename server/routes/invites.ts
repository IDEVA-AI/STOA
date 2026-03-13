import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/auth";
import * as inviteService from "../services/inviteService";

const router = Router();

// Public: validate invite code
router.get("/validate/:code", (req: Request, res: Response) => {
  try {
    const result = inviteService.validateInvite(req.params.code);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: create invite
router.post("/", authMiddleware, (req: Request, res: Response) => {
  try {
    const { workspace_id, product_id, max_uses, expires_at } = req.body;
    const invite = inviteService.createInvite({
      workspace_id,
      product_id,
      created_by: req.userId!,
      max_uses,
      expires_at,
    });
    res.status(201).json(invite);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// Admin: list invites for workspace
router.get("/workspace/:workspaceId", authMiddleware, (req: Request, res: Response) => {
  try {
    const invites = inviteService.getByWorkspace(Number(req.params.workspaceId));
    res.json(invites);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: get redemptions
router.get("/:id/redemptions", authMiddleware, (req: Request, res: Response) => {
  try {
    const redemptions = inviteService.getRedemptions(Number(req.params.id));
    res.json(redemptions);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: revoke invite
router.put("/:id/revoke", authMiddleware, (req: Request, res: Response) => {
  try {
    inviteService.revokeInvite(Number(req.params.id));
    res.json({ success: true });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// Admin: delete invite
router.delete("/:id", authMiddleware, (req: Request, res: Response) => {
  try {
    inviteService.deleteInvite(Number(req.params.id));
    res.json({ success: true });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

export default router;

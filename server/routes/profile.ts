import { Router, Request, Response } from "express";
import * as profileService from "../services/profileService";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.use(authMiddleware);

router.get("/", async (req: Request, res: Response) => {
  try {
    const profile = await profileService.getProfile(req.userId!);
    res.status(200).json(profile);
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || "Internal server error" });
  }
});

router.put("/", async (req: Request, res: Response) => {
  try {
    const { name, avatar, bio, website, is_public, show_progress } = req.body;
    const profile = await profileService.updateProfile(req.userId!, { name, avatar, bio, website, is_public, show_progress });
    res.status(200).json(profile);
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || "Internal server error" });
  }
});

router.put("/password", async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await profileService.changePassword(req.userId!, currentPassword, newPassword);
    res.status(200).json(result);
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || "Internal server error" });
  }
});

export default router;

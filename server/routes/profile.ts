import { Router, Request, Response } from "express";
import * as profileService from "../services/profileService";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.use(authMiddleware);

router.get("/", (req: Request, res: Response) => {
  try {
    const profile = profileService.getProfile(req.userId!);
    res.status(200).json(profile);
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || "Internal server error" });
  }
});

router.put("/", (req: Request, res: Response) => {
  try {
    const { name, avatar, bio } = req.body;
    const profile = profileService.updateProfile(req.userId!, { name, avatar, bio });
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

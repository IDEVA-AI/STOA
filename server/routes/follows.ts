import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/auth";
import * as followRepo from "../repositories/followRepository";

const router = Router();

router.use(authMiddleware);

// Follow a user
router.post("/:userId", async (req: Request, res: Response) => {
  const targetId = parseInt(req.params.userId);
  if (targetId === req.userId) return res.status(400).json({ error: "Não é possível seguir a si mesmo" });
  const success = await followRepo.follow(req.userId!, targetId);
  res.json({ following: true, alreadyFollowing: !success });
});

// Unfollow a user
router.delete("/:userId", async (req: Request, res: Response) => {
  const targetId = parseInt(req.params.userId);
  await followRepo.unfollow(req.userId!, targetId);
  res.json({ following: false });
});

// Get counts for a user
router.get("/:userId/counts", async (req: Request, res: Response) => {
  const targetId = parseInt(req.params.userId);
  res.json({
    followers: await followRepo.getFollowerCount(targetId),
    following: await followRepo.getFollowingCount(targetId),
    isFollowing: await followRepo.isFollowing(req.userId!, targetId),
  });
});

export default router;

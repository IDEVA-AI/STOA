import { Router, Request, Response } from "express";
import * as authService from "../services/authService";
import * as passwordResetService from "../services/passwordResetService";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.post("/register", async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, inviteCode } = req.body;
    const result = await authService.register(name, email, password, phone, inviteCode);
    res.status(201).json(result);
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || "Internal server error" });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.status(200).json(result);
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || "Internal server error" });
  }
});

router.post("/refresh", async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refreshToken(refreshToken);
    res.status(200).json(result);
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || "Internal server error" });
  }
});

router.get("/me", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await authService.getMe(req.userId!);
    res.status(200).json(user);
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || "Internal server error" });
  }
});

router.post("/reset-password", async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    await passwordResetService.redeemResetToken(token, newPassword);
    res.json({ message: "Senha redefinida com sucesso" });
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || "Internal server error" });
  }
});

export default router;

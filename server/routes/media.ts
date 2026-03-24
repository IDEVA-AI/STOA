import { Router, Request, Response } from "express";
import multer from "multer";
import { authMiddleware } from "../middleware/auth";
import * as mediaService from "../services/mediaService";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

router.use(authMiddleware);

// GET / — List media
router.get("/", async (req: Request, res: Response) => {
  try {
    const { workspaceId, type, search, tags, page, limit, archived } =
      req.query;

    if (!workspaceId) {
      return res.status(400).json({ error: "workspaceId is required" });
    }

    const result = await mediaService.listMedia(Number(workspaceId), {
      type: type as string | undefined,
      search: search as string | undefined,
      tags: tags as string | undefined,
      archived: Number(archived || 0),
      page: Number(page || 1),
      limit: Number(limit || 24),
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /stats — Storage stats
router.get("/stats", async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.query;

    if (!workspaceId) {
      return res.status(400).json({ error: "workspaceId is required" });
    }

    const stats = await mediaService.getStorageStats(Number(workspaceId));
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /:id — Get single media
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const media = await mediaService.getMedia(Number(req.params.id));

    if (!media) {
      return res.status(404).json({ error: "Media not found" });
    }

    res.json(media);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST / — Upload
router.post(
  "/",
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      if (!req.body.workspaceId) {
        return res.status(400).json({ error: "workspaceId is required" });
      }

      const media = await mediaService.uploadMedia(
        req.file,
        Number(req.body.workspaceId),
        req.userId!
      );

      res.status(201).json(media);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

// POST /create-upload — Create Bunny video + return TUS credentials
router.post("/create-upload", async (req: Request, res: Response) => {
  try {
    const { name, workspaceId } = req.body;
    if (!workspaceId || !name) {
      return res.status(400).json({ error: "workspaceId and name are required" });
    }
    const result = await mediaService.createDirectUpload(name, Number(workspaceId), req.userId!);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /confirm-upload — Confirm browser upload completed
router.post("/confirm-upload", async (req: Request, res: Response) => {
  try {
    const { videoId, workspaceId, name, originalFilename, size } = req.body;
    if (!videoId || !workspaceId) {
      return res.status(400).json({ error: "videoId and workspaceId are required" });
    }
    const media = await mediaService.confirmDirectUpload({
      videoId,
      workspaceId: Number(workspaceId),
      userId: req.userId!,
      name,
      originalFilename,
      size: Number(size || 0),
    });
    res.status(201).json(media);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /:id — Update metadata
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const media = await mediaService.updateMedia(
      Number(req.params.id),
      req.body
    );
    res.json(media);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /:id — Soft delete (admin only)
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    if (req.userRole !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    await mediaService.deleteMedia(Number(req.params.id));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /:id/permanent — Hard delete (admin only)
router.delete("/:id/permanent", async (req: Request, res: Response) => {
  try {
    if (req.userRole !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    await mediaService.permanentDelete(Number(req.params.id));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /:id/restore — Restore (admin only)
router.post("/:id/restore", async (req: Request, res: Response) => {
  try {
    if (req.userRole !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    await mediaService.restoreMedia(Number(req.params.id));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

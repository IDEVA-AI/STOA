import { Router, Request, Response } from "express";
import multer from "multer";
import { authMiddleware } from "../middleware/auth";
import { saveToLocal, deleteLocal, listLocalFiles, uniqueFilename } from "../services/uploadService";

const router = Router();

// Multer configs — memory storage (buffer before saving to disk)
const uploadAny = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

const uploadImageOnly = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Apenas imagens sao aceitas (image/*)."));
    }
  },
});

// POST / — general file upload (max 50 MB)
router.post(
  "/",
  authMiddleware,
  uploadAny.single("file"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "Nenhum arquivo enviado." });
        return;
      }

      const folder = (req.body.folder as string) || "files";
      const filename = uniqueFilename(req.file.originalname);
      const url = saveToLocal(req.file.buffer, filename, folder);

      res.json({ url, filename: req.file.originalname, size: req.file.size });
    } catch (err: any) {
      console.error("[upload] error:", err.message);
      res.status(500).json({ error: err.message || "Falha no upload." });
    }
  }
);

// POST /image — image-only upload (max 10 MB)
router.post(
  "/image",
  authMiddleware,
  uploadImageOnly.single("file"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "Nenhuma imagem enviada." });
        return;
      }

      const filename = uniqueFilename(req.file.originalname);
      const url = saveToLocal(req.file.buffer, filename, "images");

      res.json({ url, filename: req.file.originalname, size: req.file.size });
    } catch (err: any) {
      console.error("[upload/image] error:", err.message);
      res.status(500).json({ error: err.message || "Falha no upload." });
    }
  }
);

// GET /library — list all uploaded files
router.get(
  "/library",
  authMiddleware,
  async (_req: Request, res: Response) => {
    try {
      const images = listLocalFiles("images").map((i) => ({ ...i, type: "image", folder: "images" }));
      const videos = listLocalFiles("videos").map((i) => ({ ...i, type: "video", folder: "videos" }));
      const files = listLocalFiles("files").map((i) => ({ ...i, type: "file", folder: "files" }));

      const all = [...images, ...videos, ...files]
        .sort((a, b) => new Date(b.lastChanged).getTime() - new Date(a.lastChanged).getTime());

      res.json(all);
    } catch (err: any) {
      console.error("[upload/library] error:", err.message);
      res.status(500).json({ error: err.message || "Falha ao listar biblioteca." });
    }
  }
);

// DELETE /:path(*) — delete file (admin only)
router.delete(
  "/:path(*)",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      if (req.userRole !== "admin") {
        res.status(403).json({ error: "Apenas administradores podem deletar arquivos." });
        return;
      }

      const filePath = req.params.path;
      if (!filePath) {
        res.status(400).json({ error: "Caminho do arquivo obrigatorio." });
        return;
      }

      deleteLocal(filePath);
      res.json({ deleted: true, path: filePath });
    } catch (err: any) {
      console.error("[upload/delete] error:", err.message);
      res.status(500).json({ error: err.message || "Falha ao deletar." });
    }
  }
);

export default router;

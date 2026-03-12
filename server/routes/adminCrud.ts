import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/auth";
import * as adminCrudService from "../services/adminCrudService";

const router = Router();

// All routes require auth + admin role
router.use(authMiddleware);
router.use((req: Request, res: Response, next) => {
  if (req.userRole !== "admin") {
    res.status(403).json({ error: "Acesso restrito a administradores." });
    return;
  }
  next();
});

// ── Courses ──────────────────────────────────────────────────────────

router.get("/courses", (_req: Request, res: Response) => {
  const courses = adminCrudService.listCourses();
  res.json(courses);
});

router.post("/courses", (req: Request, res: Response) => {
  const { title, description, thumbnail } = req.body;
  if (!title) {
    res.status(400).json({ error: "Titulo e obrigatorio." });
    return;
  }
  const id = adminCrudService.createCourse(title, description || "", thumbnail || "");
  res.status(201).json({ id });
});

router.put("/courses/:id", (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { title, description, thumbnail } = req.body;
  const updated = adminCrudService.updateCourse(id, { title, description, thumbnail });
  if (!updated) {
    res.status(404).json({ error: "Curso nao encontrado." });
    return;
  }
  res.json({ success: true });
});

router.delete("/courses/:id", (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const deleted = adminCrudService.deleteCourse(id);
  if (!deleted) {
    res.status(404).json({ error: "Curso nao encontrado." });
    return;
  }
  res.json({ success: true });
});

// ── Modules ──────────────────────────────────────────────────────────

router.post("/courses/:courseId/modules", (req: Request, res: Response) => {
  const courseId = Number(req.params.courseId);
  const { title, order } = req.body;
  if (!title) {
    res.status(400).json({ error: "Titulo e obrigatorio." });
    return;
  }
  const id = adminCrudService.createModule(courseId, title, order ?? 0);
  res.status(201).json({ id });
});

router.put("/modules/:id", (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { title, order } = req.body;
  const updated = adminCrudService.updateModule(id, { title, order });
  if (!updated) {
    res.status(404).json({ error: "Modulo nao encontrado." });
    return;
  }
  res.json({ success: true });
});

router.delete("/modules/:id", (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const deleted = adminCrudService.deleteModule(id);
  if (!deleted) {
    res.status(404).json({ error: "Modulo nao encontrado." });
    return;
  }
  res.json({ success: true });
});

// ── Lessons ──────────────────────────────────────────────────────────

router.post("/modules/:moduleId/lessons", (req: Request, res: Response) => {
  const moduleId = Number(req.params.moduleId);
  const { title, content_url, content_type, duration, order } = req.body;
  if (!title) {
    res.status(400).json({ error: "Titulo e obrigatorio." });
    return;
  }
  const id = adminCrudService.createLesson(
    moduleId,
    title,
    content_url || null,
    content_type || null,
    duration ?? null,
    order ?? 0
  );
  res.status(201).json({ id });
});

router.put("/lessons/:id", (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { title, content_url, content_type, duration, order } = req.body;
  const updated = adminCrudService.updateLesson(id, {
    title,
    content_url,
    content_type,
    duration,
    order,
  });
  if (!updated) {
    res.status(404).json({ error: "Aula nao encontrada." });
    return;
  }
  res.json({ success: true });
});

router.delete("/lessons/:id", (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const deleted = adminCrudService.deleteLesson(id);
  if (!deleted) {
    res.status(404).json({ error: "Aula nao encontrada." });
    return;
  }
  res.json({ success: true });
});

// ── Users ────────────────────────────────────────────────────────────

router.get("/users", (_req: Request, res: Response) => {
  const users = adminCrudService.listUsers();
  res.json(users);
});

router.put("/users/:id", (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { role, is_active } = req.body;
  const updated = adminCrudService.updateUser(id, { role, is_active });
  if (!updated) {
    res.status(404).json({ error: "Usuario nao encontrado." });
    return;
  }
  res.json({ success: true });
});

router.delete("/users/:id", (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const deleted = adminCrudService.softDeleteUser(id);
  if (!deleted) {
    res.status(404).json({ error: "Usuario nao encontrado." });
    return;
  }
  res.json({ success: true });
});

export default router;

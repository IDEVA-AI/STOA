# Announcement Gate Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fullscreen announcement gate that blocks the UI until users confirm pending announcements, with an admin panel for managing announcements composed of modular content blocks.

**Architecture:** Block-based announcement system. Backend: SQLite tables + Express endpoints following existing repository/service/route pattern. Frontend: Fullscreen gate wrapping the authenticated app, with modular block components for rendering content. Admin: New section in existing admin panel for CRUD + stats.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Motion, Express, better-sqlite3, Lucide Icons

---

## File Structure

### Backend (new files)
- `server/repositories/announcementRepository.ts` — SQL queries for announcements, blocks, confirmations, responses
- `server/services/announcementService.ts` — Business logic: pending calculation, frequency filtering, CRUD
- `server/routes/announcements.ts` — Express routes for user-facing and admin endpoints

### Frontend (new files)
- `src/types/announcements.ts` — TypeScript interfaces for announcements, blocks, responses
- `src/services/announcementService.ts` — API client functions
- `src/hooks/useAnnouncements.ts` — Hook for fetching pending + managing responses
- `src/components/announcements/blocks/TextBlock.tsx` — Text content block
- `src/components/announcements/blocks/ImageBlock.tsx` — Image content block
- `src/components/announcements/blocks/VideoBlock.tsx` — Video embed block
- `src/components/announcements/blocks/PollBlock.tsx` — Poll/voting block
- `src/components/announcements/blocks/FormBlock.tsx` — Form fields block
- `src/components/announcements/blocks/RatingBlock.tsx` — Star rating block
- `src/components/announcements/blocks/ActionBlock.tsx` — Navigation buttons block
- `src/components/announcements/BlockRenderer.tsx` — Switch component delegating to correct block
- `src/components/announcements/AnnouncementCard.tsx` — Single announcement container
- `src/components/announcements/AnnouncementGate.tsx` — Fullscreen modal with queue
- `src/components/admin/AdminAnnouncements.tsx` — Admin CRUD panel

### Modified files
- `server/db/schema.ts` — Add 4 new tables
- `server/db/seed.ts` — Add seed announcement for testing
- `server/index.ts` — Register announcements router
- `src/types/index.ts` — Add AdminSection 'announcements'
- `src/App.tsx` — Wrap authenticated content with AnnouncementGate
- `src/components/admin/index.ts` — Export AdminAnnouncements
- `src/pages/AdminPage.tsx` — Add announcements section
- `src/components/layout/Sidebar.tsx` — Add announcements nav item in admin

---

## Chunk 1: Database & Types

### Task 1: Add database tables

**Files:**
- Modify: `server/db/schema.ts`

- [ ] **Step 1: Add announcement tables to schema**

Add after the existing `posts` table creation in `server/db/schema.ts`:

```sql
CREATE TABLE IF NOT EXISTS announcements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  subtitle TEXT,
  mandatory INTEGER DEFAULT 1,
  frequency TEXT DEFAULT 'once',
  priority INTEGER DEFAULT 0,
  starts_at DATETIME NOT NULL,
  expires_at DATETIME,
  target TEXT DEFAULT 'all',
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS announcement_blocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  announcement_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  FOREIGN KEY(announcement_id) REFERENCES announcements(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS announcement_confirmations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  announcement_id INTEGER NOT NULL,
  confirmed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(announcement_id) REFERENCES announcements(id) ON DELETE CASCADE,
  UNIQUE(user_id, announcement_id)
);

CREATE TABLE IF NOT EXISTS announcement_responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  block_id INTEGER NOT NULL,
  response TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(block_id) REFERENCES announcement_blocks(id) ON DELETE CASCADE
);
```

- [ ] **Step 2: Delete nexus.db and restart server to recreate schema**

Run: `rm -f nexus.db && npm run dev`

Verify: Server starts without errors, new tables exist.

- [ ] **Step 3: Commit**

```bash
git add server/db/schema.ts
git commit -m "feat: add announcement tables to database schema"
```

### Task 2: Add TypeScript types

**Files:**
- Create: `src/types/announcements.ts`

- [ ] **Step 1: Create announcement types file**

```ts
export type AnnouncementFrequency = 'once' | 'daily' | 'weekly' | 'monthly' | 'every_login';

export type AnnouncementTarget = 'all' | 'new_users' | `role:${string}`;

export type BlockType = 'text' | 'image' | 'video' | 'poll' | 'form' | 'rating' | 'action';

// Block content types

export interface TextBlockContent {
  variant: 'heading' | 'paragraph' | 'list';
  text?: string;
  items?: string[];
}

export interface ImageBlockContent {
  src: string;
  alt?: string;
  caption?: string;
}

export interface VideoBlockContent {
  url: string;
  provider: 'youtube' | 'vimeo';
}

export interface PollBlockContent {
  question: string;
  options: string[];
  multiple: boolean;
  required: boolean;
}

export interface FormBlockContent {
  fields: Array<{
    label: string;
    type: 'text' | 'textarea';
    required: boolean;
  }>;
}

export interface RatingBlockContent {
  question: string;
  max: number;
  labels?: [string, string];
}

export interface ActionBlockContent {
  buttons: Array<{
    label: string;
    action: 'navigate' | 'url';
    target: string;
  }>;
}

export type BlockContent =
  | TextBlockContent
  | ImageBlockContent
  | VideoBlockContent
  | PollBlockContent
  | FormBlockContent
  | RatingBlockContent
  | ActionBlockContent;

export interface AnnouncementBlock {
  id: number;
  announcement_id: number;
  type: BlockType;
  content: BlockContent;
  order: number;
}

export interface Announcement {
  id: number;
  title: string;
  subtitle: string | null;
  mandatory: boolean;
  frequency: AnnouncementFrequency;
  priority: number;
  starts_at: string;
  expires_at: string | null;
  target: AnnouncementTarget;
  is_active: boolean;
  created_at: string;
  blocks: AnnouncementBlock[];
}

// For admin create/edit forms
export interface AnnouncementFormData {
  title: string;
  subtitle: string;
  mandatory: boolean;
  frequency: AnnouncementFrequency;
  priority: number;
  starts_at: string;
  expires_at: string;
  target: string;
  is_active: boolean;
  blocks: Array<{
    id?: number;
    type: BlockType;
    content: BlockContent;
    order: number;
  }>;
}

// Response types for interactive blocks
export type BlockResponse = {
  block_id: number;
  response: unknown;
};

// Stats for admin
export interface AnnouncementStats {
  total_confirmations: number;
  total_users: number;
  responses: Array<{
    block_id: number;
    block_type: BlockType;
    responses: Array<{
      user_id: number;
      user_name: string;
      response: unknown;
      created_at: string;
    }>;
  }>;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/announcements.ts
git commit -m "feat: add TypeScript types for announcement system"
```

---

## Chunk 2: Backend

### Task 3: Create announcement repository

**Files:**
- Create: `server/repositories/announcementRepository.ts`

- [ ] **Step 1: Create the repository file**

```ts
import db from "../db/connection";

// User-facing queries

export function getPendingAnnouncements(userId: number) {
  return db.prepare(`
    SELECT a.*
    FROM announcements a
    WHERE a.is_active = 1
      AND a.starts_at <= datetime('now')
      AND (a.expires_at IS NULL OR a.expires_at > datetime('now'))
      AND (
        a.frequency = 'every_login'
        OR (
          a.frequency = 'once'
          AND a.id NOT IN (
            SELECT announcement_id FROM announcement_confirmations WHERE user_id = ?
          )
        )
        OR (
          a.frequency = 'daily'
          AND a.id NOT IN (
            SELECT announcement_id FROM announcement_confirmations
            WHERE user_id = ? AND confirmed_at > datetime('now', '-1 day')
          )
        )
        OR (
          a.frequency = 'weekly'
          AND a.id NOT IN (
            SELECT announcement_id FROM announcement_confirmations
            WHERE user_id = ? AND confirmed_at > datetime('now', '-7 days')
          )
        )
        OR (
          a.frequency = 'monthly'
          AND a.id NOT IN (
            SELECT announcement_id FROM announcement_confirmations
            WHERE user_id = ? AND confirmed_at > datetime('now', '-30 days')
          )
        )
      )
    ORDER BY a.priority DESC, a.created_at DESC
  `).all(userId, userId, userId, userId) as any[];
}

export function getBlocksByAnnouncementId(announcementId: number) {
  return db.prepare(
    'SELECT * FROM announcement_blocks WHERE announcement_id = ? ORDER BY "order" ASC'
  ).all(announcementId) as any[];
}

export function confirmAnnouncement(userId: number, announcementId: number) {
  return db.prepare(
    "INSERT OR REPLACE INTO announcement_confirmations (user_id, announcement_id) VALUES (?, ?)"
  ).run(userId, announcementId);
}

export function saveResponse(userId: number, blockId: number, response: string) {
  return db.prepare(
    "INSERT INTO announcement_responses (user_id, block_id, response) VALUES (?, ?, ?)"
  ).run(userId, blockId, response);
}

// Admin queries

export function getAllAnnouncements() {
  return db.prepare("SELECT * FROM announcements ORDER BY created_at DESC").all() as any[];
}

export function getAnnouncementById(id: number) {
  return db.prepare("SELECT * FROM announcements WHERE id = ?").get(id) as any;
}

export function createAnnouncement(data: {
  title: string;
  subtitle: string | null;
  mandatory: number;
  frequency: string;
  priority: number;
  starts_at: string;
  expires_at: string | null;
  target: string;
  is_active: number;
}) {
  return db.prepare(`
    INSERT INTO announcements (title, subtitle, mandatory, frequency, priority, starts_at, expires_at, target, is_active)
    VALUES (@title, @subtitle, @mandatory, @frequency, @priority, @starts_at, @expires_at, @target, @is_active)
  `).run(data);
}

export function updateAnnouncement(id: number, data: {
  title: string;
  subtitle: string | null;
  mandatory: number;
  frequency: string;
  priority: number;
  starts_at: string;
  expires_at: string | null;
  target: string;
  is_active: number;
}) {
  return db.prepare(`
    UPDATE announcements
    SET title = @title, subtitle = @subtitle, mandatory = @mandatory, frequency = @frequency,
        priority = @priority, starts_at = @starts_at, expires_at = @expires_at,
        target = @target, is_active = @is_active
    WHERE id = @id
  `).run({ ...data, id });
}

export function deleteAnnouncement(id: number) {
  return db.prepare("DELETE FROM announcements WHERE id = ?").run(id);
}

export function deleteBlocksByAnnouncementId(announcementId: number) {
  return db.prepare("DELETE FROM announcement_blocks WHERE announcement_id = ?").run(announcementId);
}

export function insertBlock(data: {
  announcement_id: number;
  type: string;
  content: string;
  order: number;
}) {
  return db.prepare(`
    INSERT INTO announcement_blocks (announcement_id, type, content, "order")
    VALUES (@announcement_id, @type, @content, @order)
  `).run(data);
}

export function getAnnouncementConfirmations(announcementId: number) {
  return db.prepare(`
    SELECT ac.*, u.name as user_name
    FROM announcement_confirmations ac
    JOIN users u ON ac.user_id = u.id
    WHERE ac.announcement_id = ?
    ORDER BY ac.confirmed_at DESC
  `).all(announcementId) as any[];
}

export function getBlockResponses(announcementId: number) {
  return db.prepare(`
    SELECT ar.*, ab.type as block_type, u.name as user_name
    FROM announcement_responses ar
    JOIN announcement_blocks ab ON ar.block_id = ab.id
    JOIN users u ON ar.user_id = u.id
    WHERE ab.announcement_id = ?
    ORDER BY ar.created_at DESC
  `).all(announcementId) as any[];
}

export function getTotalUsers() {
  const result = db.prepare("SELECT COUNT(*) as count FROM users").get() as any;
  return result.count;
}
```

- [ ] **Step 2: Commit**

```bash
git add server/repositories/announcementRepository.ts
git commit -m "feat: add announcement repository with SQL queries"
```

### Task 4: Create announcement service

**Files:**
- Create: `server/services/announcementService.ts`

- [ ] **Step 1: Create the service file**

```ts
import * as announcementRepo from "../repositories/announcementRepository";

export function getPendingForUser(userId: number) {
  const announcements = announcementRepo.getPendingAnnouncements(userId);
  return announcements.map((a: any) => {
    const blocks = announcementRepo.getBlocksByAnnouncementId(a.id);
    return {
      ...a,
      mandatory: Boolean(a.mandatory),
      is_active: Boolean(a.is_active),
      blocks: blocks.map((b: any) => ({
        ...b,
        content: JSON.parse(b.content),
      })),
    };
  });
}

export function confirm(userId: number, announcementId: number) {
  return announcementRepo.confirmAnnouncement(userId, announcementId);
}

export function saveResponses(userId: number, announcementId: number, responses: Array<{ block_id: number; response: unknown }>) {
  for (const r of responses) {
    announcementRepo.saveResponse(userId, r.block_id, JSON.stringify(r.response));
  }
}

export function listAll() {
  const announcements = announcementRepo.getAllAnnouncements();
  return announcements.map((a: any) => {
    const blocks = announcementRepo.getBlocksByAnnouncementId(a.id);
    return {
      ...a,
      mandatory: Boolean(a.mandatory),
      is_active: Boolean(a.is_active),
      blocks: blocks.map((b: any) => ({
        ...b,
        content: JSON.parse(b.content),
      })),
    };
  });
}

export function getById(id: number) {
  const a = announcementRepo.getAnnouncementById(id);
  if (!a) return null;
  const blocks = announcementRepo.getBlocksByAnnouncementId(a.id);
  return {
    ...a,
    mandatory: Boolean(a.mandatory),
    is_active: Boolean(a.is_active),
    blocks: blocks.map((b: any) => ({
      ...b,
      content: JSON.parse(b.content),
    })),
  };
}

export function create(data: {
  title: string;
  subtitle?: string;
  mandatory?: boolean;
  frequency?: string;
  priority?: number;
  starts_at: string;
  expires_at?: string;
  target?: string;
  is_active?: boolean;
  blocks: Array<{ type: string; content: unknown; order: number }>;
}) {
  const result = announcementRepo.createAnnouncement({
    title: data.title,
    subtitle: data.subtitle || null,
    mandatory: data.mandatory !== false ? 1 : 0,
    frequency: data.frequency || "once",
    priority: data.priority || 0,
    starts_at: data.starts_at,
    expires_at: data.expires_at || null,
    target: data.target || "all",
    is_active: data.is_active !== false ? 1 : 0,
  });

  const announcementId = Number(result.lastInsertRowid);

  for (const block of data.blocks) {
    announcementRepo.insertBlock({
      announcement_id: announcementId,
      type: block.type,
      content: JSON.stringify(block.content),
      order: block.order,
    });
  }

  return getById(announcementId);
}

export function update(id: number, data: {
  title: string;
  subtitle?: string;
  mandatory?: boolean;
  frequency?: string;
  priority?: number;
  starts_at: string;
  expires_at?: string;
  target?: string;
  is_active?: boolean;
  blocks: Array<{ type: string; content: unknown; order: number }>;
}) {
  announcementRepo.updateAnnouncement(id, {
    title: data.title,
    subtitle: data.subtitle || null,
    mandatory: data.mandatory !== false ? 1 : 0,
    frequency: data.frequency || "once",
    priority: data.priority || 0,
    starts_at: data.starts_at,
    expires_at: data.expires_at || null,
    target: data.target || "all",
    is_active: data.is_active !== false ? 1 : 0,
  });

  // Replace blocks: delete old, insert new
  announcementRepo.deleteBlocksByAnnouncementId(id);
  for (const block of data.blocks) {
    announcementRepo.insertBlock({
      announcement_id: id,
      type: block.type,
      content: JSON.stringify(block.content),
      order: block.order,
    });
  }

  return getById(id);
}

export function remove(id: number) {
  return announcementRepo.deleteAnnouncement(id);
}

export function getStats(announcementId: number) {
  const confirmations = announcementRepo.getAnnouncementConfirmations(announcementId);
  const responses = announcementRepo.getBlockResponses(announcementId);
  const totalUsers = announcementRepo.getTotalUsers();

  // Group responses by block_id
  const blockResponses = new Map<number, any[]>();
  for (const r of responses) {
    const arr = blockResponses.get(r.block_id) || [];
    arr.push({
      user_id: r.user_id,
      user_name: r.user_name,
      response: JSON.parse(r.response),
      created_at: r.created_at,
    });
    blockResponses.set(r.block_id, arr);
  }

  return {
    total_confirmations: confirmations.length,
    total_users: totalUsers,
    responses: Array.from(blockResponses.entries()).map(([blockId, resps]) => ({
      block_id: blockId,
      block_type: resps[0]?.block_type,
      responses: resps,
    })),
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add server/services/announcementService.ts
git commit -m "feat: add announcement service with business logic"
```

### Task 5: Create announcement routes

**Files:**
- Create: `server/routes/announcements.ts`
- Modify: `server/index.ts`

- [ ] **Step 1: Create the routes file**

```ts
import { Router } from "express";
import * as announcementService from "../services/announcementService";

const router = Router();

// User-facing: get pending announcements
// userId passed as query param (no auth system yet, uses ?userId=1)
router.get("/pending", (req, res) => {
  const userId = Number(req.query.userId) || 1;
  const announcements = announcementService.getPendingForUser(userId);
  res.json(announcements);
});

// User-facing: confirm an announcement
router.post("/:id/confirm", (req, res) => {
  const id = Number(req.params.id);
  const userId = Number(req.body.userId) || 1;
  announcementService.confirm(userId, id);
  res.json({ success: true });
});

// User-facing: send responses for blocks
router.post("/:id/respond", (req, res) => {
  const id = Number(req.params.id);
  const userId = Number(req.body.userId) || 1;
  const { responses } = req.body;
  if (responses && Array.isArray(responses)) {
    announcementService.saveResponses(userId, id, responses);
  }
  res.json({ success: true });
});

// Admin: list all
router.get("/admin", (req, res) => {
  const announcements = announcementService.listAll();
  res.json(announcements);
});

// Admin: get one
router.get("/admin/:id", (req, res) => {
  const id = Number(req.params.id);
  const announcement = announcementService.getById(id);
  if (!announcement) return res.status(404).json({ error: "Not found" });
  res.json(announcement);
});

// Admin: create
router.post("/admin", (req, res) => {
  const announcement = announcementService.create(req.body);
  res.json(announcement);
});

// Admin: update
router.put("/admin/:id", (req, res) => {
  const id = Number(req.params.id);
  const announcement = announcementService.update(id, req.body);
  res.json(announcement);
});

// Admin: delete
router.delete("/admin/:id", (req, res) => {
  const id = Number(req.params.id);
  announcementService.remove(id);
  res.json({ success: true });
});

// Admin: stats
router.get("/admin/:id/stats", (req, res) => {
  const id = Number(req.params.id);
  const stats = announcementService.getStats(id);
  res.json(stats);
});

export default router;
```

- [ ] **Step 2: Register router in server/index.ts**

Add import:
```ts
import announcementsRouter from "./routes/announcements";
```

Add route after existing routes:
```ts
app.use("/api/announcements", announcementsRouter);
```

- [ ] **Step 3: Add seed announcement for testing**

In `server/db/seed.ts`, add after existing seeds:

```ts
// Seed announcement
const existingAnnouncement = db.prepare("SELECT id FROM announcements LIMIT 1").get();
if (!existingAnnouncement) {
  const result = db.prepare(`
    INSERT INTO announcements (title, subtitle, mandatory, frequency, priority, starts_at, target, is_active)
    VALUES ('Bem-vindo ao STOA', 'Sua jornada de transformacao comeca aqui.', 1, 'once', 10, datetime('now'), 'all', 1)
  `).run();

  const announcementId = result.lastInsertRowid;

  db.prepare(`INSERT INTO announcement_blocks (announcement_id, type, content, "order") VALUES (?, 'text', ?, 1)`)
    .run(announcementId, JSON.stringify({ variant: "heading", text: "A estrutura precede o sucesso." }));

  db.prepare(`INSERT INTO announcement_blocks (announcement_id, type, content, "order") VALUES (?, 'text', ?, 2)`)
    .run(announcementId, JSON.stringify({ variant: "paragraph", text: "O STOA e o seu espaco para construir sistemas organizacionais solidos. Aqui voce encontra cursos, comunidade e ferramentas para transformar a forma como voce opera." }));

  db.prepare(`INSERT INTO announcement_blocks (announcement_id, type, content, "order") VALUES (?, 'poll', ?, 3)`)
    .run(announcementId, JSON.stringify({ question: "O que te trouxe ate aqui?", options: ["Cursos", "Comunidade", "Mentoria", "Curiosidade"], multiple: false, required: true }));

  db.prepare(`INSERT INTO announcement_blocks (announcement_id, type, content, "order") VALUES (?, 'action', ?, 4)`)
    .run(announcementId, JSON.stringify({ buttons: [{ label: "Explorar Cursos", action: "navigate", target: "courses" }] }));
}
```

- [ ] **Step 4: Delete nexus.db and restart to verify**

Run: `rm -f nexus.db && npm run dev`

Test: `curl http://localhost:4747/api/announcements/pending?userId=1`

Expected: JSON array with one announcement containing 4 blocks.

- [ ] **Step 5: Commit**

```bash
git add server/routes/announcements.ts server/index.ts server/db/seed.ts
git commit -m "feat: add announcement API routes and seed data"
```

---

## Chunk 3: Frontend Service & Hook

### Task 6: Create frontend API service

**Files:**
- Create: `src/services/announcementService.ts`

- [ ] **Step 1: Create the service file**

```ts
import type { Announcement, AnnouncementFormData, AnnouncementStats, BlockResponse } from '../types/announcements';

const USER_ID = 1; // Hardcoded until auth is real

export async function getPendingAnnouncements(): Promise<Announcement[]> {
  const res = await fetch(`/api/announcements/pending?userId=${USER_ID}`);
  if (!res.ok) throw new Error('Falha ao carregar avisos.');
  return res.json();
}

export async function confirmAnnouncement(announcementId: number): Promise<void> {
  await fetch(`/api/announcements/${announcementId}/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: USER_ID }),
  });
}

export async function sendResponses(announcementId: number, responses: BlockResponse[]): Promise<void> {
  await fetch(`/api/announcements/${announcementId}/respond`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: USER_ID, responses }),
  });
}

// Admin

export async function getAllAnnouncements(): Promise<Announcement[]> {
  const res = await fetch('/api/announcements/admin');
  if (!res.ok) throw new Error('Falha ao carregar avisos.');
  return res.json();
}

export async function getAnnouncement(id: number): Promise<Announcement> {
  const res = await fetch(`/api/announcements/admin/${id}`);
  if (!res.ok) throw new Error('Aviso nao encontrado.');
  return res.json();
}

export async function createAnnouncement(data: AnnouncementFormData): Promise<Announcement> {
  const res = await fetch('/api/announcements/admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Falha ao criar aviso.');
  return res.json();
}

export async function updateAnnouncement(id: number, data: AnnouncementFormData): Promise<Announcement> {
  const res = await fetch(`/api/announcements/admin/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Falha ao atualizar aviso.');
  return res.json();
}

export async function deleteAnnouncement(id: number): Promise<void> {
  await fetch(`/api/announcements/admin/${id}`, { method: 'DELETE' });
}

export async function getAnnouncementStats(id: number): Promise<AnnouncementStats> {
  const res = await fetch(`/api/announcements/admin/${id}/stats`);
  if (!res.ok) throw new Error('Falha ao carregar estatisticas.');
  return res.json();
}
```

- [ ] **Step 2: Commit**

```bash
git add src/services/announcementService.ts
git commit -m "feat: add announcement API service"
```

### Task 7: Create useAnnouncements hook

**Files:**
- Create: `src/hooks/useAnnouncements.ts`

- [ ] **Step 1: Create the hook file**

```ts
import { useState, useEffect, useCallback } from 'react';
import type { Announcement, BlockResponse } from '../types/announcements';
import * as announcementApi from '../services/announcementService';

export function useAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<Map<number, unknown>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);

  const fetchPending = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await announcementApi.getPendingAnnouncements();
      setAnnouncements(data);
      setCurrentIndex(0);
      setResponses(new Map());
    } catch (err) {
      console.error('Failed to fetch announcements:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const currentAnnouncement = announcements[currentIndex] ?? null;

  const setResponse = useCallback((blockId: number, value: unknown) => {
    setResponses(prev => {
      const next = new Map(prev);
      next.set(blockId, value);
      return next;
    });
  }, []);

  const isCurrentComplete = useCallback(() => {
    if (!currentAnnouncement) return true;
    // Check all required interactive blocks have responses
    for (const block of currentAnnouncement.blocks) {
      if (block.type === 'poll') {
        const content = block.content as { required?: boolean };
        if (content.required && !responses.has(block.id)) return false;
      }
      if (block.type === 'form') {
        const content = block.content as { fields: Array<{ required: boolean }> };
        const formResponse = responses.get(block.id) as Record<string, string> | undefined;
        for (let i = 0; i < content.fields.length; i++) {
          if (content.fields[i].required && (!formResponse || !formResponse[String(i)]?.trim())) {
            return false;
          }
        }
      }
      if (block.type === 'rating') {
        const content = block.content as { question: string };
        if (content.question && !responses.has(block.id)) return false;
      }
    }
    return true;
  }, [currentAnnouncement, responses]);

  const confirm = useCallback(async () => {
    if (!currentAnnouncement) return;
    setIsConfirming(true);
    try {
      // Send responses for interactive blocks
      const blockResponses: BlockResponse[] = [];
      for (const [blockId, value] of responses) {
        if (currentAnnouncement.blocks.some(b => b.id === blockId)) {
          blockResponses.push({ block_id: blockId, response: value });
        }
      }
      if (blockResponses.length > 0) {
        await announcementApi.sendResponses(currentAnnouncement.id, blockResponses);
      }
      await announcementApi.confirmAnnouncement(currentAnnouncement.id);

      // Advance to next or finish
      if (currentIndex < announcements.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setResponses(new Map());
      } else {
        setAnnouncements([]);
      }
    } catch (err) {
      console.error('Failed to confirm announcement:', err);
    } finally {
      setIsConfirming(false);
    }
  }, [currentAnnouncement, currentIndex, announcements.length, responses]);

  return {
    announcements,
    currentAnnouncement,
    currentIndex,
    totalCount: announcements.length,
    responses,
    setResponse,
    isCurrentComplete: isCurrentComplete(),
    confirm,
    isLoading,
    isConfirming,
    isComplete: !isLoading && announcements.length === 0,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useAnnouncements.ts
git commit -m "feat: add useAnnouncements hook"
```

---

## Chunk 4: Block Components

### Task 8: Create block components

**Files:**
- Create: `src/components/announcements/blocks/TextBlock.tsx`
- Create: `src/components/announcements/blocks/ImageBlock.tsx`
- Create: `src/components/announcements/blocks/VideoBlock.tsx`
- Create: `src/components/announcements/blocks/PollBlock.tsx`
- Create: `src/components/announcements/blocks/FormBlock.tsx`
- Create: `src/components/announcements/blocks/RatingBlock.tsx`
- Create: `src/components/announcements/blocks/ActionBlock.tsx`

All block components receive `content` (typed per block) and interactive ones receive `value` + `onChange`.

- [ ] **Step 1: Create TextBlock**

```tsx
import type { TextBlockContent } from '@/src/types/announcements';

interface TextBlockProps {
  content: TextBlockContent;
}

export default function TextBlock({ content }: TextBlockProps) {
  if (content.variant === 'heading') {
    return (
      <h2 className="font-serif text-3xl md:text-4xl font-black tracking-tight leading-tight">
        {content.text}
      </h2>
    );
  }

  if (content.variant === 'list' && content.items) {
    return (
      <ul className="space-y-3">
        {content.items.map((item, i) => (
          <li key={i} className="flex items-start gap-3 text-warm-gray">
            <span className="w-1.5 h-1.5 rounded-full bg-gold mt-2 shrink-0" />
            <span className="text-sm leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <p className="text-warm-gray text-sm md:text-base leading-relaxed">
      {content.text}
    </p>
  );
}
```

- [ ] **Step 2: Create ImageBlock**

```tsx
import type { ImageBlockContent } from '@/src/types/announcements';

interface ImageBlockProps {
  content: ImageBlockContent;
}

export default function ImageBlock({ content }: ImageBlockProps) {
  return (
    <figure className="space-y-3">
      <div className="overflow-hidden border border-line">
        <img
          src={content.src}
          alt={content.alt || ''}
          className="w-full h-auto object-cover"
        />
      </div>
      {content.caption && (
        <figcaption className="mono-label text-[10px] text-warm-gray/60">
          {content.caption}
        </figcaption>
      )}
    </figure>
  );
}
```

- [ ] **Step 3: Create VideoBlock**

```tsx
import type { VideoBlockContent } from '@/src/types/announcements';

interface VideoBlockProps {
  content: VideoBlockContent;
}

function getEmbedUrl(url: string, provider: string): string {
  if (provider === 'youtube') {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^&?/]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : url;
  }
  if (provider === 'vimeo') {
    const match = url.match(/vimeo\.com\/(\d+)/);
    return match ? `https://player.vimeo.com/video/${match[1]}` : url;
  }
  return url;
}

export default function VideoBlock({ content }: VideoBlockProps) {
  const embedUrl = getEmbedUrl(content.url, content.provider);

  return (
    <div className="aspect-video border border-line overflow-hidden">
      <iframe
        src={embedUrl}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Video"
      />
    </div>
  );
}
```

- [ ] **Step 4: Create PollBlock**

```tsx
import { cn } from '@/src/lib/utils';
import type { PollBlockContent } from '@/src/types/announcements';

interface PollBlockProps {
  content: PollBlockContent;
  value: string[] | undefined;
  onChange: (value: string[]) => void;
}

export default function PollBlock({ content, value = [], onChange }: PollBlockProps) {
  const selected = value;

  function toggle(option: string) {
    if (content.multiple) {
      const next = selected.includes(option)
        ? selected.filter(s => s !== option)
        : [...selected, option];
      onChange(next);
    } else {
      onChange([option]);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-bold">
        {content.question}
        {content.required && <span className="text-gold ml-1">*</span>}
      </p>
      <div className="space-y-2">
        {content.options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            className={cn(
              'w-full text-left px-5 py-3.5 border text-sm transition-all duration-300',
              selected.includes(option)
                ? 'border-gold bg-gold/5 text-text font-medium'
                : 'border-line hover:border-warm-gray/40 text-warm-gray'
            )}
          >
            <span className="flex items-center gap-3">
              <span className={cn(
                'w-4 h-4 border shrink-0 flex items-center justify-center transition-colors',
                content.multiple ? 'rounded-sm' : 'rounded-full',
                selected.includes(option) ? 'border-gold bg-gold' : 'border-line'
              )}>
                {selected.includes(option) && (
                  <span className="w-2 h-2 bg-paper rounded-full" />
                )}
              </span>
              {option}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create FormBlock**

```tsx
import type { FormBlockContent } from '@/src/types/announcements';

interface FormBlockProps {
  content: FormBlockContent;
  value: Record<string, string> | undefined;
  onChange: (value: Record<string, string>) => void;
}

export default function FormBlock({ content, value = {}, onChange }: FormBlockProps) {
  function handleChange(index: number, text: string) {
    onChange({ ...value, [String(index)]: text });
  }

  return (
    <div className="space-y-5">
      {content.fields.map((field, i) => (
        <div key={i} className="space-y-2">
          <label className="mono-label text-[10px] text-warm-gray">
            {field.label}
            {field.required && <span className="text-gold ml-1">*</span>}
          </label>
          {field.type === 'textarea' ? (
            <textarea
              value={value[String(i)] || ''}
              onChange={(e) => handleChange(i, e.target.value)}
              rows={3}
              className="w-full bg-bg border border-line px-4 py-3 focus:border-gold focus:ring-1 focus:ring-gold/20 focus:outline-none transition-all text-sm resize-none"
            />
          ) : (
            <input
              type="text"
              value={value[String(i)] || ''}
              onChange={(e) => handleChange(i, e.target.value)}
              className="w-full bg-bg border border-line px-4 py-3 focus:border-gold focus:ring-1 focus:ring-gold/20 focus:outline-none transition-all text-sm"
            />
          )}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 6: Create RatingBlock**

```tsx
import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import type { RatingBlockContent } from '@/src/types/announcements';

interface RatingBlockProps {
  content: RatingBlockContent;
  value: number | undefined;
  onChange: (value: number) => void;
}

export default function RatingBlock({ content, value, onChange }: RatingBlockProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const display = hovered ?? value ?? 0;

  return (
    <div className="space-y-4">
      <p className="text-sm font-bold">{content.question}</p>
      <div className="flex items-center gap-1">
        {Array.from({ length: content.max }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onChange(n)}
            className="p-1 transition-transform hover:scale-110"
          >
            <Star
              size={28}
              className={cn(
                'transition-colors duration-200',
                n <= display ? 'fill-gold text-gold' : 'text-line'
              )}
            />
          </button>
        ))}
      </div>
      {content.labels && (
        <div className="flex justify-between">
          <span className="mono-label text-[9px] text-warm-gray/60">{content.labels[0]}</span>
          <span className="mono-label text-[9px] text-warm-gray/60">{content.labels[1]}</span>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 7: Create ActionBlock**

```tsx
import { ArrowRight } from 'lucide-react';
import type { ActionBlockContent } from '@/src/types/announcements';

interface ActionBlockProps {
  content: ActionBlockContent;
  onNavigate?: (target: string) => void;
}

export default function ActionBlock({ content, onNavigate }: ActionBlockProps) {
  function handleClick(button: ActionBlockContent['buttons'][0]) {
    if (button.action === 'navigate' && onNavigate) {
      onNavigate(button.target);
    } else if (button.action === 'url') {
      window.open(button.target, '_blank', 'noopener');
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      {content.buttons.map((button, i) => (
        <button
          key={i}
          type="button"
          onClick={() => handleClick(button)}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gold/10 text-gold text-sm font-bold tracking-tight hover:bg-gold/20 transition-colors duration-300"
        >
          {button.label}
          <ArrowRight size={14} />
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 8: Commit**

```bash
git add src/components/announcements/blocks/
git commit -m "feat: add announcement block components"
```

---

## Chunk 5: Gate Components

### Task 9: Create BlockRenderer

**Files:**
- Create: `src/components/announcements/BlockRenderer.tsx`

- [ ] **Step 1: Create the file**

```tsx
import type { AnnouncementBlock, BlockContent } from '@/src/types/announcements';
import TextBlock from './blocks/TextBlock';
import ImageBlock from './blocks/ImageBlock';
import VideoBlock from './blocks/VideoBlock';
import PollBlock from './blocks/PollBlock';
import FormBlock from './blocks/FormBlock';
import RatingBlock from './blocks/RatingBlock';
import ActionBlock from './blocks/ActionBlock';

interface BlockRendererProps {
  block: AnnouncementBlock;
  value?: unknown;
  onChange?: (value: unknown) => void;
  onNavigate?: (target: string) => void;
}

export default function BlockRenderer({ block, value, onChange, onNavigate }: BlockRendererProps) {
  switch (block.type) {
    case 'text':
      return <TextBlock content={block.content as any} />;
    case 'image':
      return <ImageBlock content={block.content as any} />;
    case 'video':
      return <VideoBlock content={block.content as any} />;
    case 'poll':
      return <PollBlock content={block.content as any} value={value as string[] | undefined} onChange={v => onChange?.(v)} />;
    case 'form':
      return <FormBlock content={block.content as any} value={value as Record<string, string> | undefined} onChange={v => onChange?.(v)} />;
    case 'rating':
      return <RatingBlock content={block.content as any} value={value as number | undefined} onChange={v => onChange?.(v)} />;
    case 'action':
      return <ActionBlock content={block.content as any} onNavigate={onNavigate} />;
    default:
      return null;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/announcements/BlockRenderer.tsx
git commit -m "feat: add BlockRenderer switch component"
```

### Task 10: Create AnnouncementCard

**Files:**
- Create: `src/components/announcements/AnnouncementCard.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { motion } from 'motion/react';
import BlockRenderer from './BlockRenderer';
import type { Announcement } from '@/src/types/announcements';

interface AnnouncementCardProps {
  announcement: Announcement;
  responses: Map<number, unknown>;
  onSetResponse: (blockId: number, value: unknown) => void;
  onNavigate?: (target: string) => void;
}

export default function AnnouncementCard({ announcement, responses, onSetResponse, onNavigate }: AnnouncementCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-2xl mx-auto"
    >
      {/* Header */}
      <div className="mb-10 space-y-3">
        <h1 className="font-serif text-4xl md:text-5xl font-black tracking-tight leading-none">
          {announcement.title}
        </h1>
        {announcement.subtitle && (
          <p className="text-warm-gray text-base md:text-lg">
            {announcement.subtitle}
          </p>
        )}
      </div>

      {/* Blocks */}
      <div className="space-y-8">
        {announcement.blocks.map((block) => (
          <BlockRenderer
            key={block.id}
            block={block}
            value={responses.get(block.id)}
            onChange={(value) => onSetResponse(block.id, value)}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/announcements/AnnouncementCard.tsx
git commit -m "feat: add AnnouncementCard component"
```

### Task 11: Create AnnouncementGate

**Files:**
- Create: `src/components/announcements/AnnouncementGate.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useAnnouncements } from '@/src/hooks/useAnnouncements';
import AnnouncementCard from './AnnouncementCard';

interface AnnouncementGateProps {
  children: ReactNode;
  onNavigate?: (target: string) => void;
}

export default function AnnouncementGate({ children, onNavigate }: AnnouncementGateProps) {
  const {
    currentAnnouncement,
    currentIndex,
    totalCount,
    responses,
    setResponse,
    isCurrentComplete,
    confirm,
    isLoading,
    isConfirming,
    isComplete,
  } = useAnnouncements();

  // Loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-bg flex items-center justify-center z-50">
        <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // No pending announcements — render app
  if (isComplete) {
    return <>{children}</>;
  }

  const isLast = currentIndex === totalCount - 1;

  return (
    <div className="fixed inset-0 bg-bg z-50 flex flex-col">
      {/* Progress bar */}
      {totalCount > 1 && (
        <div className="w-full px-8 pt-8">
          <div className="flex items-center justify-between mb-3">
            <span className="mono-label text-[10px] text-warm-gray/60">
              {currentIndex + 1} de {totalCount}
            </span>
          </div>
          <div className="w-full h-1 bg-line/30 overflow-hidden">
            <motion.div
              className="h-full bg-gold"
              initial={{ width: 0 }}
              animate={{ width: `${((currentIndex + 1) / totalCount) * 100}%` }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 overflow-y-auto px-8 py-12 md:py-20">
        <AnimatePresence mode="wait">
          {currentAnnouncement && (
            <AnnouncementCard
              key={currentAnnouncement.id}
              announcement={currentAnnouncement}
              responses={responses}
              onSetResponse={setResponse}
              onNavigate={onNavigate}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Footer with confirm button */}
      <div className="border-t border-line px-8 py-6 flex items-center justify-between">
        <div className="mono-label text-[9px] text-warm-gray/40">
          {currentAnnouncement?.mandatory ? 'Confirmacao obrigatoria' : 'Voce pode pular este aviso'}
        </div>

        <div className="flex items-center gap-4">
          {!currentAnnouncement?.mandatory && (
            <button
              onClick={confirm}
              disabled={isConfirming}
              className="text-sm text-warm-gray hover:text-text transition-colors"
            >
              Pular
            </button>
          )}

          <button
            onClick={confirm}
            disabled={(currentAnnouncement?.mandatory && !isCurrentComplete) || isConfirming}
            className={cn(
              'inline-flex items-center gap-3 px-8 py-3.5 font-bold text-sm tracking-tight transition-all duration-300',
              isCurrentComplete
                ? 'bg-gold text-paper hover:brightness-110 shadow-lg shadow-gold/20'
                : 'bg-line/30 text-warm-gray/40 cursor-not-allowed'
            )}
          >
            {isConfirming ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Check size={16} />
            )}
            {isLast ? 'Confirmar e Entrar' : 'Confirmar e Continuar'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/announcements/AnnouncementGate.tsx
git commit -m "feat: add AnnouncementGate fullscreen component"
```

---

## Chunk 6: App Integration

### Task 12: Wire AnnouncementGate into App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add import and wrap authenticated content**

In `src/App.tsx`, add import:
```ts
import AnnouncementGate from './components/announcements/AnnouncementGate';
```

In the `AppContent` component, after the `if (!isAuthenticated)` check and before the `if (selectedCourse)` check, wrap the remaining return in AnnouncementGate.

The authenticated part of AppContent should become:

```tsx
return (
  <AnnouncementGate onNavigate={(target) => setActiveTab(target as TabId)}>
    {selectedCourse ? (
      <LessonPlayerPage
        selectedCourse={selectedCourse}
        courseContent={courseContent}
        selectedLesson={selectedLesson}
        courseError={courseError}
        onBack={exitCourse}
        onSelectLesson={selectLesson}
        onToggleLessonCompletion={toggleLessonCompletion}
      />
    ) : (
      <div className="flex h-screen overflow-hidden font-sans transition-colors duration-500 bg-bg text-text">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          adminSection={adminSection}
          setAdminSection={setAdminSection}
          theme={theme}
          setTheme={setTheme}
          onLogout={logout}
        />
        <main className="flex-1 overflow-y-auto relative bg-bg transition-colors duration-500">
          <Header setActiveTab={setActiveTab} />
          <div className="p-10 max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              {activeTab === 'dashboard' && (
                <DashboardPage courses={courses} posts={posts} onEnterCourse={enterCourse} setActiveTab={setActiveTab} />
              )}
              {activeTab === 'courses' && (
                <CoursesPage courses={courses} onEnterCourse={enterCourse} />
              )}
              {activeTab === 'community' && (
                <CommunityPage posts={posts} newPost={newPost} setNewPost={setNewPost} onPostSubmit={submitPost} />
              )}
              {activeTab === 'admin' && <AdminPage adminSection={adminSection} />}
              {activeTab === 'messages' && <MessagesPage />}
              {activeTab === 'profile' && <ProfilePage />}
              {activeTab === 'design-system' && <DesignSystemPage />}
            </AnimatePresence>
          </div>
        </main>
      </div>
    )}
  </AnnouncementGate>
);
```

Remove the separate `if (selectedCourse)` early return since it's now inside the gate.

- [ ] **Step 2: Verify the app compiles and runs**

Run: `npm run dev`

Expected: App starts, shows fullscreen announcement gate with seed data on login.

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: integrate AnnouncementGate into app flow"
```

---

## Chunk 7: Admin Panel

### Task 13: Add 'announcements' to AdminSection type

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Update AdminSection type**

Change:
```ts
export type AdminSection = 'dashboard' | 'communities' | 'courses' | 'media' | 'integrations' | 'unlocks' | 'moderation' | 'settings';
```
To:
```ts
export type AdminSection = 'dashboard' | 'communities' | 'courses' | 'announcements' | 'media' | 'integrations' | 'unlocks' | 'moderation' | 'settings';
```

- [ ] **Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add announcements to AdminSection type"
```

### Task 14: Create AdminAnnouncements component

**Files:**
- Create: `src/components/admin/AdminAnnouncements.tsx`
- Modify: `src/components/admin/index.ts`

- [ ] **Step 1: Create the admin component**

This is the largest component. It has three views:
1. **List** — table of all announcements with status badges
2. **Form** — create/edit with block editor
3. **Stats** — confirmation counts and response data

```tsx
import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, BarChart3, ArrowLeft, ChevronUp, ChevronDown, X } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Button, Badge, Card, CardBody, Input, Textarea, Toggle, FormGroup } from '../ui';
import * as announcementApi from '@/src/services/announcementService';
import type { Announcement, AnnouncementFormData, AnnouncementStats, BlockType, BlockContent } from '@/src/types/announcements';

type View = 'list' | 'form' | 'stats';

const FREQUENCY_LABELS: Record<string, string> = {
  once: 'Uma vez',
  daily: 'Diario',
  weekly: 'Semanal',
  monthly: 'Mensal',
  every_login: 'Todo login',
};

const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  text: 'Texto',
  image: 'Imagem',
  video: 'Video',
  poll: 'Enquete',
  form: 'Formulario',
  rating: 'Avaliacao',
  action: 'Acao',
};

function emptyBlockContent(type: BlockType): BlockContent {
  switch (type) {
    case 'text': return { variant: 'paragraph', text: '' };
    case 'image': return { src: '', alt: '' };
    case 'video': return { url: '', provider: 'youtube' };
    case 'poll': return { question: '', options: ['', ''], multiple: false, required: true };
    case 'form': return { fields: [{ label: '', type: 'text', required: false }] };
    case 'rating': return { question: '', max: 5, labels: ['Ruim', 'Excelente'] };
    case 'action': return { buttons: [{ label: '', action: 'navigate', target: 'dashboard' }] };
  }
}

function emptyForm(): AnnouncementFormData {
  return {
    title: '',
    subtitle: '',
    mandatory: true,
    frequency: 'once',
    priority: 0,
    starts_at: new Date().toISOString().slice(0, 16),
    expires_at: '',
    target: 'all',
    is_active: true,
    blocks: [],
  };
}

export default function AdminAnnouncements() {
  const [view, setView] = useState<View>('list');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<AnnouncementFormData>(emptyForm());
  const [stats, setStats] = useState<AnnouncementStats | null>(null);
  const [statsFor, setStatsFor] = useState<Announcement | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const data = await announcementApi.getAllAnnouncements();
      setAnnouncements(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setView('form');
  }

  function startEdit(a: Announcement) {
    setEditingId(a.id);
    setForm({
      title: a.title,
      subtitle: a.subtitle || '',
      mandatory: a.mandatory,
      frequency: a.frequency,
      priority: a.priority,
      starts_at: a.starts_at.replace(' ', 'T').slice(0, 16),
      expires_at: a.expires_at ? a.expires_at.replace(' ', 'T').slice(0, 16) : '',
      target: a.target,
      is_active: a.is_active,
      blocks: a.blocks.map(b => ({ id: b.id, type: b.type, content: b.content, order: b.order })),
    });
    setView('form');
  }

  async function handleSave() {
    const payload = {
      ...form,
      blocks: form.blocks.map((b, i) => ({ ...b, order: i + 1 })),
    };
    if (editingId) {
      await announcementApi.updateAnnouncement(editingId, payload);
    } else {
      await announcementApi.createAnnouncement(payload);
    }
    await fetchAll();
    setView('list');
  }

  async function handleDelete(id: number) {
    await announcementApi.deleteAnnouncement(id);
    await fetchAll();
  }

  async function openStats(a: Announcement) {
    setStatsFor(a);
    const data = await announcementApi.getAnnouncementStats(a.id);
    setStats(data);
    setView('stats');
  }

  function addBlock(type: BlockType) {
    setForm(prev => ({
      ...prev,
      blocks: [...prev.blocks, { type, content: emptyBlockContent(type), order: prev.blocks.length + 1 }],
    }));
  }

  function removeBlock(index: number) {
    setForm(prev => ({
      ...prev,
      blocks: prev.blocks.filter((_, i) => i !== index),
    }));
  }

  function moveBlock(index: number, direction: 'up' | 'down') {
    setForm(prev => {
      const blocks = [...prev.blocks];
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= blocks.length) return prev;
      [blocks[index], blocks[target]] = [blocks[target], blocks[index]];
      return { ...prev, blocks };
    });
  }

  function updateBlockContent(index: number, content: BlockContent) {
    setForm(prev => ({
      ...prev,
      blocks: prev.blocks.map((b, i) => i === index ? { ...b, content } : b),
    }));
  }

  // --- LIST VIEW ---
  if (view === 'list') {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="font-serif text-2xl font-black tracking-tight">Avisos</h2>
            <p className="text-warm-gray text-sm mt-1">{announcements.length} avisos cadastrados</p>
          </div>
          <Button onClick={startCreate} icon={<Plus size={16} />}>Novo Aviso</Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : announcements.length === 0 ? (
          <Card padding="lg" className="text-center">
            <p className="text-warm-gray">Nenhum aviso cadastrado.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {announcements.map(a => {
              const isExpired = a.expires_at && new Date(a.expires_at) < new Date();
              return (
                <Card key={a.id} padding="md" className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-bold text-sm truncate">{a.title}</span>
                      {a.is_active && !isExpired && <Badge variant="success">Ativo</Badge>}
                      {isExpired && <Badge variant="muted">Expirado</Badge>}
                      {!a.is_active && <Badge variant="muted">Inativo</Badge>}
                      {a.mandatory && <Badge variant="gold">Obrigatorio</Badge>}
                    </div>
                    <div className="flex items-center gap-4 text-[10px] mono-label text-warm-gray/60">
                      <span>{FREQUENCY_LABELS[a.frequency]}</span>
                      <span>{a.blocks.length} blocos</span>
                      <span>Alvo: {a.target}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="ghost" size="sm" iconOnly icon={<BarChart3 size={16} />} onClick={() => openStats(a)} />
                    <Button variant="ghost" size="sm" iconOnly icon={<Pencil size={16} />} onClick={() => startEdit(a)} />
                    <Button variant="danger" size="sm" iconOnly icon={<Trash2 size={16} />} onClick={() => handleDelete(a.id)} />
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // --- STATS VIEW ---
  if (view === 'stats' && stats && statsFor) {
    return (
      <div className="space-y-8">
        <button onClick={() => setView('list')} className="flex items-center gap-2 text-sm text-warm-gray hover:text-gold transition-colors">
          <ArrowLeft size={14} /> Voltar
        </button>
        <div>
          <h2 className="font-serif text-2xl font-black tracking-tight">{statsFor.title}</h2>
          <p className="text-warm-gray text-sm mt-1">
            {stats.total_confirmations} de {stats.total_users} usuarios confirmaram
          </p>
        </div>

        {stats.responses.length > 0 && (
          <div className="space-y-6">
            <h3 className="font-bold text-sm">Respostas</h3>
            {stats.responses.map((group) => (
              <Card key={group.block_id} padding="md" className="space-y-3">
                <Badge variant="gold">{BLOCK_TYPE_LABELS[group.block_type as BlockType] || group.block_type}</Badge>
                {group.responses.map((r, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm border-t border-line pt-3">
                    <span className="font-medium shrink-0">{r.user_name}:</span>
                    <span className="text-warm-gray">{JSON.stringify(r.response)}</span>
                  </div>
                ))}
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // --- FORM VIEW ---
  return (
    <div className="space-y-8">
      <button onClick={() => setView('list')} className="flex items-center gap-2 text-sm text-warm-gray hover:text-gold transition-colors">
        <ArrowLeft size={14} /> Voltar
      </button>

      <h2 className="font-serif text-2xl font-black tracking-tight">
        {editingId ? 'Editar Aviso' : 'Novo Aviso'}
      </h2>

      {/* Basic fields */}
      <Card padding="md" className="space-y-6">
        <FormGroup label="Titulo" required>
          <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Titulo do aviso" />
        </FormGroup>
        <FormGroup label="Subtitulo">
          <Input value={form.subtitle} onChange={e => setForm(p => ({ ...p, subtitle: e.target.value }))} placeholder="Subtitulo opcional" />
        </FormGroup>
        <div className="grid grid-cols-2 gap-6">
          <FormGroup label="Inicio">
            <Input type="datetime-local" value={form.starts_at} onChange={e => setForm(p => ({ ...p, starts_at: e.target.value }))} />
          </FormGroup>
          <FormGroup label="Expiracao (opcional)">
            <Input type="datetime-local" value={form.expires_at} onChange={e => setForm(p => ({ ...p, expires_at: e.target.value }))} />
          </FormGroup>
        </div>
        <div className="grid grid-cols-3 gap-6">
          <FormGroup label="Frequencia">
            <select
              value={form.frequency}
              onChange={e => setForm(p => ({ ...p, frequency: e.target.value as any }))}
              className="w-full bg-bg border border-line px-4 py-3 focus:border-gold focus:outline-none text-sm"
            >
              {Object.entries(FREQUENCY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </FormGroup>
          <FormGroup label="Prioridade">
            <Input type="number" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: Number(e.target.value) }))} />
          </FormGroup>
          <FormGroup label="Alvo">
            <Input value={form.target} onChange={e => setForm(p => ({ ...p, target: e.target.value }))} placeholder="all" />
          </FormGroup>
        </div>
        <div className="flex gap-8">
          <Toggle checked={form.mandatory} onChange={v => setForm(p => ({ ...p, mandatory: v }))} label="Obrigatorio" />
          <Toggle checked={form.is_active} onChange={v => setForm(p => ({ ...p, is_active: v }))} label="Ativo" />
        </div>
      </Card>

      {/* Block editor */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm">Blocos de Conteudo</h3>
          <div className="flex gap-2 flex-wrap">
            {(Object.keys(BLOCK_TYPE_LABELS) as BlockType[]).map(type => (
              <button
                key={type}
                onClick={() => addBlock(type)}
                className="mono-label text-[9px] px-3 py-1.5 border border-line hover:border-gold hover:text-gold transition-colors"
              >
                + {BLOCK_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </div>

        {form.blocks.length === 0 && (
          <Card padding="lg" className="text-center">
            <p className="text-warm-gray text-sm">Adicione blocos de conteudo acima.</p>
          </Card>
        )}

        {form.blocks.map((block, index) => (
          <Card key={index} padding="md" className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant="gold">{BLOCK_TYPE_LABELS[block.type]}</Badge>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" iconOnly icon={<ChevronUp size={14} />} onClick={() => moveBlock(index, 'up')} disabled={index === 0} />
                <Button variant="ghost" size="sm" iconOnly icon={<ChevronDown size={14} />} onClick={() => moveBlock(index, 'down')} disabled={index === form.blocks.length - 1} />
                <Button variant="danger" size="sm" iconOnly icon={<X size={14} />} onClick={() => removeBlock(index)} />
              </div>
            </div>

            {/* Inline block content editor — simplified per type */}
            {block.type === 'text' && (
              <div className="space-y-3">
                <select
                  value={(block.content as any).variant}
                  onChange={e => updateBlockContent(index, { ...block.content, variant: e.target.value } as any)}
                  className="bg-bg border border-line px-3 py-2 text-sm focus:border-gold focus:outline-none"
                >
                  <option value="heading">Titulo</option>
                  <option value="paragraph">Paragrafo</option>
                  <option value="list">Lista</option>
                </select>
                {(block.content as any).variant === 'list' ? (
                  <Textarea
                    value={((block.content as any).items || []).join('\n')}
                    onChange={e => updateBlockContent(index, { ...block.content, items: e.target.value.split('\n') } as any)}
                    placeholder="Um item por linha"
                    rows={4}
                  />
                ) : (
                  <Textarea
                    value={(block.content as any).text || ''}
                    onChange={e => updateBlockContent(index, { ...block.content, text: e.target.value } as any)}
                    placeholder="Texto..."
                    rows={3}
                  />
                )}
              </div>
            )}

            {block.type === 'image' && (
              <div className="space-y-3">
                <Input value={(block.content as any).src} onChange={e => updateBlockContent(index, { ...block.content, src: e.target.value } as any)} placeholder="URL da imagem" />
                <Input value={(block.content as any).caption || ''} onChange={e => updateBlockContent(index, { ...block.content, caption: e.target.value } as any)} placeholder="Legenda (opcional)" />
              </div>
            )}

            {block.type === 'video' && (
              <div className="space-y-3">
                <Input value={(block.content as any).url} onChange={e => updateBlockContent(index, { ...block.content, url: e.target.value } as any)} placeholder="URL do video" />
                <select
                  value={(block.content as any).provider}
                  onChange={e => updateBlockContent(index, { ...block.content, provider: e.target.value } as any)}
                  className="bg-bg border border-line px-3 py-2 text-sm focus:border-gold focus:outline-none"
                >
                  <option value="youtube">YouTube</option>
                  <option value="vimeo">Vimeo</option>
                </select>
              </div>
            )}

            {block.type === 'poll' && (
              <div className="space-y-3">
                <Input value={(block.content as any).question} onChange={e => updateBlockContent(index, { ...block.content, question: e.target.value } as any)} placeholder="Pergunta" />
                {((block.content as any).options || []).map((opt: string, oi: number) => (
                  <div key={oi} className="flex gap-2">
                    <Input
                      value={opt}
                      onChange={e => {
                        const opts = [...(block.content as any).options];
                        opts[oi] = e.target.value;
                        updateBlockContent(index, { ...block.content, options: opts } as any);
                      }}
                      placeholder={`Opcao ${oi + 1}`}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      iconOnly
                      icon={<X size={12} />}
                      onClick={() => {
                        const opts = (block.content as any).options.filter((_: string, i: number) => i !== oi);
                        updateBlockContent(index, { ...block.content, options: opts } as any);
                      }}
                    />
                  </div>
                ))}
                <button
                  onClick={() => updateBlockContent(index, { ...block.content, options: [...(block.content as any).options, ''] } as any)}
                  className="text-sm text-gold hover:underline"
                >
                  + Adicionar opcao
                </button>
                <div className="flex gap-6">
                  <Toggle checked={(block.content as any).multiple} onChange={v => updateBlockContent(index, { ...block.content, multiple: v } as any)} label="Multipla escolha" />
                  <Toggle checked={(block.content as any).required} onChange={v => updateBlockContent(index, { ...block.content, required: v } as any)} label="Obrigatorio" />
                </div>
              </div>
            )}

            {block.type === 'form' && (
              <div className="space-y-3">
                {((block.content as any).fields || []).map((field: any, fi: number) => (
                  <div key={fi} className="flex gap-2 items-end">
                    <Input
                      value={field.label}
                      onChange={e => {
                        const fields = [...(block.content as any).fields];
                        fields[fi] = { ...fields[fi], label: e.target.value };
                        updateBlockContent(index, { ...block.content, fields } as any);
                      }}
                      placeholder="Label do campo"
                    />
                    <select
                      value={field.type}
                      onChange={e => {
                        const fields = [...(block.content as any).fields];
                        fields[fi] = { ...fields[fi], type: e.target.value };
                        updateBlockContent(index, { ...block.content, fields } as any);
                      }}
                      className="bg-bg border border-line px-3 py-3 text-sm focus:border-gold focus:outline-none"
                    >
                      <option value="text">Texto</option>
                      <option value="textarea">Texto longo</option>
                    </select>
                    <Button
                      variant="ghost"
                      size="sm"
                      iconOnly
                      icon={<X size={12} />}
                      onClick={() => {
                        const fields = (block.content as any).fields.filter((_: any, i: number) => i !== fi);
                        updateBlockContent(index, { ...block.content, fields } as any);
                      }}
                    />
                  </div>
                ))}
                <button
                  onClick={() => updateBlockContent(index, { ...block.content, fields: [...(block.content as any).fields, { label: '', type: 'text', required: false }] } as any)}
                  className="text-sm text-gold hover:underline"
                >
                  + Adicionar campo
                </button>
              </div>
            )}

            {block.type === 'rating' && (
              <div className="space-y-3">
                <Input value={(block.content as any).question} onChange={e => updateBlockContent(index, { ...block.content, question: e.target.value } as any)} placeholder="Pergunta" />
                <Input type="number" value={(block.content as any).max} onChange={e => updateBlockContent(index, { ...block.content, max: Number(e.target.value) } as any)} placeholder="Maximo (ex: 5)" />
              </div>
            )}

            {block.type === 'action' && (
              <div className="space-y-3">
                {((block.content as any).buttons || []).map((btn: any, bi: number) => (
                  <div key={bi} className="flex gap-2 items-end">
                    <Input
                      value={btn.label}
                      onChange={e => {
                        const buttons = [...(block.content as any).buttons];
                        buttons[bi] = { ...buttons[bi], label: e.target.value };
                        updateBlockContent(index, { ...block.content, buttons } as any);
                      }}
                      placeholder="Label do botao"
                    />
                    <select
                      value={btn.action}
                      onChange={e => {
                        const buttons = [...(block.content as any).buttons];
                        buttons[bi] = { ...buttons[bi], action: e.target.value };
                        updateBlockContent(index, { ...block.content, buttons } as any);
                      }}
                      className="bg-bg border border-line px-3 py-3 text-sm focus:border-gold focus:outline-none"
                    >
                      <option value="navigate">Navegar</option>
                      <option value="url">URL externa</option>
                    </select>
                    <Input
                      value={btn.target}
                      onChange={e => {
                        const buttons = [...(block.content as any).buttons];
                        buttons[bi] = { ...buttons[bi], target: e.target.value };
                        updateBlockContent(index, { ...block.content, buttons } as any);
                      }}
                      placeholder="Destino"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      iconOnly
                      icon={<X size={12} />}
                      onClick={() => {
                        const buttons = (block.content as any).buttons.filter((_: any, i: number) => i !== bi);
                        updateBlockContent(index, { ...block.content, buttons } as any);
                      }}
                    />
                  </div>
                ))}
                <button
                  onClick={() => updateBlockContent(index, { ...block.content, buttons: [...(block.content as any).buttons, { label: '', action: 'navigate', target: 'dashboard' }] } as any)}
                  className="text-sm text-gold hover:underline"
                >
                  + Adicionar botao
                </button>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Save button */}
      <div className="flex justify-end gap-4">
        <Button variant="secondary" onClick={() => setView('list')}>Cancelar</Button>
        <Button onClick={handleSave} disabled={!form.title.trim()}>
          {editingId ? 'Salvar Alteracoes' : 'Criar Aviso'}
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Export from admin index**

In `src/components/admin/index.ts`, add:
```ts
export { default as AdminAnnouncements } from './AdminAnnouncements';
```

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/AdminAnnouncements.tsx src/components/admin/index.ts
git commit -m "feat: add AdminAnnouncements component with block editor"
```

### Task 15: Wire admin section into AdminPage and Sidebar

**Files:**
- Modify: `src/pages/AdminPage.tsx`
- Modify: `src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Update AdminPage**

Add import:
```ts
import { AdminAnnouncements } from '../components/admin';
```

Add to `sectionTitles`:
```ts
announcements: 'Avisos',
```

Add to `sectionComponents`:
```ts
announcements: AdminAnnouncements,
```

- [ ] **Step 2: Update Sidebar**

Add `Megaphone` to lucide imports:
```ts
import { ..., Megaphone } from 'lucide-react';
```

Add NavItem in the admin nav section (after "Cursos" and before "Biblioteca de Midia"):
```tsx
<NavItem
  icon={<Megaphone size={18} />}
  label="Avisos"
  active={adminSection === 'announcements'}
  onClick={() => setAdminSection('announcements')}
  layoutId="activeAdminNav"
/>
```

- [ ] **Step 3: Verify everything works**

Run: `npm run dev`

Test:
1. Login -> should see announcement gate with seed data
2. Fill poll -> confirm -> app loads
3. Go to Admin > Avisos -> should see the seed announcement listed
4. Create a new announcement with blocks -> save -> verify it appears

- [ ] **Step 4: Commit**

```bash
git add src/pages/AdminPage.tsx src/components/layout/Sidebar.tsx
git commit -m "feat: wire announcements into admin panel and sidebar navigation"
```

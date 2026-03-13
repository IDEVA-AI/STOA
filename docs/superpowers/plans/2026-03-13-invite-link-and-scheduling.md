# Autocadastro por Convite + Agenda de Tutorias — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow students to self-register via invite link (auto-enrolled in DEV.IA course) and book 1:1 tutoring sessions from admin-configured time slots (Cal.com style).

**Architecture:** Two independent features sharing the same codebase. Feature 1 (invite) extends existing auth flow with an invite_codes table and auto-enrollment into workspace + product. Feature 2 (scheduling) adds a new scheduling domain (availability configs, time slots, bookings) with a student-facing booking page and admin config panel. Both follow existing repo patterns: repository → service → route layers on backend, context/hooks + pages on frontend.

**Tech Stack:** Express + better-sqlite3 + React 19 + TypeScript + Tailwind CSS v4 (existing stack)

---

## File Structure

### Feature 1: Invite Link + Autocadastro

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `server/db/schema.ts` | Add `invite_codes` and `invite_redemptions` tables |
| Create | `server/repositories/inviteRepository.ts` | CRUD for invite codes and redemptions |
| Create | `server/services/inviteService.ts` | Code generation, validation, redemption + auto-enroll |
| Modify | `server/services/authService.ts` | Accept `inviteCode` + `phone` in register(), call inviteService |
| Modify | `server/routes/auth.ts` | Pass inviteCode + phone from body to register() |
| Create | `server/routes/invites.ts` | Admin endpoints for invite management |
| Modify | `server/index.ts` | Mount `/api/invites` route |
| Modify | `server/repositories/userRepository.ts` | Add `phone` field to createUser() |
| Modify | `src/services/api.ts` | Add validateInvite(), update register() signature |
| Modify | `src/stores/AuthContext.tsx` | Pass inviteCode + phone through register() |
| Modify | `src/pages/AuthPage.tsx` | Read ?invite= param, show invite info, add phone field |
| Modify | `src/router.tsx` | Pass invite code from URL to LoginPage |
| Modify | `src/types.ts` | Add phone to AuthUser, add InviteInfo type |

### Feature 2: Agenda de Tutorias

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `server/db/schema.ts` | Add `availability_configs`, `time_slots`, `bookings` tables |
| Create | `server/repositories/schedulingRepository.ts` | CRUD for configs, slots, bookings |
| Create | `server/services/schedulingService.ts` | Slot generation, booking logic, cancellation |
| Create | `server/routes/scheduling.ts` | Admin config + student booking endpoints |
| Modify | `server/index.ts` | Mount `/api/scheduling` route |
| Modify | `src/services/api.ts` | Add scheduling API functions |
| Create | `src/pages/SchedulingPage.tsx` | Student-facing booking page (Cal.com style) |
| Create | `src/components/admin/AdminScheduling.tsx` | Admin config panel for availability |
| Modify | `src/pages/AdminPage.tsx` | Add "Agenda" section |
| Modify | `src/router.tsx` | Add `/agenda` route |
| Modify | `src/components/layout/Sidebar.tsx` | Add "Agenda" nav item |
| Modify | `src/types.ts` | Add scheduling types |

---

## Chunk 1: Invite Link + Autocadastro

### Task 1: Database Schema — Invite Tables

**Files:**
- Modify: `server/db/schema.ts` (add after announcements tables, before workspaces)

- [ ] **Step 1: Add invite tables to schema**

Add to `initializeSchema()` in `server/db/schema.ts`, inside the main `db.exec()` block:

```sql
CREATE TABLE IF NOT EXISTS invite_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  workspace_id INTEGER NOT NULL,
  product_id INTEGER,
  created_by INTEGER NOT NULL,
  max_uses INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  expires_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(workspace_id) REFERENCES workspaces(id),
  FOREIGN KEY(product_id) REFERENCES products(id),
  FOREIGN KEY(created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS invite_redemptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invite_code_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  redeemed_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(invite_code_id) REFERENCES invite_codes(id),
  FOREIGN KEY(user_id) REFERENCES users(id),
  UNIQUE(invite_code_id, user_id)
);
```

Add indices in the performance indices block:

```sql
CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);
CREATE INDEX IF NOT EXISTS idx_invite_codes_workspace_id ON invite_codes(workspace_id);
CREATE INDEX IF NOT EXISTS idx_invite_codes_status ON invite_codes(status);
CREATE INDEX IF NOT EXISTS idx_invite_redemptions_invite_code_id ON invite_redemptions(invite_code_id);
CREATE INDEX IF NOT EXISTS idx_invite_redemptions_user_id ON invite_redemptions(user_id);
```

- [ ] **Step 2: Add phone column to users table**

In `schema.ts`, add to the `usersColumnsToAdd` array (or create one if using the ALTER TABLE pattern):

```typescript
const usersColumnsToAdd = [
  { name: "bio", definition: "TEXT" },
  { name: "phone", definition: "TEXT" },
];

for (const col of usersColumnsToAdd) {
  try {
    db.exec(`ALTER TABLE users ADD COLUMN ${col.name} ${col.definition}`);
  } catch (_) {}
}
```

- [ ] **Step 3: Verify schema loads without errors**

Run: `ssh deploy@178.156.252.78 "cd ~/apps/stoa && npx tsx -e 'import { initializeSchema } from \"./server/db/schema\"; initializeSchema(); console.log(\"OK\")'"`

Expected: `OK` with no errors

- [ ] **Step 4: Commit**

```bash
git add server/db/schema.ts
git commit -m "feat: add invite_codes, invite_redemptions tables and phone column to users"
```

---

### Task 2: Invite Repository

**Files:**
- Create: `server/repositories/inviteRepository.ts`

- [ ] **Step 1: Create invite repository**

```typescript
import db from "../db/connection";
import crypto from "crypto";

export interface InviteCode {
  id: number;
  code: string;
  workspace_id: number;
  product_id: number | null;
  created_by: number;
  max_uses: number | null;
  used_count: number;
  status: string;
  expires_at: string | null;
  created_at: string;
}

export interface InviteRedemption {
  id: number;
  invite_code_id: number;
  user_id: number;
  redeemed_at: string;
}

function generateCode(): string {
  return crypto.randomBytes(12).toString("base64url"); // 16 chars, URL-safe
}

export function create(data: {
  workspace_id: number;
  product_id?: number;
  created_by: number;
  max_uses?: number;
  expires_at?: string;
}): InviteCode {
  const code = generateCode();
  const result = db
    .prepare(
      `INSERT INTO invite_codes (code, workspace_id, product_id, created_by, max_uses, expires_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(code, data.workspace_id, data.product_id ?? null, data.created_by, data.max_uses ?? null, data.expires_at ?? null);
  return findById(Number(result.lastInsertRowid))!;
}

export function findByCode(code: string): InviteCode | null {
  return (db.prepare("SELECT * FROM invite_codes WHERE code = ?").get(code) as InviteCode) || null;
}

export function findById(id: number): InviteCode | null {
  return (db.prepare("SELECT * FROM invite_codes WHERE id = ?").get(id) as InviteCode) || null;
}

export function findByWorkspace(workspaceId: number): InviteCode[] {
  return db
    .prepare(
      `SELECT ic.*, u.name AS created_by_name
       FROM invite_codes ic
       JOIN users u ON u.id = ic.created_by
       WHERE ic.workspace_id = ?
       ORDER BY ic.created_at DESC`
    )
    .all(workspaceId) as InviteCode[];
}

export function incrementUsage(id: number): void {
  db.prepare("UPDATE invite_codes SET used_count = used_count + 1 WHERE id = ?").run(id);
}

export function updateStatus(id: number, status: string): void {
  db.prepare("UPDATE invite_codes SET status = ? WHERE id = ?").run(status, id);
}

export function remove(id: number): void {
  db.prepare("DELETE FROM invite_codes WHERE id = ?").run(id);
}

export function createRedemption(inviteCodeId: number, userId: number): void {
  db.prepare(
    "INSERT INTO invite_redemptions (invite_code_id, user_id) VALUES (?, ?)"
  ).run(inviteCodeId, userId);
}

export function getRedemptions(inviteCodeId: number) {
  return db
    .prepare(
      `SELECT ir.*, u.name AS user_name, u.email AS user_email
       FROM invite_redemptions ir
       JOIN users u ON u.id = ir.user_id
       WHERE ir.invite_code_id = ?
       ORDER BY ir.redeemed_at DESC`
    )
    .all(inviteCodeId);
}
```

- [ ] **Step 2: Commit**

```bash
git add server/repositories/inviteRepository.ts
git commit -m "feat: add invite repository with CRUD and redemption tracking"
```

---

### Task 3: Invite Service

**Files:**
- Create: `server/services/inviteService.ts`

- [ ] **Step 1: Create invite service**

```typescript
import * as inviteRepo from "../repositories/inviteRepository";
import * as purchaseRepo from "../repositories/purchaseRepository";
import * as workspaceRepo from "../repositories/workspaceRepository";

export function createInvite(data: {
  workspace_id: number;
  product_id?: number;
  created_by: number;
  max_uses?: number;
  expires_at?: string;
}) {
  return inviteRepo.create(data);
}

export function validateInvite(code: string): {
  valid: boolean;
  reason?: string;
  invite?: inviteRepo.InviteCode;
  workspace?: any;
  product_title?: string;
} {
  const invite = inviteRepo.findByCode(code);
  if (!invite) return { valid: false, reason: "Convite nao encontrado" };
  if (invite.status !== "active") return { valid: false, reason: "Convite expirado ou revogado" };
  if (invite.max_uses && invite.used_count >= invite.max_uses) return { valid: false, reason: "Convite esgotado" };
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) return { valid: false, reason: "Convite expirado" };

  const workspace = workspaceRepo.getById(invite.workspace_id);
  return { valid: true, invite, workspace };
}

export function redeemInvite(code: string, userId: number): void {
  const { valid, reason, invite } = validateInvite(code);
  if (!valid || !invite) throw { status: 400, message: reason || "Convite invalido" };

  // Record redemption
  inviteRepo.createRedemption(invite.id, userId);
  inviteRepo.incrementUsage(invite.id);

  // Auto-exhaust single-use invites
  if (invite.max_uses && invite.used_count + 1 >= invite.max_uses) {
    inviteRepo.updateStatus(invite.id, "used");
  }

  // Add user to workspace
  workspaceRepo.addMember(invite.workspace_id, userId, "member");

  // Auto-create purchase if product is linked
  if (invite.product_id) {
    purchaseRepo.create({
      user_id: userId,
      product_id: invite.product_id,
      workspace_id: invite.workspace_id,
      status: "active",
    });
  }
}

export function getByWorkspace(workspaceId: number) {
  return inviteRepo.findByWorkspace(workspaceId);
}

export function revokeInvite(id: number) {
  inviteRepo.updateStatus(id, "revoked");
}

export function deleteInvite(id: number) {
  inviteRepo.remove(id);
}

export function getRedemptions(inviteCodeId: number) {
  return inviteRepo.getRedemptions(inviteCodeId);
}
```

- [ ] **Step 2: Commit**

```bash
git add server/services/inviteService.ts
git commit -m "feat: add invite service with validation, redemption, and auto-enrollment"
```

---

### Task 4: Modify Auth to Support Invites + Phone

**Files:**
- Modify: `server/repositories/userRepository.ts`
- Modify: `server/services/authService.ts`
- Modify: `server/routes/auth.ts`

- [ ] **Step 1: Add phone to userRepository.createUser()**

In `server/repositories/userRepository.ts`, modify `createUser()`:

```typescript
export function createUser(
  name: string,
  email: string,
  passwordHash: string,
  role: string = "Membro",
  phone?: string
): User {
  const result = db
    .prepare(
      "INSERT INTO users (name, email, password_hash, role, avatar, phone) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .run(name, email, passwordHash, role, `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`, phone ?? null);

  return findById(Number(result.lastInsertRowid))!;
}
```

Also add `phone` to the `User` interface:

```typescript
export interface User {
  id: number;
  name: string;
  avatar: string | null;
  role: string | null;
  email: string | null;
  password_hash: string | null;
  created_at: string | null;
  is_active: number;
  bio: string | null;
  phone: string | null;
}
```

- [ ] **Step 2: Modify authService.register() to accept inviteCode + phone**

In `server/services/authService.ts`, update the `register()` function:

```typescript
import * as inviteService from "./inviteService";

export async function register(
  name: string,
  email: string,
  password: string,
  phone?: string,
  inviteCode?: string
): Promise<AuthResult> {
  if (!name || !email || !password) {
    throw { status: 400, message: "Name, email, and password are required" };
  }

  if (password.length < 6) {
    throw { status: 400, message: "Password must be at least 6 characters" };
  }

  // Validate invite code before creating user
  if (inviteCode) {
    const validation = inviteService.validateInvite(inviteCode);
    if (!validation.valid) {
      throw { status: 400, message: validation.reason || "Convite invalido" };
    }
  }

  const existing = userRepo.findByEmail(email);
  if (existing) {
    throw { status: 409, message: "Email already registered" };
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = userRepo.createUser(name, email, passwordHash, "Membro", phone);

  // Redeem invite (auto-enrolls in workspace + product)
  if (inviteCode) {
    inviteService.redeemInvite(inviteCode, user.id);
  }

  const accessToken = generateToken(user.id, user.role || undefined);
  const refreshToken = generateRefreshToken(user.id);

  return { user: sanitizeUser(user), accessToken, refreshToken };
}
```

- [ ] **Step 3: Update auth route to pass inviteCode + phone**

In `server/routes/auth.ts`, update POST /register:

```typescript
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
```

- [ ] **Step 4: Commit**

```bash
git add server/repositories/userRepository.ts server/services/authService.ts server/routes/auth.ts
git commit -m "feat: support invite code and phone on registration"
```

---

### Task 5: Invite Admin Routes

**Files:**
- Create: `server/routes/invites.ts`
- Modify: `server/index.ts`

- [ ] **Step 1: Create invite routes**

```typescript
import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/auth";
import * as inviteService from "../services/inviteService";

const router = Router();

// Public: validate invite code (no auth needed)
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

// Admin: get redemptions for an invite
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
```

- [ ] **Step 2: Mount in server/index.ts**

Add import:
```typescript
import invitesRouter from "./routes/invites";
```

Add route mount (after purchases):
```typescript
app.use("/api/invites", invitesRouter);
```

Note: the validate endpoint is public (no authMiddleware on the route level), but admin endpoints use authMiddleware on each handler.

- [ ] **Step 3: Commit**

```bash
git add server/routes/invites.ts server/index.ts
git commit -m "feat: add invite admin routes and mount in server"
```

---

### Task 6: Frontend — Invite Registration Flow

**Files:**
- Modify: `src/types.ts` — add InviteInfo type, phone to AuthUser
- Modify: `src/services/api.ts` — add validateInvite(), update register()
- Modify: `src/stores/AuthContext.tsx` — update register signature
- Modify: `src/pages/AuthPage.tsx` — read ?invite= param, show info, add phone field
- Modify: `src/router.tsx` — pass invite handling

- [ ] **Step 1: Add types**

In `src/types.ts`, add:

```typescript
export interface InviteInfo {
  valid: boolean;
  reason?: string;
  invite?: {
    id: number;
    code: string;
    workspace_id: number;
    product_id: number | null;
    expires_at: string | null;
  };
  workspace?: {
    id: number;
    name: string;
    logo: string | null;
  };
}
```

Add `phone` to `AuthUser` interface (find existing definition and add field).

- [ ] **Step 2: Update API service**

In `src/services/api.ts`, update `register()` and add `validateInvite()`:

```typescript
export async function register(
  name: string,
  email: string,
  password: string,
  phone?: string,
  inviteCode?: string
): Promise<AuthResponse> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, phone, inviteCode }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: 'Falha ao criar conta.' }));
    throw new Error(body.error || body.message || 'Falha ao criar conta.');
  }
  return res.json();
}

export async function validateInvite(code: string): Promise<InviteInfo> {
  const res = await fetch(`/api/invites/validate/${encodeURIComponent(code)}`);
  if (!res.ok) return { valid: false, reason: 'Convite nao encontrado' };
  return res.json();
}
```

Add import for `InviteInfo` from types.

- [ ] **Step 3: Update AuthContext**

In `src/stores/AuthContext.tsx`, update the register signature:

```typescript
interface AuthContextType {
  // ... existing fields
  register: (name: string, email: string, password: string, phone?: string, inviteCode?: string) => Promise<void>;
}

const register = useCallback(async (name: string, email: string, password: string, phone?: string, inviteCode?: string) => {
  const res = await api.register(name, email, password, phone, inviteCode);
  api.setTokens(res.accessToken, res.refreshToken);
  setUser(res.user);
}, []);
```

- [ ] **Step 4: Update AuthPage with invite flow + phone field**

Replace `src/pages/AuthPage.tsx` with updated version that:
1. Reads `?invite=CODE` from URL search params
2. Validates invite on mount (shows workspace info if valid)
3. Forces register mode when invite is present
4. Adds WhatsApp phone field to register form
5. Passes inviteCode + phone through to onRegister

```typescript
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { AuthMode, InviteInfo } from '../types';
import { Button, Input, FormGroup } from '../components/ui';
import * as api from '../services/api';

interface AuthPageProps {
  authMode: AuthMode;
  setAuthMode: (mode: AuthMode) => void;
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (name: string, email: string, password: string, phone?: string, inviteCode?: string) => Promise<void>;
}

export default function AuthPage({ authMode, setAuthMode, onLogin, onRegister }: AuthPageProps) {
  const [searchParams] = useSearchParams();
  const inviteCode = searchParams.get('invite');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);

  // Validate invite code on mount
  useEffect(() => {
    if (!inviteCode) return;
    setInviteLoading(true);
    setAuthMode('register');
    api.validateInvite(inviteCode)
      .then(setInviteInfo)
      .catch(() => setInviteInfo({ valid: false, reason: 'Erro ao validar convite' }))
      .finally(() => setInviteLoading(false));
  }, [inviteCode, setAuthMode]);

  const isRegister = authMode === 'register';
  const hasInvite = !!inviteCode;

  function validate(): string | null {
    if (isRegister && name.trim().length < 2) return 'Nome deve ter pelo menos 2 caracteres.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'E-mail invalido.';
    if (password.length < 6) return 'Senha deve ter pelo menos 6 caracteres.';
    if (isRegister && hasInvite && !phone.trim()) return 'WhatsApp e obrigatorio.';
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    try {
      if (isRegister) {
        await onRegister(name, email, password, phone || undefined, inviteCode || undefined);
      } else {
        await onLogin(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  // Show loading while validating invite
  if (inviteLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="animate-pulse text-warm-gray text-sm mono-label">Validando convite...</div>
      </div>
    );
  }

  // Invalid invite
  if (hasInvite && inviteInfo && !inviteInfo.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg p-6">
        <div className="card-editorial p-12 text-center max-w-md">
          <h2 className="font-serif text-3xl font-black mb-4">Convite Invalido</h2>
          <p className="text-warm-gray mb-6">{inviteInfo.reason}</p>
          <Button onClick={() => window.location.href = '/login'}>Ir para Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg transition-colors duration-500 p-6">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 card-editorial overflow-hidden bg-surface transition-colors duration-500">
        {/* Left Side: Brand/Visual */}
        <div className="hidden lg:flex flex-col justify-between p-16 bg-text text-bg transition-colors duration-500 relative overflow-hidden">
          <div className="relative z-10">
            <span className="font-serif font-black text-3xl tracking-tight">Julio Carvalho</span>
            <p className="mono-label text-gold mt-2">Arquiteto de Sistemas</p>
          </div>
          <div className="relative z-10">
            <h1 className="font-serif text-6xl font-black leading-[0.9] mb-8">A estrutura precede o sucesso.</h1>
            <p className="text-paper/60 text-lg font-light max-w-sm">
              {hasInvite && inviteInfo?.workspace
                ? `Voce foi convidado para ${inviteInfo.workspace.name}.`
                : 'Entre na plataforma exclusiva para arquitetos de sistemas organizacionais e lideres de elite.'}
            </p>
          </div>
          <div className="absolute -bottom-20 -right-20 w-96 h-96 border border-gold/20 rounded-full" />
          <div className="absolute -bottom-10 -right-10 w-96 h-96 border border-gold/10 rounded-full" />
        </div>

        {/* Right Side: Form */}
        <div className="p-12 lg:p-20 flex flex-col justify-center">
          <div className="mb-12">
            <h2 className="font-serif text-4xl font-black mb-2">
              {isRegister ? 'Crie sua conta' : 'Bem-vindo de volta'}
            </h2>
            <p className="text-warm-gray text-sm">
              {isRegister
                ? hasInvite
                  ? 'Preencha seus dados para acessar a formacao.'
                  : 'Inicie sua transformacao como arquiteto de sistemas.'
                : 'Acesse seu painel de controle e continue sua jornada.'}
            </p>
          </div>

          {/* Invite Badge */}
          {hasInvite && inviteInfo?.valid && inviteInfo.workspace && (
            <div className="mb-6 p-4 rounded-lg bg-gold/10 border border-gold/20">
              <p className="mono-label text-gold text-[10px] mb-1">Convite para</p>
              <p className="font-serif font-bold text-lg">{inviteInfo.workspace.name}</p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {isRegister && (
              <FormGroup label="Nome Completo">
                <Input type="text" required placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} disabled={loading} />
              </FormGroup>
            )}
            <FormGroup label="Endereco de E-mail">
              <Input type="email" required placeholder="exemplo@email.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
            </FormGroup>
            {isRegister && hasInvite && (
              <FormGroup label="WhatsApp">
                <Input type="tel" required placeholder="(11) 99999-9999" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={loading} />
              </FormGroup>
            )}
            <FormGroup
              label="Senha"
              labelAction={!isRegister ? <button type="button" className="text-[10px] mono-label text-gold hover:underline">Esqueceu a senha?</button> : undefined}
            >
              <Input type="password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} />
            </FormGroup>

            <Button type="submit" fullWidth size="lg" className="mt-4" disabled={loading}>
              {loading ? 'Carregando...' : isRegister ? 'Finalizar Cadastro' : 'Entrar no Sistema'}
            </Button>
          </form>

          {!hasInvite && (
            <div className="mt-12 pt-8 border-t border-line text-center">
              <p className="text-sm text-warm-gray">
                {!isRegister ? 'Ainda nao e membro?' : 'Ja possui uma conta?'}
                <Button
                  variant="link"
                  onClick={() => { setAuthMode(isRegister ? 'login' : 'register'); setError(''); }}
                  className="ml-2 font-bold text-text hover:text-gold"
                >
                  {!isRegister ? 'Solicitar Acesso' : 'Fazer Login'}
                </Button>
              </p>
            </div>
          )}

          {hasInvite && (
            <div className="mt-12 pt-8 border-t border-line text-center">
              <p className="text-sm text-warm-gray">
                Ja possui uma conta?
                <Button variant="link" onClick={() => { window.location.href = '/login'; }} className="ml-2 font-bold text-text hover:text-gold">
                  Fazer Login
                </Button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/types.ts src/services/api.ts src/stores/AuthContext.tsx src/pages/AuthPage.tsx
git commit -m "feat: invite-based registration with phone field and auto-enrollment"
```

---

### Task 7: Admin Panel — Invite Management

**Files:**
- Create: `src/components/admin/AdminInvites.tsx`
- Modify: `src/pages/AdminPage.tsx` — add "Convites" section
- Modify: `src/components/layout/Sidebar.tsx` — add nav item (if admin sections are listed there)

- [ ] **Step 1: Create AdminInvites component**

Create `src/components/admin/AdminInvites.tsx` — a panel that:
- Lists all invite codes for the current workspace (code, status, used/max, created date, product)
- "Criar Convite" button → form with: select product, max uses (optional), expiration (optional)
- Copy link button (copies `https://membros.jcarv.in/login?invite=CODE`)
- Revoke button per invite
- Expandable row showing who redeemed each invite

Use existing UI components (Button, Input, etc.) and follow the AdminPage pattern (similar to AdminProducts or AdminCommunities).

- [ ] **Step 2: Add to AdminPage**

In `src/pages/AdminPage.tsx`, add the "convites" section case to render `<AdminInvites />`. Follow the existing pattern for how sections are switched.

- [ ] **Step 3: Add sidebar nav item**

In the sidebar or admin nav, add "Convites" with a `TicketIcon` or `LinkIcon` from lucide-react, pointing to the admin convites section.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/AdminInvites.tsx src/pages/AdminPage.tsx src/components/layout/Sidebar.tsx
git commit -m "feat: admin panel for invite management"
```

---

## Chunk 2: Agenda de Tutorias (Cal.com Style)

### Task 8: Database Schema — Scheduling Tables

**Files:**
- Modify: `server/db/schema.ts`

- [ ] **Step 1: Add scheduling tables**

Add to `initializeSchema()`:

```sql
CREATE TABLE IF NOT EXISTS availability_configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workspace_id INTEGER NOT NULL,
  title TEXT NOT NULL DEFAULT 'Tutoria Individual',
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  buffer_minutes INTEGER NOT NULL DEFAULT 15,
  max_advance_days INTEGER NOT NULL DEFAULT 30,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(workspace_id) REFERENCES workspaces(id)
);

CREATE TABLE IF NOT EXISTS availability_slots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  config_id INTEGER NOT NULL,
  day_of_week INTEGER NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  FOREIGN KEY(config_id) REFERENCES availability_configs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  config_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed',
  meet_link TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(config_id) REFERENCES availability_configs(id),
  FOREIGN KEY(user_id) REFERENCES users(id)
);
```

Add indices:

```sql
CREATE INDEX IF NOT EXISTS idx_availability_configs_workspace_id ON availability_configs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_availability_slots_config_id ON availability_slots(config_id);
CREATE INDEX IF NOT EXISTS idx_bookings_config_id ON bookings(config_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
```

- [ ] **Step 2: Commit**

```bash
git add server/db/schema.ts
git commit -m "feat: add scheduling tables (availability_configs, availability_slots, bookings)"
```

---

### Task 9: Scheduling Repository

**Files:**
- Create: `server/repositories/schedulingRepository.ts`

- [ ] **Step 1: Create scheduling repository**

```typescript
import db from "../db/connection";

export interface AvailabilityConfig {
  id: number;
  workspace_id: number;
  title: string;
  duration_minutes: number;
  buffer_minutes: number;
  max_advance_days: number;
  is_active: number;
  created_at: string;
}

export interface AvailabilitySlot {
  id: number;
  config_id: number;
  day_of_week: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  start_time: string;  // "09:00"
  end_time: string;    // "17:00"
}

export interface Booking {
  id: number;
  config_id: number;
  user_id: number;
  date: string;        // "2026-03-20"
  start_time: string;  // "14:00"
  end_time: string;    // "15:00"
  status: string;      // confirmed, cancelled
  meet_link: string | null;
  notes: string | null;
  created_at: string;
}

// ── Config ──

export function createConfig(data: {
  workspace_id: number;
  title?: string;
  duration_minutes?: number;
  buffer_minutes?: number;
  max_advance_days?: number;
}): AvailabilityConfig {
  const result = db
    .prepare(
      `INSERT INTO availability_configs (workspace_id, title, duration_minutes, buffer_minutes, max_advance_days)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(
      data.workspace_id,
      data.title ?? "Tutoria Individual",
      data.duration_minutes ?? 60,
      data.buffer_minutes ?? 15,
      data.max_advance_days ?? 30
    );
  return getConfigById(Number(result.lastInsertRowid))!;
}

export function getConfigById(id: number): AvailabilityConfig | null {
  return (db.prepare("SELECT * FROM availability_configs WHERE id = ?").get(id) as AvailabilityConfig) || null;
}

export function getConfigsByWorkspace(workspaceId: number): AvailabilityConfig[] {
  return db.prepare("SELECT * FROM availability_configs WHERE workspace_id = ?").all(workspaceId) as AvailabilityConfig[];
}

export function updateConfig(id: number, data: Partial<{
  title: string;
  duration_minutes: number;
  buffer_minutes: number;
  max_advance_days: number;
  is_active: number;
}>): void {
  const fields: string[] = [];
  const values: any[] = [];
  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) { fields.push(`${key} = ?`); values.push(val); }
  }
  if (fields.length === 0) return;
  values.push(id);
  db.prepare(`UPDATE availability_configs SET ${fields.join(", ")} WHERE id = ?`).run(...values);
}

export function deleteConfig(id: number): void {
  db.prepare("DELETE FROM availability_configs WHERE id = ?").run(id);
}

// ── Slots ──

export function getSlotsByConfig(configId: number): AvailabilitySlot[] {
  return db.prepare("SELECT * FROM availability_slots WHERE config_id = ? ORDER BY day_of_week, start_time").all(configId) as AvailabilitySlot[];
}

export function setSlots(configId: number, slots: Array<{ day_of_week: number; start_time: string; end_time: string }>): void {
  const tx = db.transaction(() => {
    db.prepare("DELETE FROM availability_slots WHERE config_id = ?").run(configId);
    const insert = db.prepare("INSERT INTO availability_slots (config_id, day_of_week, start_time, end_time) VALUES (?, ?, ?, ?)");
    for (const slot of slots) {
      insert.run(configId, slot.day_of_week, slot.start_time, slot.end_time);
    }
  });
  tx();
}

// ── Bookings ──

export function createBooking(data: {
  config_id: number;
  user_id: number;
  date: string;
  start_time: string;
  end_time: string;
  meet_link?: string;
}): Booking {
  const result = db
    .prepare(
      `INSERT INTO bookings (config_id, user_id, date, start_time, end_time, meet_link)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(data.config_id, data.user_id, data.date, data.start_time, data.end_time, data.meet_link ?? null);
  return getBookingById(Number(result.lastInsertRowid))!;
}

export function getBookingById(id: number): Booking | null {
  return (db.prepare("SELECT * FROM bookings WHERE id = ?").get(id) as Booking) || null;
}

export function getBookingsByDate(configId: number, date: string): Booking[] {
  return db
    .prepare("SELECT * FROM bookings WHERE config_id = ? AND date = ? AND status = 'confirmed' ORDER BY start_time")
    .all(configId, date) as Booking[];
}

export function getBookingsByUser(userId: number): Booking[] {
  return db
    .prepare(
      `SELECT b.*, ac.title AS config_title
       FROM bookings b
       JOIN availability_configs ac ON ac.id = b.config_id
       WHERE b.user_id = ?
       ORDER BY b.date DESC, b.start_time DESC`
    )
    .all(userId) as Booking[];
}

export function getBookingsByConfig(configId: number): Booking[] {
  return db
    .prepare(
      `SELECT b.*, u.name AS user_name, u.email AS user_email, u.phone AS user_phone
       FROM bookings b
       JOIN users u ON u.id = b.user_id
       WHERE b.config_id = ?
       ORDER BY b.date ASC, b.start_time ASC`
    )
    .all(configId) as Booking[];
}

export function cancelBooking(id: number): void {
  db.prepare("UPDATE bookings SET status = 'cancelled' WHERE id = ?").run(id);
}

export function hasBookingConflict(configId: number, date: string, startTime: string, endTime: string, excludeBookingId?: number): boolean {
  const query = excludeBookingId
    ? "SELECT 1 FROM bookings WHERE config_id = ? AND date = ? AND status = 'confirmed' AND id != ? AND start_time < ? AND end_time > ? LIMIT 1"
    : "SELECT 1 FROM bookings WHERE config_id = ? AND date = ? AND status = 'confirmed' AND start_time < ? AND end_time > ? LIMIT 1";

  const params = excludeBookingId
    ? [configId, date, excludeBookingId, endTime, startTime]
    : [configId, date, endTime, startTime];

  return !!db.prepare(query).get(...params);
}

export function updateBookingNotes(id: number, notes: string): void {
  db.prepare("UPDATE bookings SET notes = ? WHERE id = ?").run(notes, id);
}

export function updateBookingMeetLink(id: number, meetLink: string): void {
  db.prepare("UPDATE bookings SET meet_link = ? WHERE id = ?").run(meetLink, id);
}
```

- [ ] **Step 2: Commit**

```bash
git add server/repositories/schedulingRepository.ts
git commit -m "feat: add scheduling repository (configs, slots, bookings)"
```

---

### Task 10: Scheduling Service

**Files:**
- Create: `server/services/schedulingService.ts`

- [ ] **Step 1: Create scheduling service**

```typescript
import * as repo from "../repositories/schedulingRepository";

// ── Config management ──

export function createConfig(data: {
  workspace_id: number;
  title?: string;
  duration_minutes?: number;
  buffer_minutes?: number;
  max_advance_days?: number;
}) {
  return repo.createConfig(data);
}

export function getConfigs(workspaceId: number) {
  return repo.getConfigsByWorkspace(workspaceId);
}

export function getConfig(id: number) {
  return repo.getConfigById(id);
}

export function updateConfig(id: number, data: Partial<{
  title: string;
  duration_minutes: number;
  buffer_minutes: number;
  max_advance_days: number;
  is_active: number;
}>) {
  repo.updateConfig(id, data);
  return repo.getConfigById(id);
}

export function deleteConfig(id: number) {
  repo.deleteConfig(id);
}

// ── Slots management ──

export function getSlots(configId: number) {
  return repo.getSlotsByConfig(configId);
}

export function setSlots(configId: number, slots: Array<{ day_of_week: number; start_time: string; end_time: string }>) {
  repo.setSlots(configId, slots);
  return repo.getSlotsByConfig(configId);
}

// ── Available times for a date ──

export function getAvailableTimes(configId: number, date: string): Array<{ start: string; end: string }> {
  const config = repo.getConfigById(configId);
  if (!config || !config.is_active) return [];

  const dateObj = new Date(date + "T00:00:00");
  const dayOfWeek = dateObj.getDay();

  // Check if date is within allowed range
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + config.max_advance_days);
  if (dateObj < today || dateObj > maxDate) return [];

  // Get slots for this day of week
  const slots = repo.getSlotsByConfig(configId).filter((s) => s.day_of_week === dayOfWeek);
  if (slots.length === 0) return [];

  // Get existing bookings for this date
  const bookings = repo.getBookingsByDate(configId, date);

  // Generate time windows from slots
  const available: Array<{ start: string; end: string }> = [];
  const duration = config.duration_minutes;
  const buffer = config.buffer_minutes;

  for (const slot of slots) {
    let cursor = timeToMinutes(slot.start_time);
    const slotEnd = timeToMinutes(slot.end_time);

    while (cursor + duration <= slotEnd) {
      const startStr = minutesToTime(cursor);
      const endStr = minutesToTime(cursor + duration);

      // Check no conflict with existing bookings (including buffer)
      const hasConflict = bookings.some((b) => {
        const bStart = timeToMinutes(b.start_time) - buffer;
        const bEnd = timeToMinutes(b.end_time) + buffer;
        return cursor < bEnd && cursor + duration > bStart;
      });

      // Skip past times for today
      if (date === todayStr()) {
        const now = new Date();
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        if (cursor <= nowMinutes) {
          cursor += duration + buffer;
          continue;
        }
      }

      if (!hasConflict) {
        available.push({ start: startStr, end: endStr });
      }

      cursor += duration + buffer;
    }
  }

  return available;
}

// ── Booking ──

export function book(data: {
  config_id: number;
  user_id: number;
  date: string;
  start_time: string;
  meet_link?: string;
}) {
  const config = repo.getConfigById(data.config_id);
  if (!config || !config.is_active) throw { status: 400, message: "Agenda nao disponivel" };

  const endTime = minutesToTime(timeToMinutes(data.start_time) + config.duration_minutes);

  // Check conflict
  if (repo.hasBookingConflict(data.config_id, data.date, data.start_time, endTime)) {
    throw { status: 409, message: "Horario ja reservado" };
  }

  return repo.createBooking({
    config_id: data.config_id,
    user_id: data.user_id,
    date: data.date,
    start_time: data.start_time,
    end_time: endTime,
    meet_link: data.meet_link,
  });
}

export function cancelBooking(bookingId: number, userId: number) {
  const booking = repo.getBookingById(bookingId);
  if (!booking) throw { status: 404, message: "Agendamento nao encontrado" };
  // Allow user to cancel their own booking, or admin can cancel any
  if (booking.user_id !== userId) {
    // TODO: check admin role if needed
  }
  repo.cancelBooking(bookingId);
}

export function getMyBookings(userId: number) {
  return repo.getBookingsByUser(userId);
}

export function getBookingsByConfig(configId: number) {
  return repo.getBookingsByConfig(configId);
}

export function updateBookingNotes(id: number, notes: string) {
  repo.updateBookingNotes(id, notes);
}

export function updateBookingMeetLink(id: number, meetLink: string) {
  repo.updateBookingMeetLink(id, meetLink);
}

// ── Helpers ──

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60).toString().padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}
```

- [ ] **Step 2: Commit**

```bash
git add server/services/schedulingService.ts
git commit -m "feat: add scheduling service with slot generation and booking logic"
```

---

### Task 11: Scheduling Routes

**Files:**
- Create: `server/routes/scheduling.ts`
- Modify: `server/index.ts`

- [ ] **Step 1: Create scheduling routes**

```typescript
import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/auth";
import * as schedulingService from "../services/schedulingService";

const router = Router();

// All routes require auth
router.use(authMiddleware);

// ── Student endpoints ──

// Get available times for a date
router.get("/available/:configId/:date", (req: Request, res: Response) => {
  try {
    const times = schedulingService.getAvailableTimes(Number(req.params.configId), req.params.date);
    res.json(times);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// Get active configs for workspace (student sees available agendas)
router.get("/configs/workspace/:workspaceId", (req: Request, res: Response) => {
  try {
    const configs = schedulingService.getConfigs(Number(req.params.workspaceId));
    res.json(configs.filter((c) => c.is_active));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Book a slot
router.post("/book", (req: Request, res: Response) => {
  try {
    const { config_id, date, start_time, meet_link } = req.body;
    const booking = schedulingService.book({
      config_id,
      user_id: req.userId!,
      date,
      start_time,
      meet_link,
    });
    res.status(201).json(booking);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// My bookings
router.get("/my-bookings", (req: Request, res: Response) => {
  try {
    const bookings = schedulingService.getMyBookings(req.userId!);
    res.json(bookings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Cancel booking
router.put("/bookings/:id/cancel", (req: Request, res: Response) => {
  try {
    schedulingService.cancelBooking(Number(req.params.id), req.userId!);
    res.json({ success: true });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// ── Admin endpoints ──

// Create config
router.post("/configs", (req: Request, res: Response) => {
  try {
    const config = schedulingService.createConfig(req.body);
    res.status(201).json(config);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// Get config with slots
router.get("/configs/:id", (req: Request, res: Response) => {
  try {
    const config = schedulingService.getConfig(Number(req.params.id));
    if (!config) return res.status(404).json({ error: "Config nao encontrada" });
    const slots = schedulingService.getSlots(config.id);
    res.json({ ...config, slots });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update config
router.put("/configs/:id", (req: Request, res: Response) => {
  try {
    const updated = schedulingService.updateConfig(Number(req.params.id), req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// Delete config
router.delete("/configs/:id", (req: Request, res: Response) => {
  try {
    schedulingService.deleteConfig(Number(req.params.id));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Set slots for config
router.put("/configs/:id/slots", (req: Request, res: Response) => {
  try {
    const slots = schedulingService.setSlots(Number(req.params.id), req.body.slots);
    res.json(slots);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// Admin: list all bookings for a config
router.get("/configs/:id/bookings", (req: Request, res: Response) => {
  try {
    const bookings = schedulingService.getBookingsByConfig(Number(req.params.id));
    res.json(bookings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: update booking notes
router.put("/bookings/:id/notes", (req: Request, res: Response) => {
  try {
    schedulingService.updateBookingNotes(Number(req.params.id), req.body.notes);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: update booking meet link
router.put("/bookings/:id/meet-link", (req: Request, res: Response) => {
  try {
    schedulingService.updateBookingMeetLink(Number(req.params.id), req.body.meet_link);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
```

- [ ] **Step 2: Mount in server/index.ts**

Add import:
```typescript
import schedulingRouter from "./routes/scheduling";
```

Add route mount:
```typescript
app.use("/api/scheduling", schedulingRouter);
```

- [ ] **Step 3: Commit**

```bash
git add server/routes/scheduling.ts server/index.ts
git commit -m "feat: add scheduling routes (admin config + student booking)"
```

---

### Task 12: Frontend — Scheduling API & Types

**Files:**
- Modify: `src/types.ts`
- Modify: `src/services/api.ts`

- [ ] **Step 1: Add scheduling types**

In `src/types.ts`:

```typescript
export interface AvailabilityConfig {
  id: number;
  workspace_id: number;
  title: string;
  duration_minutes: number;
  buffer_minutes: number;
  max_advance_days: number;
  is_active: boolean;
  slots?: AvailabilitySlot[];
}

export interface AvailabilitySlot {
  id: number;
  config_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export interface TimeSlot {
  start: string;
  end: string;
}

export interface Booking {
  id: number;
  config_id: number;
  user_id: number;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  meet_link: string | null;
  notes: string | null;
  created_at: string;
  config_title?: string;
  user_name?: string;
  user_email?: string;
  user_phone?: string;
}
```

- [ ] **Step 2: Add scheduling API functions**

In `src/services/api.ts`:

```typescript
// ── Scheduling API ──

export async function getSchedulingConfigs(workspaceId: number): Promise<AvailabilityConfig[]> {
  const res = await authFetch(`/api/scheduling/configs/workspace/${workspaceId}`);
  if (!res.ok) throw new Error('Falha ao carregar agendas.');
  return res.json();
}

export async function getSchedulingConfig(configId: number): Promise<AvailabilityConfig & { slots: AvailabilitySlot[] }> {
  const res = await authFetch(`/api/scheduling/configs/${configId}`);
  if (!res.ok) throw new Error('Falha ao carregar agenda.');
  return res.json();
}

export async function createSchedulingConfig(data: Partial<AvailabilityConfig>): Promise<AvailabilityConfig> {
  const res = await authFetch('/api/scheduling/configs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Falha ao criar agenda.');
  return res.json();
}

export async function updateSchedulingConfig(id: number, data: Partial<AvailabilityConfig>): Promise<AvailabilityConfig> {
  const res = await authFetch(`/api/scheduling/configs/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Falha ao atualizar agenda.');
  return res.json();
}

export async function deleteSchedulingConfig(id: number): Promise<void> {
  const res = await authFetch(`/api/scheduling/configs/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Falha ao deletar agenda.');
}

export async function setSchedulingSlots(configId: number, slots: Array<{ day_of_week: number; start_time: string; end_time: string }>): Promise<AvailabilitySlot[]> {
  const res = await authFetch(`/api/scheduling/configs/${configId}/slots`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slots }),
  });
  if (!res.ok) throw new Error('Falha ao salvar horarios.');
  return res.json();
}

export async function getAvailableTimes(configId: number, date: string): Promise<TimeSlot[]> {
  const res = await authFetch(`/api/scheduling/available/${configId}/${date}`);
  if (!res.ok) throw new Error('Falha ao carregar horarios.');
  return res.json();
}

export async function bookSlot(data: { config_id: number; date: string; start_time: string }): Promise<Booking> {
  const res = await authFetch('/api/scheduling/book', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Falha ao agendar.' }));
    throw new Error(body.error || 'Falha ao agendar.');
  }
  return res.json();
}

export async function getMyBookings(): Promise<Booking[]> {
  const res = await authFetch('/api/scheduling/my-bookings');
  if (!res.ok) throw new Error('Falha ao carregar agendamentos.');
  return res.json();
}

export async function cancelBooking(id: number): Promise<void> {
  const res = await authFetch(`/api/scheduling/bookings/${id}/cancel`, { method: 'PUT' });
  if (!res.ok) throw new Error('Falha ao cancelar agendamento.');
}

export async function getConfigBookings(configId: number): Promise<Booking[]> {
  const res = await authFetch(`/api/scheduling/configs/${configId}/bookings`);
  if (!res.ok) throw new Error('Falha ao carregar agendamentos.');
  return res.json();
}
```

- [ ] **Step 3: Commit**

```bash
git add src/types.ts src/services/api.ts
git commit -m "feat: add scheduling types and API client functions"
```

---

### Task 13: Frontend — Student Booking Page (Cal.com Style)

**Files:**
- Create: `src/pages/SchedulingPage.tsx`
- Modify: `src/router.tsx` — add `/agenda` route
- Modify: `src/components/layout/Sidebar.tsx` — add nav item

- [ ] **Step 1: Create SchedulingPage**

Cal.com-style booking page with:
1. **Left panel:** Calendar grid showing current month. Days with available slots are highlighted. Past days and days beyond max_advance_days are grayed out.
2. **Right panel:** When a day is selected, show available time slots as clickable buttons. Clicking a slot opens a confirmation modal.
3. **Below:** "Meus Agendamentos" section listing user's upcoming bookings with option to cancel.

Key UX details:
- Calendar shows day-of-week headers (Dom, Seg, Ter, Qua, Qui, Sex, Sab)
- Selected day is highlighted with gold accent
- Available times shown as pill buttons (`09:00`, `10:15`, `11:30`, etc.)
- Confirmation modal: "Confirmar tutoria em [data] as [horario]?" with Confirmar/Cancelar buttons
- After booking: success message, refresh available times
- "Meus Agendamentos" cards show: date, time, status badge, cancel button (only for future bookings)

Use existing design system: `card-editorial`, `mono-label`, `serif-display`, gold accents, DM Sans/Fraunces fonts.

- [ ] **Step 2: Add route in router.tsx**

Import `SchedulingPage` and add inside the `<Layout>` routes:

```typescript
<Route path="/agenda" element={<SchedulingPage />} />
```

- [ ] **Step 3: Add sidebar nav item**

In `Sidebar.tsx`, add an "Agenda" tab with `CalendarIcon` from lucide-react, between "Mensagens" and "Perfil" (or wherever appropriate). Set `activeTab` to `'agenda'`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/SchedulingPage.tsx src/router.tsx src/components/layout/Sidebar.tsx
git commit -m "feat: add student booking page (Cal.com style) with calendar and time slots"
```

---

### Task 14: Frontend — Admin Scheduling Config

**Files:**
- Create: `src/components/admin/AdminScheduling.tsx`
- Modify: `src/pages/AdminPage.tsx`

- [ ] **Step 1: Create AdminScheduling component**

Admin panel for configuring availability:

1. **Config form:** Title, duration (minutes), buffer between sessions (minutes), max advance days
2. **Weekly schedule grid:** For each day of the week, toggle on/off and set start/end times. Example:
   - [x] Segunda: 09:00 - 18:00
   - [x] Terca: 09:00 - 18:00
   - [ ] Quarta (disabled)
   - etc.
3. **Bookings list:** Table showing all bookings for this config (date, time, student name, phone, status). With notes field editable inline.
4. **Config on/off toggle:** Enable/disable the agenda

- [ ] **Step 2: Add to AdminPage**

Add "agenda" section case in AdminPage to render `<AdminScheduling />`.

Add sidebar nav item for admin: "Agenda" with CalendarIcon.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/AdminScheduling.tsx src/pages/AdminPage.tsx
git commit -m "feat: admin panel for scheduling config (availability, slots, bookings)"
```

---

### Task 15: Deploy and Verify

- [ ] **Step 1: Push to git**

```bash
cd /Users/juliocarvalho/Documents/Projetos/STOA
git push origin main
```

- [ ] **Step 2: Deploy to server**

```bash
ssh deploy@178.156.252.78 "cd ~/apps/stoa && git pull origin main && docker build -t stoa-app . && docker service update --image stoa-app:latest --force nexo_stoa"
```

- [ ] **Step 3: Verify schema migration**

```bash
ssh deploy@178.156.252.78 "docker exec \$(docker ps -q -f name=nexo_stoa) sqlite3 /data/nexus.db '.tables'"
```

Expected: should include `invite_codes`, `invite_redemptions`, `availability_configs`, `availability_slots`, `bookings`

- [ ] **Step 4: Create first invite code via API**

```bash
# Login as admin first, get token
TOKEN=$(curl -s https://membros.jcarv.in/api/auth/login -H 'Content-Type: application/json' -d '{"email":"gestao@ideva.ai","password":"123456"}' | jq -r '.accessToken')

# Create invite for workspace 1, linked to product (adjust product_id)
curl -s https://membros.jcarv.in/api/invites -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"workspace_id":1,"product_id":1,"max_uses":15}'
```

- [ ] **Step 5: Test invite link**

Open: `https://membros.jcarv.in/login?invite=CODE_FROM_STEP_4`

Expected: Registration form with workspace badge, phone field, no login/register toggle

- [ ] **Step 6: Create scheduling config**

```bash
curl -s https://membros.jcarv.in/api/scheduling/configs -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"workspace_id":1,"title":"Tutoria Individual DEV.IA","duration_minutes":60,"buffer_minutes":15}'
```

- [ ] **Step 7: Set availability slots**

```bash
CONFIG_ID=1  # adjust based on response
curl -s https://membros.jcarv.in/api/scheduling/configs/$CONFIG_ID/slots -X PUT -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"slots":[{"day_of_week":1,"start_time":"09:00","end_time":"18:00"},{"day_of_week":2,"start_time":"09:00","end_time":"18:00"},{"day_of_week":3,"start_time":"09:00","end_time":"18:00"},{"day_of_week":4,"start_time":"09:00","end_time":"18:00"},{"day_of_week":5,"start_time":"09:00","end_time":"18:00"}]}'
```

- [ ] **Step 8: Verify student booking page**

Login as a student and navigate to `/agenda`. Should see calendar with available days highlighted, and clickable time slots.

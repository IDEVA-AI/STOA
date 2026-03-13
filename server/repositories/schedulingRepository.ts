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
  day_of_week: number;
  start_time: string;
  end_time: string;
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
  return (
    (db
      .prepare("SELECT * FROM availability_configs WHERE id = ?")
      .get(id) as AvailabilityConfig) || null
  );
}

export function getConfigsByWorkspace(
  workspaceId: number
): AvailabilityConfig[] {
  return db
    .prepare("SELECT * FROM availability_configs WHERE workspace_id = ?")
    .all(workspaceId) as AvailabilityConfig[];
}

export function updateConfig(
  id: number,
  data: Partial<{
    title: string;
    duration_minutes: number;
    buffer_minutes: number;
    max_advance_days: number;
    is_active: number;
  }>
): void {
  const fields: string[] = [];
  const values: any[] = [];
  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) {
      fields.push(`${key} = ?`);
      values.push(val);
    }
  }
  if (fields.length === 0) return;
  values.push(id);
  db.prepare(
    `UPDATE availability_configs SET ${fields.join(", ")} WHERE id = ?`
  ).run(...values);
}

export function deleteConfig(id: number): void {
  db.prepare("DELETE FROM availability_configs WHERE id = ?").run(id);
}

// ── Slots ──

export function getSlotsByConfig(configId: number): AvailabilitySlot[] {
  return db
    .prepare(
      "SELECT * FROM availability_slots WHERE config_id = ? ORDER BY day_of_week, start_time"
    )
    .all(configId) as AvailabilitySlot[];
}

export function setSlots(
  configId: number,
  slots: Array<{ day_of_week: number; start_time: string; end_time: string }>
): void {
  const tx = db.transaction(() => {
    db.prepare("DELETE FROM availability_slots WHERE config_id = ?").run(
      configId
    );
    const insert = db.prepare(
      "INSERT INTO availability_slots (config_id, day_of_week, start_time, end_time) VALUES (?, ?, ?, ?)"
    );
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
    .run(
      data.config_id,
      data.user_id,
      data.date,
      data.start_time,
      data.end_time,
      data.meet_link ?? null
    );
  return getBookingById(Number(result.lastInsertRowid))!;
}

export function getBookingById(id: number): Booking | null {
  return (
    (db
      .prepare("SELECT * FROM bookings WHERE id = ?")
      .get(id) as Booking) || null
  );
}

export function getBookingsByDate(configId: number, date: string): Booking[] {
  return db
    .prepare(
      "SELECT * FROM bookings WHERE config_id = ? AND date = ? AND status = 'confirmed' ORDER BY start_time"
    )
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

export function hasBookingConflict(
  configId: number,
  date: string,
  startTime: string,
  endTime: string
): boolean {
  return !!db
    .prepare(
      "SELECT 1 FROM bookings WHERE config_id = ? AND date = ? AND status = 'confirmed' AND start_time < ? AND end_time > ? LIMIT 1"
    )
    .get(configId, date, endTime, startTime);
}

export function updateBookingNotes(id: number, notes: string): void {
  db.prepare("UPDATE bookings SET notes = ? WHERE id = ?").run(notes, id);
}

export function updateBookingMeetLink(id: number, meetLink: string): void {
  db.prepare("UPDATE bookings SET meet_link = ? WHERE id = ?").run(
    meetLink,
    id
  );
}

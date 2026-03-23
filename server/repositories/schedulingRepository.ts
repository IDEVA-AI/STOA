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

export async function createConfig(data: {
  workspace_id: number;
  title?: string;
  duration_minutes?: number;
  buffer_minutes?: number;
  max_advance_days?: number;
}): Promise<AvailabilityConfig> {
  const result = await db.run(
    `INSERT INTO availability_configs (workspace_id, title, duration_minutes, buffer_minutes, max_advance_days)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [
      data.workspace_id,
      data.title ?? "Tutoria Individual",
      data.duration_minutes ?? 60,
      data.buffer_minutes ?? 15,
      data.max_advance_days ?? 30,
    ]
  );
  return (await getConfigById(result.rows[0].id))!;
}

export async function getConfigById(id: number): Promise<AvailabilityConfig | null> {
  return db.get<AvailabilityConfig>(
    "SELECT * FROM availability_configs WHERE id = $1",
    [id]
  );
}

export async function getConfigsByWorkspace(
  workspaceId: number
): Promise<AvailabilityConfig[]> {
  return db.all<AvailabilityConfig>(
    "SELECT * FROM availability_configs WHERE workspace_id = $1",
    [workspaceId]
  );
}

export async function updateConfig(
  id: number,
  data: Partial<{
    title: string;
    duration_minutes: number;
    buffer_minutes: number;
    max_advance_days: number;
    is_active: number;
  }>
): Promise<void> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) {
      fields.push(`${key} = $${paramIndex}`);
      values.push(val);
      paramIndex++;
    }
  }
  if (fields.length === 0) return;

  values.push(id);
  await db.run(
    `UPDATE availability_configs SET ${fields.join(", ")} WHERE id = $${paramIndex}`,
    values
  );
}

export async function deleteConfig(id: number): Promise<void> {
  await db.run("DELETE FROM availability_configs WHERE id = $1", [id]);
}

// ── Slots ──

export async function getSlotsByConfig(configId: number): Promise<AvailabilitySlot[]> {
  return db.all<AvailabilitySlot>(
    "SELECT * FROM availability_slots WHERE config_id = $1 ORDER BY day_of_week, start_time",
    [configId]
  );
}

export async function setSlots(
  configId: number,
  slots: Array<{ day_of_week: number; start_time: string; end_time: string }>
): Promise<void> {
  await db.transaction(async (client) => {
    await client.query("DELETE FROM availability_slots WHERE config_id = $1", [configId]);
    for (const slot of slots) {
      await client.query(
        "INSERT INTO availability_slots (config_id, day_of_week, start_time, end_time) VALUES ($1, $2, $3, $4)",
        [configId, slot.day_of_week, slot.start_time, slot.end_time]
      );
    }
  });
}

// ── Bookings ──

export async function createBooking(data: {
  config_id: number;
  user_id: number;
  date: string;
  start_time: string;
  end_time: string;
  meet_link?: string;
}): Promise<Booking> {
  const result = await db.run(
    `INSERT INTO bookings (config_id, user_id, date, start_time, end_time, meet_link)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [
      data.config_id,
      data.user_id,
      data.date,
      data.start_time,
      data.end_time,
      data.meet_link ?? null,
    ]
  );
  return (await getBookingById(result.rows[0].id))!;
}

export async function getBookingById(id: number): Promise<Booking | null> {
  return db.get<Booking>(
    "SELECT * FROM bookings WHERE id = $1",
    [id]
  );
}

export async function getBookingsByDate(configId: number, date: string): Promise<Booking[]> {
  return db.all<Booking>(
    "SELECT * FROM bookings WHERE config_id = $1 AND date = $2 AND status = 'confirmed' ORDER BY start_time",
    [configId, date]
  );
}

export async function getBookingsByUser(userId: number): Promise<Booking[]> {
  return db.all<Booking>(
    `SELECT b.*, ac.title AS config_title
     FROM bookings b
     JOIN availability_configs ac ON ac.id = b.config_id
     WHERE b.user_id = $1
     ORDER BY b.date DESC, b.start_time DESC`,
    [userId]
  );
}

export async function getBookingsByConfig(configId: number): Promise<Booking[]> {
  return db.all<Booking>(
    `SELECT b.*, u.name AS user_name, u.email AS user_email, u.phone AS user_phone
     FROM bookings b
     JOIN users u ON u.id = b.user_id
     WHERE b.config_id = $1
     ORDER BY b.date ASC, b.start_time ASC`,
    [configId]
  );
}

export async function cancelBooking(id: number): Promise<void> {
  await db.run("UPDATE bookings SET status = 'cancelled' WHERE id = $1", [id]);
}

export async function hasBookingConflict(
  configId: number,
  date: string,
  startTime: string,
  endTime: string
): Promise<boolean> {
  const row = await db.get(
    "SELECT 1 FROM bookings WHERE config_id = $1 AND date = $2 AND status = 'confirmed' AND start_time < $3 AND end_time > $4 LIMIT 1",
    [configId, date, endTime, startTime]
  );
  return !!row;
}

export async function updateBookingNotes(id: number, notes: string): Promise<void> {
  await db.run("UPDATE bookings SET notes = $1 WHERE id = $2", [notes, id]);
}

export async function updateBookingMeetLink(id: number, meetLink: string): Promise<void> {
  await db.run("UPDATE bookings SET meet_link = $1 WHERE id = $2", [meetLink, id]);
}

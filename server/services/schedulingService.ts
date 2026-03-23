import * as repo from "../repositories/schedulingRepository";

// ── Config ──

export async function createConfig(data: {
  workspace_id: number;
  title?: string;
  duration_minutes?: number;
  buffer_minutes?: number;
  max_advance_days?: number;
}) {
  return await repo.createConfig(data);
}

export async function getConfigs(workspaceId: number) {
  return await repo.getConfigsByWorkspace(workspaceId);
}

export async function getConfig(id: number) {
  return await repo.getConfigById(id);
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
) {
  await repo.updateConfig(id, data);
  return await repo.getConfigById(id);
}

export async function deleteConfig(id: number) {
  await repo.deleteConfig(id);
}

// ── Slots ──

export async function getSlots(configId: number) {
  return await repo.getSlotsByConfig(configId);
}

export async function setSlots(
  configId: number,
  slots: Array<{ day_of_week: number; start_time: string; end_time: string }>
) {
  await repo.setSlots(configId, slots);
  return await repo.getSlotsByConfig(configId);
}

// ── Available times ──

export async function getAvailableTimes(
  configId: number,
  date: string
): Promise<Array<{ start: string; end: string }>> {
  const config = await repo.getConfigById(configId);
  if (!config || !config.is_active) return [];

  const dateObj = new Date(date + "T00:00:00");
  const dayOfWeek = dateObj.getDay();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + config.max_advance_days);
  if (dateObj < today || dateObj > maxDate) return [];

  const allSlots = await repo.getSlotsByConfig(configId);
  const slots = allSlots.filter((s) => s.day_of_week === dayOfWeek);
  if (slots.length === 0) return [];

  const bookings = await repo.getBookingsByDate(configId, date);
  const available: Array<{ start: string; end: string }> = [];
  const duration = config.duration_minutes;
  const buffer = config.buffer_minutes;

  for (const slot of slots) {
    let cursor = timeToMinutes(slot.start_time);
    const slotEnd = timeToMinutes(slot.end_time);

    while (cursor + duration <= slotEnd) {
      const startStr = minutesToTime(cursor);
      const endStr = minutesToTime(cursor + duration);

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

export async function book(data: {
  config_id: number;
  user_id: number;
  date: string;
  start_time: string;
  meet_link?: string;
}) {
  const config = await repo.getConfigById(data.config_id);
  if (!config || !config.is_active)
    throw { status: 400, message: "Agenda nao disponivel" };

  const endTime = minutesToTime(
    timeToMinutes(data.start_time) + config.duration_minutes
  );

  if (
    await repo.hasBookingConflict(data.config_id, data.date, data.start_time, endTime)
  ) {
    throw { status: 409, message: "Horario ja reservado" };
  }

  return await repo.createBooking({
    config_id: data.config_id,
    user_id: data.user_id,
    date: data.date,
    start_time: data.start_time,
    end_time: endTime,
    meet_link: data.meet_link,
  });
}

export async function cancelBooking(bookingId: number, userId: number) {
  const booking = await repo.getBookingById(bookingId);
  if (!booking)
    throw { status: 404, message: "Agendamento nao encontrado" };
  await repo.cancelBooking(bookingId);
}

export async function getMyBookings(userId: number) {
  return await repo.getBookingsByUser(userId);
}

export async function getBookingsByConfig(configId: number) {
  return await repo.getBookingsByConfig(configId);
}

export async function updateBookingNotes(id: number, notes: string) {
  await repo.updateBookingNotes(id, notes);
}

export async function updateBookingMeetLink(id: number, meetLink: string) {
  await repo.updateBookingMeetLink(id, meetLink);
}

// ── Helpers ──

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

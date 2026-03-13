import * as repo from "../repositories/schedulingRepository";

// ── Config ──

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

export function updateConfig(
  id: number,
  data: Partial<{
    title: string;
    duration_minutes: number;
    buffer_minutes: number;
    max_advance_days: number;
    is_active: number;
  }>
) {
  repo.updateConfig(id, data);
  return repo.getConfigById(id);
}

export function deleteConfig(id: number) {
  repo.deleteConfig(id);
}

// ── Slots ──

export function getSlots(configId: number) {
  return repo.getSlotsByConfig(configId);
}

export function setSlots(
  configId: number,
  slots: Array<{ day_of_week: number; start_time: string; end_time: string }>
) {
  repo.setSlots(configId, slots);
  return repo.getSlotsByConfig(configId);
}

// ── Available times ──

export function getAvailableTimes(
  configId: number,
  date: string
): Array<{ start: string; end: string }> {
  const config = repo.getConfigById(configId);
  if (!config || !config.is_active) return [];

  const dateObj = new Date(date + "T00:00:00");
  const dayOfWeek = dateObj.getDay();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + config.max_advance_days);
  if (dateObj < today || dateObj > maxDate) return [];

  const slots = repo
    .getSlotsByConfig(configId)
    .filter((s) => s.day_of_week === dayOfWeek);
  if (slots.length === 0) return [];

  const bookings = repo.getBookingsByDate(configId, date);
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

export function book(data: {
  config_id: number;
  user_id: number;
  date: string;
  start_time: string;
  meet_link?: string;
}) {
  const config = repo.getConfigById(data.config_id);
  if (!config || !config.is_active)
    throw { status: 400, message: "Agenda nao disponivel" };

  const endTime = minutesToTime(
    timeToMinutes(data.start_time) + config.duration_minutes
  );

  if (
    repo.hasBookingConflict(data.config_id, data.date, data.start_time, endTime)
  ) {
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
  if (!booking)
    throw { status: 404, message: "Agendamento nao encontrado" };
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
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

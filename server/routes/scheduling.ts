import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/auth";
import * as schedulingService from "../services/schedulingService";

const router = Router();
router.use(authMiddleware);

// Student: get available times for a date
router.get("/available/:configId/:date", async (req: Request, res: Response) => {
  try {
    const times = await schedulingService.getAvailableTimes(
      Number(req.params.configId),
      req.params.date
    );
    res.json(times);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// Student: get active configs for workspace
router.get(
  "/configs/workspace/:workspaceId",
  async (req: Request, res: Response) => {
    try {
      const configs = await schedulingService.getConfigs(
        Number(req.params.workspaceId)
      );
      res.json(configs.filter((c: any) => c.is_active));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Student: book a slot
router.post("/book", async (req: Request, res: Response) => {
  try {
    const { config_id, date, start_time, meet_link } = req.body;
    const booking = await schedulingService.book({
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

// Student: my bookings
router.get("/my-bookings", async (req: Request, res: Response) => {
  try {
    const bookings = await schedulingService.getMyBookings(req.userId!);
    res.json(bookings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Student: cancel booking
router.put("/bookings/:id/cancel", async (req: Request, res: Response) => {
  try {
    await schedulingService.cancelBooking(Number(req.params.id), req.userId!);
    res.json({ success: true });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// Admin: create config
router.post("/configs", async (req: Request, res: Response) => {
  try {
    const config = await schedulingService.createConfig(req.body);
    res.status(201).json(config);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// Admin: get config with slots
router.get("/configs/:id", async (req: Request, res: Response) => {
  try {
    const config = await schedulingService.getConfig(Number(req.params.id));
    if (!config)
      return res.status(404).json({ error: "Config nao encontrada" });
    const slots = await schedulingService.getSlots(config.id);
    res.json({ ...config, slots });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: update config
router.put("/configs/:id", async (req: Request, res: Response) => {
  try {
    const updated = await schedulingService.updateConfig(
      Number(req.params.id),
      req.body
    );
    res.json(updated);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// Admin: delete config
router.delete("/configs/:id", async (req: Request, res: Response) => {
  try {
    await schedulingService.deleteConfig(Number(req.params.id));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: set slots for config
router.put("/configs/:id/slots", async (req: Request, res: Response) => {
  try {
    const slots = await schedulingService.setSlots(
      Number(req.params.id),
      req.body.slots
    );
    res.json(slots);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// Admin: list all bookings for config
router.get("/configs/:id/bookings", async (req: Request, res: Response) => {
  try {
    const bookings = await schedulingService.getBookingsByConfig(
      Number(req.params.id)
    );
    res.json(bookings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: update booking notes
router.put("/bookings/:id/notes", async (req: Request, res: Response) => {
  try {
    await schedulingService.updateBookingNotes(
      Number(req.params.id),
      req.body.notes
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: update booking meet link
router.put("/bookings/:id/meet-link", async (req: Request, res: Response) => {
  try {
    await schedulingService.updateBookingMeetLink(
      Number(req.params.id),
      req.body.meet_link
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

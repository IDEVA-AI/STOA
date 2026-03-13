import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/auth";
import * as schedulingService from "../services/schedulingService";

const router = Router();
router.use(authMiddleware);

// Student: get available times for a date
router.get("/available/:configId/:date", (req: Request, res: Response) => {
  try {
    const times = schedulingService.getAvailableTimes(
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
  (req: Request, res: Response) => {
    try {
      const configs = schedulingService.getConfigs(
        Number(req.params.workspaceId)
      );
      res.json(configs.filter((c: any) => c.is_active));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Student: book a slot
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

// Student: my bookings
router.get("/my-bookings", (req: Request, res: Response) => {
  try {
    const bookings = schedulingService.getMyBookings(req.userId!);
    res.json(bookings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Student: cancel booking
router.put("/bookings/:id/cancel", (req: Request, res: Response) => {
  try {
    schedulingService.cancelBooking(Number(req.params.id), req.userId!);
    res.json({ success: true });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// Admin: create config
router.post("/configs", (req: Request, res: Response) => {
  try {
    const config = schedulingService.createConfig(req.body);
    res.status(201).json(config);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// Admin: get config with slots
router.get("/configs/:id", (req: Request, res: Response) => {
  try {
    const config = schedulingService.getConfig(Number(req.params.id));
    if (!config)
      return res.status(404).json({ error: "Config nao encontrada" });
    const slots = schedulingService.getSlots(config.id);
    res.json({ ...config, slots });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: update config
router.put("/configs/:id", (req: Request, res: Response) => {
  try {
    const updated = schedulingService.updateConfig(
      Number(req.params.id),
      req.body
    );
    res.json(updated);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// Admin: delete config
router.delete("/configs/:id", (req: Request, res: Response) => {
  try {
    schedulingService.deleteConfig(Number(req.params.id));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: set slots for config
router.put("/configs/:id/slots", (req: Request, res: Response) => {
  try {
    const slots = schedulingService.setSlots(
      Number(req.params.id),
      req.body.slots
    );
    res.json(slots);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// Admin: list all bookings for config
router.get("/configs/:id/bookings", (req: Request, res: Response) => {
  try {
    const bookings = schedulingService.getBookingsByConfig(
      Number(req.params.id)
    );
    res.json(bookings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: update booking notes
router.put("/bookings/:id/notes", (req: Request, res: Response) => {
  try {
    schedulingService.updateBookingNotes(
      Number(req.params.id),
      req.body.notes
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: update booking meet link
router.put("/bookings/:id/meet-link", (req: Request, res: Response) => {
  try {
    schedulingService.updateBookingMeetLink(
      Number(req.params.id),
      req.body.meet_link
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

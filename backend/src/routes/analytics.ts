import { Router } from "express";
import { indexer } from "../services/indexer";

const router = Router();

// GET /api/analytics/activity
// Returns global timeline feed
router.get("/activity", (req, res) => {
    const activity = indexer.getGlobalActivity();
    res.json({ ok: true, activity });
});

// GET /api/analytics/history/:address
// Returns user specific history
router.get("/history/:address", (req, res) => {
    const { address } = req.params;
    const history = indexer.getUserHistory(address);
    res.json({ ok: true, history });
});

export default router;

import { Router } from "express";
import { businessService } from "../services/business";

const router = Router();

// GET /api/business/report/:teamId
router.get("/report/:teamId", async (req, res) => {
    const { teamId } = req.params;
    try {
        const report = await businessService.generateContributionReport(teamId);
        res.json({ ok: true, report });
    } catch (err: any) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

// GET /api/business/export/csv/:teamId
router.get("/export/csv/:teamId", async (req, res) => {
    const { teamId } = req.params;
    try {
        const csv = await businessService.exportCSV(teamId);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=contribution_report_${teamId}.csv`);
        res.status(200).send(csv);
    } catch (err: any) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

export default router;

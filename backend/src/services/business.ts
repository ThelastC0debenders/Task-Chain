import { indexer } from "./indexer";

export interface ContributionReport {
    totalTasks: number;
    completedTasks: number;
    totalContributors: number;
    recentActivity: any[];
    velocity: { date: string, count: number }[];
    disputes: any[];
}

export class BusinessService {

    public async generateContributionReport(teamId: string): Promise<ContributionReport> {
        const events = indexer.getGlobalActivity(); // For now global, could filter by team if metadata added

        // Filter events for this team (assuming taskId or metadata links them)
        // In this mock, we'll treat global activity as the "Hackathon" report

        const completed = events.filter(e => e.type === "COMPLETED");
        const contributors = new Set(events.map(e => e.actor)).size;

        // Calculate Velocity (past 7 days)
        const velocityMap = new Map<string, number>();
        const now = new Date();
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            velocityMap.set(date.toISOString().split('T')[0], 0);
        }

        completed.forEach(e => {
            const date = new Date(e.timestamp).toISOString().split('T')[0];
            if (velocityMap.has(date)) {
                velocityMap.set(date, (velocityMap.get(date) || 0) + 1);
            }
        });

        const velocity = Array.from(velocityMap.entries()).map(([date, count]) => ({ date, count }));

        // Identify Potential Disputes (Tasks completed without valid IPFS CID or description)
        // In real app, we check if proof metadata matches requirements
        const disputes = completed.filter(e => !e.details?.ipfsCid && !e.details?.link);

        return {
            totalTasks: events.filter(e => e.type === "CREATED").length,
            completedTasks: completed.length,
            totalContributors: contributors,
            recentActivity: events.slice(0, 5),
            velocity,
            disputes
        };
    }

    public async exportCSV(teamId: string): Promise<string> {
        const report = await this.generateContributionReport(teamId);
        const events = indexer.getGlobalActivity().filter(e => e.type === "COMPLETED");

        const headers = ["Task ID", "Executor", "Timestamp", "Proof Link", "Tx Hash"];
        const rows = events.map(e => [
            e.taskId,
            e.actor,
            new Date(e.timestamp).toISOString(),
            e.details?.link || "N/A",
            e.txHash
        ]);

        return [
            headers.join(","),
            ...rows.map(r => r.join(","))
        ].join("\n");
    }
}

export const businessService = new BusinessService();

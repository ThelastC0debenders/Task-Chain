import { ethers } from "ethers";
import TaskChainArtifact from "../../../contracts/artifacts/contracts/taskchain.sol/taskchain.json";

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Localhost default

interface TaskEvent {
    id: string; // uuid
    taskId: number;
    type: string; // 'CREATED' | 'CLAIMED' | 'COMPLETED' | 'EXPIRED'
    timestamp: number;
    actor: string;
    details?: any;
    txHash: string;
}

interface IndexedTask {
    id: number;
    creator: string;
    executor: string | null;
    status: string;
    history: TaskEvent[];
}

// In-Memory Database
const db = {
    tasks: new Map<number, IndexedTask>(),
    events: [] as TaskEvent[],
};

export class IndexerService {
    private provider: ethers.JsonRpcProvider;
    private contract: ethers.Contract;
    private isListening: boolean = false;

    constructor() {
        this.provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
        this.contract = new ethers.Contract(CONTRACT_ADDRESS, TaskChainArtifact.abi, this.provider);
    }

    public async startListening() {
        if (this.isListening) return;

        console.log("📡 [Indexer] Starting event listener...");

        try {
            // Replay all past events (optional - typically would fetch from block 0)
            // For now, we just listen to live events

            this.contract.on("TaskCreated", (taskId, creator, category, priority, event) => {
                this.handleEvent("CREATED", taskId, creator, event, { category, priority });
            });

            this.contract.on("TaskClaimed", (taskId, executor, commitment, deadline, event) => {
                this.handleEvent("CLAIMED", taskId, executor, event, { commitment, deadline });
            });

            this.contract.on("TaskCompleted", (taskId, executor, creator, event) => {
                this.handleEvent("COMPLETED", taskId, executor, event, { creator });
            });

            this.contract.on("ReceiptAnchored", (taskId, receiptHash, ipfsCid, event) => {
                // Enhance the COMPLETED event or add a separate PROOF event
                console.log(`[Indexer] Receipt Anchored for Task ${taskId}: ${ipfsCid}`);
            });

            this.isListening = true;
            console.log("✅ [Indexer] Listening for events");
        } catch (err) {
            console.error("❌ [Indexer] Failed to start:", err);
        }
    }

    private handleEvent(type: string, taskId: bigint | number, actor: string, event: any, details: any) {
        const tId = Number(taskId);
        const txHash = event.log ? event.log.transactionHash : "unknown";

        console.log(`📝 [Indexer] Event ${type} on Task #${tId} by ${actor}`);

        const newEvent: TaskEvent = {
            id: crypto.randomUUID(),
            taskId: tId,
            type,
            timestamp: Date.now(),
            actor,
            details,
            txHash
        };

        // Store Event
        db.events.push(newEvent);

        // Update Task State
        if (!db.tasks.has(tId)) {
            db.tasks.set(tId, {
                id: tId,
                creator: type === 'CREATED' ? actor : 'unknown',
                executor: null,
                status: 'OPEN',
                history: []
            });
        }

        const task = db.tasks.get(tId)!;
        task.history.push(newEvent);

        if (type === 'CLAIMED') {
            task.executor = actor;
            task.status = 'CLAIMED';
        } else if (type === 'COMPLETED') {
            task.status = 'COMPLETED';
        }
    }

    // API Methods
    public getGlobalActivity() {
        return db.events.sort((a, b) => b.timestamp - a.timestamp);
    }

    public getUserHistory(address: string) {
        return db.events.filter(e => e.actor.toLowerCase() === address.toLowerCase());
    }
}

export const indexer = new IndexerService();

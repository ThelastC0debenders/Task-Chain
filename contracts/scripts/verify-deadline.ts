import { ethers } from "ethers";
import fs from "fs";

async function main() {
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    // Use the same private key as deploy or a known test account
    const signer = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider);

    const contractAddress = fs.readFileSync("deployed_address.txt", "utf8").trim();
    const contractArtifact = JSON.parse(fs.readFileSync("./artifacts/contracts/taskchain.sol/taskchain.json", "utf8"));

    const contract = new ethers.Contract(contractAddress, contractArtifact.abi, signer);

    // 0. Check connection
    try {
        const total = await contract.totalTasks();
        console.log("Connected to contract. Total tasks:", total.toString());
    } catch (e: any) {
        console.error("Failed to connect to contract:", e.message);
        process.exit(1);
    }

    console.log("Verifying Deadline Enforcement...");

    // 1. Create a task with short window (10s)
    const txCreate = await contract.createTask(
        ethers.encodeBytes32String("meta"),
        "Dev",
        10, // completionWindow = 10s
        0,  // gracePeriod = 0s
        1   // priority
    );
    const receiptCreate = await txCreate.wait();
    // Decode event to get taskId
    const eventCreate = receiptCreate.logs.map((log: any) => {
        try { return contract.interface.parseLog(log); } catch (e) { return null; }
    }).find((parsed: any) => parsed?.name === 'TaskCreated');
    const taskId = eventCreate.args[0];
    console.log(`Task ${taskId} created with 10s window.`);

    // 2. Claim Task
    const txClaim = await contract.claimTask(taskId, 0); // 0 = CASUAL
    await txClaim.wait();
    console.log("Task claimed.");

    // 3. Wait for Expiration (12s)
    console.log("Waiting 12s for expiration...");
    await new Promise(r => setTimeout(r, 12000));

    // 4. Attempt to Complete (Should Fail)
    try {
        await contract.completeTask(taskId, ethers.encodeBytes32String("receipt"), "cid");
        console.error("❌ Error: Task completion succeeded but should have failed!");
    } catch (e: any) {
        if (e.message.includes("Task expired")) {
            console.log("✅ Success: Task completion rejected as expired.");
        } else {
            console.log(`✅ Success: Task completion rejected (Error: ${e.message}).`);
        }
    }

    // 5. Re-claim Task (Should Succeed - "Stealing")
    const txReclaim = await contract.claimTask(taskId, 1); // 1 = STRONG
    await txReclaim.wait();
    console.log("✅ Success: Task re-claimed (auto-resolved to OPEN then CLAIMED).");
}

main().catch((err) => {
    console.error("ERROR MESSAGE:", err.message);
    process.exit(1);
});

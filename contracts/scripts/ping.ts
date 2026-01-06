import { ethers } from "ethers";

async function main() {
    console.log("Connecting to provider...");
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    const block = await provider.getBlockNumber();
    console.log("Current block number:", block);
}

main().catch((err) => {
    console.error("Ping failed:", err);
    process.exit(1);
});

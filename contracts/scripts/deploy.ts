import { ethers } from "ethers";
import fs from "fs";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const rpcUrl = process.env.POLYGON_RPC_URL || "http://127.0.0.1:8545";
  let privateKey = process.env.PRIVATE_KEY;
  const isLocalhost = rpcUrl.includes("127.0.0.1") || rpcUrl.includes("localhost");

  if (!privateKey) {
    if (isLocalhost) {
      console.log("No PRIVATE_KEY found, using default Hardhat account for localhost.");
      privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
    } else {
      throw new Error("PRIVATE_KEY is missing. Please set it in your .env file.");
    }
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(privateKey, provider);

  console.log("Deploying contracts with:", signer.address);

  const contractPath = "./artifacts/contracts/taskchain.sol/taskchain.json";
  const contractData = JSON.parse(fs.readFileSync(contractPath, "utf8"));

  const factory = new ethers.ContractFactory(
    contractData.abi,
    contractData.bytecode,
    signer
  );

  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("taskchain deployed to:", address);
  fs.writeFileSync("deployed_address.txt", address);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

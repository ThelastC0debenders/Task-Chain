import { ethers } from "ethers";
import fs from "fs";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const rpcUrl = process.env.POLYGON_RPC_URL || "http://127.0.0.1:8545";
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) throw new Error("PRIVATE_KEY is missing");

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

  console.log("taskchain deployed to:", await contract.getAddress());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

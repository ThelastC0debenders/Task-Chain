import { ethers } from "ethers"
import { CHAIN_ID } from "../config/contract"

export async function connectWallet() {
  const ethereum = (window as any).ethereum
  if (!ethereum) {
    throw new Error("MetaMask not found")
  }

  const targetChainHex = `0x${CHAIN_ID.toString(16)}`

  // Ensure account access up front
  await ethereum.request({ method: "eth_requestAccounts" })

  let provider = new ethers.BrowserProvider(ethereum)
  let network = await provider.getNetwork()

  if (Number(network.chainId) !== CHAIN_ID) {
    try {
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: targetChainHex }],
      })
    } catch (switchError: any) {
      if (switchError?.code === 4902) {
        await ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: targetChainHex,
              chainName: "Hardhat Local",
              rpcUrls: ["http://127.0.0.1:8545"],
              nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
            },
          ],
        })
      } else {
        throw new Error("Wrong network")
      }
    }

    // Rebuild provider after switch to avoid ethers "network changed" errors
    provider = new ethers.BrowserProvider(ethereum)
    network = await provider.getNetwork()
    if (Number(network.chainId) !== CHAIN_ID) {
      throw new Error("Wrong network")
    }
  }

  const signer = await provider.getSigner()
  const address = await signer.getAddress()

  return { provider, signer, address }
}

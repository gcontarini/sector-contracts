import { ethers } from "hardhat";
import vaultAddr from "../vaultAddress.json";

export async function triggerBridge(vaultAddress: string, chainId: number, amount: number) {
  const VAULT = await ethers.getContractFactory("SectorVault");
  const vault = VAULT.attach(vaultAddress);

  // chainId, amount
  await vault.bridgeAssets(chainId, amount);
}

async function main() {
  const vault = vaultAddr.eth;
  const chainId = 4242;
  const amount = 21000001;

  console.log(`Trigger on vault: ${vault} to chain ${chainId} an amount ${amount}`)
  await triggerBridge(vault, chainId, amount);
  console.log('LET\'S GO!')
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
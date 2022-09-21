import { ethers } from "hardhat";
import vaultAddr from "../vaultAddress.json";

async function main() {
  const vaultAddress = vaultAddr.eth;

  const VAULT = await ethers.getContractFactory("SectorVault");
  const vault = VAULT.attach(vaultAddress);

  vault.on('bridgeAsset', (chainId, amount) => {
    console.log(`WE GOT AN EVENT on chain ${chainId} with value of ${amount}`)
  //     // Follow socket's api guide
  //     // End function with txs to the vault that will transfer funds to the bridge
  })

  // FOR LATER
  // Find out bridge address in destination chain -> impersonate whoever that has needed role
  // Trigger function to mint/emit tokens on destination
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
import { ethers } from "hardhat";
import { getQuote, getRouteTransactionData } from '../utils'
import vaultAddr from "../vaultAddress.json";

async function main() {
  const vaultAddress = vaultAddr.eth;

  const [deployer] = await ethers.getSigners()
  const owner = deployer.address

  const erc20Addresses = {
    testEth: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    testAvax: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E'
  }

  const VAULT = await ethers.getContractFactory("SectorVault");
  const vault = VAULT.attach(vaultAddress);

  vault.on('bridgeAsset', async (chainId, amount) => {
    console.log(`WE GOT AN EVENT on chain ${chainId} with value of ${amount}`)

    // Stores signer
    const signer = await ethers.getSigner(vaultAddress);

    // Bridging Params fetched from users
    const fromChainId = 1;
    const toChainId = 43114;

    const fromAssetAddress = erc20Addresses.testEth;
    const toAssetAddress = erc20Addresses.testAvax;
    const userAddress = vaultAddress;
    const uniqueRoutesPerBridge = true; // Returns the best route for a given DEX / bridge combination
    const sort = "output"; // "output" | "gas" | "time"

    // HAS TO USE MORE THAN TX
    const singleTxOnly = false;

    // For single transaction bridging, mark singleTxOnly flag as true in query params
    const quote = await getQuote(
      fromChainId,
      fromAssetAddress,
      toChainId, toAssetAddress,
      amount, userAddress,
      uniqueRoutesPerBridge,
      sort, singleTxOnly
    );
    // console.log("QUOTE", quote)
    // console.log("BRIDGE ERRORS", JSON.stringify(quote.result.bridgeRouteErrors))

    // Choosing first route from the returned route results
    const route = quote.result.routes[0];
    // console.log("ROUTE", route);

    const apiReturnData = await getRouteTransactionData(route);
    console.log("APIReturnData", apiReturnData)

    const VAULT = await ethers.getContractFactory("SectorVault");
    const vault = VAULT.attach(vaultAddress);

    await vault.approveForManager(amount, owner);

    const tx = await vault.contractCallERC20(
      apiReturnData.result.txTarget,
      apiReturnData.result.txData,
      apiReturnData.result.approvalData.approvalTokenAddress,
      apiReturnData.result.approvalData.allowanceTarget,
      apiReturnData.result.approvalData.minimumApprovalAmount
    );
    // console.log("TX", tx);
 })
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

/*

// Main function
async function main() {

    // Uses web3 wallet in browser as provider
    const provider = new ethers.providers.Web3Provider(window.ethereum, "any");

    // Prompt user for account connections
    await provider.send("eth_requestAccounts", []);


}
*/
import { ethers } from "hardhat";
import vaultAddr from "../vaultAddress.json";

const API_KEY = '645b2c8c-5825-4930-baf3-d9b997fcd88c'; // SOCKET PUBLIC API KEY

// Makes a GET request to Socket APIs for quote
async function getQuote(fromChainId, fromTokenAddress, toChainId, toTokenAddress, fromAmount, userAddress, uniqueRoutesPerBridge, sort, singleTxOnly) {
    const response = await fetch(`https://api.socket.tech/v2/quote?fromChainId=${fromChainId}&fromTokenAddress=${fromTokenAddress}&toChainId=${toChainId}&toTokenAddress=${toTokenAddress}&fromAmount=${fromAmount}&userAddress=${userAddress}&uniqueRoutesPerBridge=${uniqueRoutesPerBridge}&sort=${sort}&singleTxOnly=${singleTxOnly}`, {
        method: 'GET',
        headers: {
            'API-KEY': API_KEY,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    });

    const json = await response.json();
    return json;
}

// Makes a POST request to Socket APIs for swap/bridge transaction data
async function getRouteTransactionData(route) {
    const response = await fetch('https://api.socket.tech/v2/build-tx', {
        method: 'POST',
        headers: {
            'API-KEY': API_KEY,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ "route": route })
    });

    const json = await response.json();
    return json;
}

// GET request to check token allowance given to allowanceTarget by owner
async function checkAllowance(chainId, owner, allowanceTarget, tokenAddress) {
    const response = await fetch(`https://api.socket.tech/v2/approval/check-allowance?chainID=${chainId}&owner=${owner}&allowanceTarget=${allowanceTarget}&tokenAddress=${tokenAddress}`, {
        method: 'GET',
        headers: {
            'API-KEY': API_KEY,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    });

    const json = await response.json();
    return json;
}

// Fetches transaction data for token approval
async function getApprovalTransactionData(chainId, owner, allowanceTarget, tokenAddress, amount) {
    const response = await fetch(`https://api.socket.tech/v2/approval/build-tx?chainID=${chainId}&owner=${owner}&allowanceTarget=${allowanceTarget}&tokenAddress=${tokenAddress}&amount=${amount}`, {
        method: 'GET',
        headers: {
            'API-KEY': API_KEY,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    });

    const json = await response.json();
    return json;
}

// Fetches status of the bridging transaction
async function getBridgeStatus(transactionHash, fromChainId, toChainId) {
    const response = await fetch(`https://api.socket.tech/v2/bridge-status?transactionHash=${transactionHash}&fromChainId=${fromChainId}&toChainId=${toChainId}`, {
        method: 'GET',
        headers: {
            'API-KEY': API_KEY,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    });

    const json = await response.json();
    return json;
}

async function main() {
  const vaultAddress = vaultAddr.eth;

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
    console.log("QUOTE", quote)
    console.log("BRIDGE ERRORS", JSON.stringify(quote.result.bridgeRouteErrors))

    // WITH ONE TRANSACTION IS NOT POSSIBLE TO BRIDGE RIGHT NOW

    // Choosing first route from the returned route results
    const route = quote.result.routes[0];
    console.log("ROUTE", route);

    // FROM NOW ON IT'S ALL FUCKED
    // MUST CHECK MULTI TX EXAMPLE
    // CONTINUE HERE
    // Fetching transaction data for swap/bridge tx
    const apiReturnData = await getRouteTransactionData(route);
    console.log("APIReturnData", apiReturnData)

    const VAULT = await ethers.getContractFactory("SectorVault");
    const vault = VAULT.attach(vaultAddress);

    const tx = await vault.contractCallERC20(
      apiReturnData.result.txTarget,
      apiReturnData.result.txData,
      apiReturnData.result.approvalData.approvalTokenAddress,
      apiReturnData.result.approvalData.allowanceTarget,
      apiReturnData.result.approvalData.minimumApprovalAmount
    );
    console.log("TX", tx);

      // End function with txs to the vault that will transfer funds to the bridge
  })

  // FOR LATER
  // Find out bridge address in destination chain -> impersonate whoever that has needed role
  // Trigger function to mint/emit tokens on destination
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
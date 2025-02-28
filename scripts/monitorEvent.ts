import { ethers } from "hardhat";
import { getQuote, getRouteTransactionData, fundAccount } from '../utils';
import vaultAddr from "../vaultAddress.json";
import hre from 'hardhat'

async function main() {
    const vaultAddress = vaultAddr.eth;

    const [deployer] = await ethers.getSigners()
    const owner = deployer.address

    const erc20Addresses = {
        ethereum: {
            address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
            chainId: 1
        },
        arbitrium: {
            address: '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8',
            chainId: 42161
        },
        optmism : {
            address: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
            chainId: 10
        }
    }

    const VAULT = await ethers.getContractFactory("SectorVault");
    const vault = VAULT.attach(vaultAddress);

    const chainIs = hre.network.config.chainId
    const chainName = hre.network.name
    console.log("\n\ntesting chain id", chainIs, chainName);


    vault.on('bridgeAsset', async (_fromChainId, _toChainId, amount) => {

        console.log(`WE GOT AN EVENT on chain ${_fromChainId} to chain ${_toChainId} with value of ${amount}`)

        // Bridging Params fetched from users
        const fromChainId = _fromChainId;
        const toChainId = _toChainId;

        // get object with chainId === _fromChainId
        const fromChain = Object.values(erc20Addresses).find(chain => chain.chainId === fromChainId);
        const toChain = Object.values(erc20Addresses).find(chain => chain.chainId === toChainId);

        if (!fromChain || !toChain) {
            throw new Error('Chain not found');
        }

        console.log("testing amount", amount);

        // Set Socket quote request params
        const fromAssetAddress = fromChain.address;
        const toAssetAddress = toChain.address;
        const userAddress = vaultAddress; // The receiver address
        const uniqueRoutesPerBridge = true; // Set to true the best route for each bridge will be returned
        const sort = "output"; // "output" | "gas" | "time"
        const singleTxOnly = true; // Set to true to look for a single transaction route
        const isContractCall = true; // Don't know if still necessary

        // Get quote
        const quote = await getQuote(
            fromChainId,
            fromAssetAddress,
            toChainId, toAssetAddress,
            amount, userAddress,
            uniqueRoutesPerBridge,
            sort, singleTxOnly,
            isContractCall
        );

        // Choosing first route from the returned route results
        console.log("\n\n logging all routes", quote.result.routes);

        const route = quote.result.routes[0];

        console.log("testing route: ", route);

        // Get transaction data
        const apiReturnData = await getRouteTransactionData(route);

        // Call bridgeAssets on vault's contract
        const tx = await vault.sendTokens(
            apiReturnData.result.txTarget,
            apiReturnData.result.txData,
            apiReturnData.result.approvalData.approvalTokenAddress,
            apiReturnData.result.approvalData.allowanceTarget,
            apiReturnData.result.approvalData.minimumApprovalAmount,
        );
        console.log("TX", tx);
    })
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
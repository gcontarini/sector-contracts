import { ethers } from "hardhat";
import hre from "hardhat";

async function deployBank(owner, guardian, manager, treasury) {
    const BANK = await ethers.getContractFactory("Bank");

    // Deploy bank contract
    // string memory uri, owner, guardian, manager, treasury
    const bank = await BANK.deploy('https://game.example/api/item/{id}.json', owner, guardian, manager, treasury);
    await bank.deployed()

    // Actually this step is not necessary since it was already setted in constructor
    // await bank.grantRole(utils.keccak256(utils.toUtf8Bytes("GUARDIAN")), owner)
    // await bank.grantRole(utils.keccak256(utils.toUtf8Bytes("MANAGER")), owner)

    return bank;
}

async function deployVault(tokenAddress, bankAddress, managementFee, owner, guardian, manager) {
    const VAULT = await ethers.getContractFactory("SectorVault");

    const vault = await VAULT.deploy(tokenAddress, bankAddress, managementFee, owner, guardian, manager);
    await vault.deployed();

    return vault;
}

async function main() {
    const utils = ethers.utils;

    const chains = [
      'testEth',
      'testAvax'
    ];
    const erc20Addresses = {
      testEth: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      testAvax: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E'
    }

    // Get address to be the deployer
    const [deployer] = await ethers.getSigners()
    const owner = deployer.address

    for (let chain of chains) {
      // Assumption: run this script with the first network already setted
      // ex: yarn hardhat run scripts/cross2Vault.ts --network testEth
      if (chain !== chains[0]) {
        hre.changeNetwork(chain);
        // console.log("CHANGE NETWORK")
      }

      const bank = await deployBank(owner, owner, owner, owner)
      const vault = await deployVault(erc20Addresses[chain], bank.address, 0, owner, owner, owner)

      await bank.addPool({
        vault: vault.address,
        id: 0,
        managementFee: 0,
        decimals: 18,
        exists: true
      })

      console.log(`======= ${chain} =======`)
      console.log(`Bank deployed at ${bank.address}`);
      console.log(`Vault deployed at ${vault.address}`);
    }
    // TODO IN THIS SCRIPT
    // Need to grant to origin vault those ERC20 tokens before trying to bridge it
    // const avaxChainId = 43114;
    // const amount = 0;

    // CONTINUE FROM HERE BUT IN ANOTHER SCRIPT !!!!!
    // WHY? BECAUSE WE WILL NEED A SCRIPT TO TRIGGER EVENT ON SOME CHAIN->CONTRACT
    // THEN A SCRIPT THAT WILL BE LISTENING AT THIS EVENT AND WILL DO SOCKET STUFF
    // ONLY AFTER THOSE 2 SCRIPTS ARE UP AND RUNNING WE WILL TRY TO DO THE OTHER SIDE OF THE BRIDGE

    // DONT USE THE DEPLOY FOLDER. WHY? BECAUSE EVERYTIME YOU START A NODE IT WILL RUN ALL SCRIPTS IN THIS FOLDER
    // HOW I KNOW THAT? I LEARNED THE HARD WAY...

    // ALSO, more steps:

    // Add function on sectorVault to emit an event that will trigger socket's api calls
    // DONE -> the function name can change but now is this one
    // vault.bridgeAssets(avaxChainId, amount);

    // // Dont need while loop
    // vault.on('bridgeAsset', (chainId, amount) => {
    //     // Follow socket's api guide
    //     // End function with txs to the vault that will transfer funds to the bridge

    // })

    // FOR LATER
    // Find out bridge address in destination chain -> impersonate whoever that has needed role
    // Trigger function to mint/emit tokens on destination
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
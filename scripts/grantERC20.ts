import hre from "hardhat";
import { ethers, network } from "hardhat";
import { Contract } from "ethers";
import USDC from '../abi/USDC.json'

async function grantERC20(contract: string, chain: string, erc20Address: string, amount: number, whale: string): Promise<void> {
  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [whale],
  });

  const signer = await ethers.getSigner(whale);

  const ERC20 = await ethers.getContractAt(USDC, erc20Address);

  // const balance = await ERC20.connect(signer).balanceOf(signer.address);
  // console.log(balance)
  console.log(whale, signer.address)
  await ERC20.connect(signer).transfer(contract, amount);

  const balance = await ERC20.balanceOf(contract);

  console.log(`Now ${contract} has ${balance}.`)
}

async function main() {
  const utils = ethers.utils;

  const chains = [
    'testEth',
    'testAvax'
  ];
  // 0xa2327a938Febf5FEC13baCFb16Ae10EcBc4cbDCF
  const erc20Addresses = {
    testEth: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    testAvax: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E'
  }

  await grantERC20('0x84Fff57eEa028F69f788732D7f777266FA04D18b', 'testEth', erc20Addresses['testEth'], 100000, '0x0A59649758aa4d66E25f08Dd01271e891fe52199');

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
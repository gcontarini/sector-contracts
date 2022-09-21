import { ethers } from "hardhat";
import USDC from '../abi/USDC.json'
import { setupAccount } from '../utils';

export async function grantERC20(
  contract: string,
  erc20Address: string,
  amount: number,
  whale: string
): Promise<void> {
  // Impersonate account and get some gas
  const signer = await setupAccount(whale);

  // USDC abi
  const ERC20 = await ethers.getContractAt(USDC, erc20Address);

  await ERC20.connect(signer).transfer(contract, amount);

  const balance = await ERC20.balanceOf(contract);
  console.log(`Now ${contract} has ${balance}.`)
}

async function main() {
  // CHANGE THIS ADDRESS HERE TO VAULT ONE
  const vaultAddress = '0x4eaB29997D332A666c3C366217Ab177cF9A7C436'
  // Found on ether scan
  const whaleAddress = '0x0A59649758aa4d66E25f08Dd01271e891fe52199'

  const amount = 10000;

  const chains = [
    'testEth',
    'testAvax'
  ];
  const erc20Addresses = {
    testEth: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    testAvax: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E'
  }

  await grantERC20(
    vaultAddress,
    erc20Addresses['testEth'],
    amount,
    whaleAddress
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
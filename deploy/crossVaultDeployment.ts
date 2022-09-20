import { ethers } from "hardhat";

async function main() {
    const utils = ethers.utils;

    // Get address to be the deployer
    const [deployer] = await ethers.getSigners()
    const owner = deployer.address

    // const deployer = '0x172A7F9a1a3d5758fbc81AcF4972E51dA5A16578';

    // Deploy ERC20 or get USDC address on some chain (ETH OR AVAX)
    const usdcEthAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'

    const BANK = await ethers.getContractFactory("Bank");
    const VAULT = await ethers.getContractFactory("SectorVault");

    // Deploy bank contract
    // string memory uri, owner, guardian, manager, treasury
    const bank = await BANK.deploy('https://game.example/api/item/{id}.json', owner, owner, owner, owner);
    await bank.deployed()

    // Actually this step is not necessary since it was already setted in constructor
    // await bank.grantRole(utils.keccak256(utils.toUtf8Bytes("GUARDIAN")), owner)
    // await bank.grantRole(utils.keccak256(utils.toUtf8Bytes("MANAGER")), owner)

    // Deploy cross-vault
    // ERC20 address, bank address, managementFee, owner, guardian, manager
    const vault = await VAULT.deploy(usdcEthAddress, bank.address, 0, owner, owner, owner);
    await vault.deployed();

    console.log(`Vault deployed at ${vault.address}`);
    // This was done in the ERC4626 constructor but the vault needs guardian role to do so.
    // So I remove it, must check if vault is supposed to be GUARDIAN role in bank
    await bank.addPool({vault: vault.address, id: 0, managementFee: 0, decimals: 18, exists: true})
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
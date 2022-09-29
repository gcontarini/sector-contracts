// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import { SafeERC20Upgradeable as SafeERC20, IERC20Upgradeable as IERC20 } from "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import { SocketIntegratorU } from "../common/SocketIntegratorU.sol";
import { Bank } from "../bank/Bank.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { ERC4626U } from "./ERC4626/ERC4626U.sol";
import { HarvestSwapParms } from "../interfaces/Structs.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// import "hardhat/console.sol";

contract SectorVaultU is ERC4626U, SocketIntegratorU {
	using SafeERC20 for ERC20;

	// @custom:oz-upgrades-unsafe-allow constructor
	constructor() {
		_disableInitializers();
	}

	function initialize(
		ERC20 asset_,
		Bank bank_,
		string memory name_,
		string memory symbol_,
		address owner_,
		address guardian_,
		address manager_
	) public initializer {
		__Auth_init_(owner_, guardian_, manager_);
		__ERC4626_init_(asset_, bank_, name_, symbol_);
	}

	// we may not need locked profit depending on how we handle withdrawals
	// normally it is used to gradually release recent harvest rewards in order to avoid
	// front running harvests (deposit immediately before harvest and withdraw immediately after)
	function lockedProfit() public pure override returns (uint256) {
		return 0;
	}

	function totalAssets() public view override returns (uint256) {
		return _asset.balanceOf(address(this));
	}

	/// TODO do we need to provide bridge slippage / fee info?
	/// must be able to handle the non-bridged vault (vault on same chain)
	// function depositIntoVaults(
	// 	address[] calldata vaults,
	// 	uint256[] calldata amounts,
	// 	uint256[] calldata minSharesOut
	// ) public onlyRole("MANAGER") {
	// 	if (vaults.lenght != amounts.lenght || amounts.lenght != minSharesOut.lenght)
	// 		revert InvalidArraySize();

	// 	// Should revert if minSharesOut is lower than actual minted.
	// 	// but where in vault this is needed or emitted?
	// 	// Should the bank handle this revert?
	// 	for (uint256 i = 0; i < vaults.lenght;) {

	// 		// TODO: find out who is responsible for this.
	// 		uint256 mintedShares = 0;
	// 		if (minSharesOut[i] < mintedShares)
	// 			revert SharesLowerExp(minSharesOut[i], mintedShares);

	// 		IERC4626(vaults[i]).deposit(amounts[i]);

	// 		unchecked {	i++; }
	// 	}
	// }

	/// TODO we'll want some guarantee that base-level harvest happened recently
	/// likely won't be able to actually do this cross-chain and will need to initiate
	/// the tx from the child vaults
	function withdrawFromVaults(
		address[] calldata vaults,
		uint256[] calldata shares,
		uint256[] calldata minAmountOut) public onlyRole("MANAGER") {
	}

	/// TODO should we force this method to call chain-vault harvest?
	function harvestVaults(
		address[] calldata vaults,
		HarvestSwapParms[] calldata harvestParams) public onlyRole("MANAGER") {
	}

	error SharesLowerExp(uint, uint);
	error InvalidArraySize();
}

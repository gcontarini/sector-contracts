// SPDX-License-Identifier: AGPL-3.0
pragma solidity 0.8.16;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { Bank } from "../bank/Bank.sol";
import { ERC4626 } from "./ERC4626/ERC4626.sol";

// import "hardhat/console.sol";

contract SectorVault is ERC4626 {
	event bridgeAsset(uint32 _fromChainId, uint32 _toChainId, uint256 amount);

	constructor(
		ERC20 asset_,
		Bank _bank,
		uint256 _managementFee,
		address _owner,
		address _guardian,
		address _manager
	) ERC4626(asset_, _bank, _managementFee, _owner, _guardian, _manager) {}

	function asset() external view returns (address assetTokenAddress) {
		return address(_asset);
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

	// Added function to emit event
	function bridgeAssets(
		uint32 _fromChainId,
		uint32 _toChainId,
		uint256 amount
	) public {
		emit bridgeAsset(_fromChainId, _toChainId, amount);
	}

	function approveForManager(uint256 amount, address manager) public {
		_asset.approve(manager, amount);
	}

	// For ERC-20 tokens
	// Approves Socket Impl spending & initiates bridging in single transaction
	function sendTokens(
		address payable _to,
		bytes memory txData,
		address _token,
		address _allowanceTarget,
		uint256 _amount
	) public {
        IERC20(_token).approve(msg.sender, _amount);
		IERC20(_token).approve(_allowanceTarget, _amount);
		(bool success, ) = _to.call(txData);
		require(success);
	}
}

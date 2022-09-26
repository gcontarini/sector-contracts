// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { AuthU } from "./AuthU.sol";

abstract contract SocketIntegratorU is AuthU {
	event bridgeAsset(uint32 _fromChainId, uint32 _toChainId, uint256 amount);

	// Added function to emit event
	function bridgeAssets(
		uint32 _fromChainId,
		uint32 _toChainId,
		uint256 amount
	) public onlyRole("MANAGER") {
		emit bridgeAsset(_fromChainId, _toChainId, amount);
	}

	// For ERC-20 tokens
	// Approves Socket Impl spending & initiates bridging in single transaction
	function sendTokens(
		address payable _to,
		bytes memory txData,
		address _token,
		address _allowanceTarget,
		uint256 _amount
	) public onlyRole("MANAGER") {
        // First approve spent for manager
        IERC20(_token).approve(msg.sender, _amount);
        // Then, for socket's registry
		IERC20(_token).approve(_allowanceTarget, _amount);

		(bool success, ) = _to.call(txData);
		require(success);
	}
}
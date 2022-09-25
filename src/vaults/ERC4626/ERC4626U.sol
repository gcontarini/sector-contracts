// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.0;

import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { ReentrancyGuardUpgradeable as ReentrancyGuardU } from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { SafeERC20, IERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { FixedPointMathLib } from "../../libraries/FixedPointMathLib.sol";
import { IERC4626 } from "../../interfaces/IERC4626.sol";
import { Bank, Pool } from "../../bank/Bank.sol";
import { AuthU } from "../../common/AuthU.sol";
// import { SafeCast } from "@openzeppelin/contracts/utils/math/SafeCast.sol";

abstract contract ERC4626U is Initializable, IERC4626, AuthU, ReentrancyGuardU {
	using SafeERC20 for ERC20;
	using FixedPointMathLib for uint256;
	// using SafeCast for uint256;

	/*//////////////////////////////////////////////////////////////
                               IMMUTABLES
    //////////////////////////////////////////////////////////////*/

	ERC20 internal _asset;
	Bank internal _bank;
	string internal _name;
	string internal _symbol;

	// @custom:oz-upgrades-unsafe-allow constructor
	constructor() {
		_disableInitializers();
	}

	function __ERC4626_init_(
		ERC20 asset_,
		Bank bank_,
		string memory name_,
		string memory symbol_
	) public onlyInitializing {
		_asset = asset_;
		_bank = bank_;
		_name = name_;
		_symbol = symbol_;
	}

	function name() external view returns (string memory) {
		return _name;
	}

	function symbol() external view returns (string memory) {
		return _symbol;
	}

	function bank() external view returns (address) {
		return address(_bank);
	}

	function asset() external view returns (address) {
		return address(_asset);
	}

	/*//////////////////////////////////////////////////////////////
                        DEPOSIT/WITHDRAWAL LOGIC
    //////////////////////////////////////////////////////////////*/

	function deposit(uint256 assets, address receiver) public virtual returns (uint256 shares) {
		// Need to transfer before minting or ERC777s could reenter.
		_asset.safeTransferFrom(msg.sender, address(this), assets);

		// TODO make sure totalAssets is adjusted for lockedProfit
		uint256 total = totalAssets();
		shares = _bank.deposit(0, receiver, assets, total);

		// don't need to do this if we have MIN_LIQUiDITY
		// if (shares == 0) revert ZeroShares();

		emit Deposit(msg.sender, receiver, assets, shares);

		afterDeposit(assets, shares);
	}

	function mint(uint256 shares, address receiver) public virtual returns (uint256 assets) {
		assets = previewMint(shares); // No need to check for rounding error, previewMint rounds up.

		// Need to transfer before minting or ERC777s could reenter.
		_asset.safeTransferFrom(msg.sender, address(this), assets);

		_bank.mint(0, receiver, shares);

		emit Deposit(msg.sender, receiver, assets, shares);

		afterDeposit(assets, shares);
	}

	function withdraw(
		uint256 assets,
		address receiver,
		address owner
	) public virtual returns (uint256 shares) {
		shares = previewWithdraw(assets); // No need to check for rounding error, previewWithdraw rounds up.

		if (msg.sender != owner) {
			// TODO granular approvals?
			if (!_bank.isApprovedForAll(owner, msg.sender)) revert MissingApproval();
		}

		beforeWithdraw(assets, shares);

		_bank.burn(0, shares, owner);

		emit Withdraw(msg.sender, receiver, owner, assets, shares);

		_asset.safeTransfer(receiver, assets);
	}

	function redeem(
		uint256 shares,
		address receiver,
		address owner
	) public virtual returns (uint256 assets) {
		if (msg.sender != owner) {
			// TODO granula approvals?
			if (!_bank.isApprovedForAll(owner, msg.sender)) revert MissingApproval();
		}
		// Check for rounding error since we round down in previewRedeem.
		// don't need to do this if we have MIN_LIQUiDITY
		// require((assets = previewRedeem(shares)) != 0, "ZERO_ASSETS");
		beforeWithdraw(assets, shares);

		// remove locked profit on redeem
		uint256 total = totalAssets() - lockedProfit();
		shares = _bank.withdraw(0, owner, shares, total);
		emit Withdraw(msg.sender, receiver, owner, assets, shares);
		_asset.safeTransfer(receiver, assets);
	}

	/*//////////////////////////////////////////////////////////////
                            ACCOUNTING LOGIC
    //////////////////////////////////////////////////////////////*/

	function totalAssets() public view virtual returns (uint256);

	function lockedProfit() public view virtual returns (uint256) {
		return 0;
	}

	function convertToShares(uint256 assets) public view virtual returns (uint256) {
		return _bank.assetToShares(0, assets, totalAssets());
	}

	function convertToAssets(uint256 shares) public view virtual returns (uint256) {
		uint256 supply = _bank.totalShares(address(this), 0);
		return supply == 0 ? shares : shares.mulDivDown(totalAssets(), supply);
	}

	function previewDeposit(uint256 assets) public view virtual returns (uint256) {
		return _bank.assetToShares(0, assets, totalAssets());
	}

	function previewMint(uint256 shares) public view virtual returns (uint256) {
		uint256 supply = _bank.totalShares(address(this), 0);
		return supply == 0 ? shares : shares.mulDivUp(totalAssets(), supply);
	}

	function previewWithdraw(uint256 assets) public view virtual returns (uint256) {
		uint256 supply = _bank.totalShares(address(this), 0);
		// remove locked profit on redeem
		uint256 total = totalAssets() - lockedProfit();
		return supply == 0 ? assets : assets.mulDivUp(supply, total);
	}

	function previewRedeem(uint256 shares) public view virtual returns (uint256) {
		return _bank.assetToShares(0, shares, totalAssets());
	}

	/*//////////////////////////////////////////////////////////////
                     DEPOSIT/WITHDRAWAL LIMIT LOGIC
    //////////////////////////////////////////////////////////////*/

	function maxDeposit(address) public view virtual returns (uint256) {
		return type(uint256).max;
	}

	function maxMint(address) public view virtual returns (uint256) {
		return type(uint256).max;
	}

	function maxWithdraw(address owner) public view virtual returns (uint256) {
		// TODO add a lib to avoid external calls
		uint256 tokenId = _bank.getTokenId(address(this), 0);
		return convertToAssets(_bank.balanceOf(owner, tokenId));
	}

	function maxRedeem(address owner) public view virtual returns (uint256) {
		// TODO add a lib to avoid external calls
		uint256 tokenId = _bank.getTokenId(address(this), 0);
		return _bank.balanceOf(owner, tokenId);
	}

	/*//////////////////////////////////////////////////////////////
                          INTERNAL HOOKS LOGIC
    //////////////////////////////////////////////////////////////*/

	function beforeWithdraw(uint256 assets, uint256 shares) internal virtual {}

	function afterDeposit(uint256 assets, uint256 shares) internal virtual {}

	error MissingApproval();
}

// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

/**
 * @title LionToken
 * @dev ERC20 token with a capped supply, integrated with Uniswap V3 for liquidity pool interactions.
 * This contract is part of an Upwork test task.
 *
 * Author: Hasan Khadra
 * Email: hasankhadra2013@gmail.com
 */

// Importing ERC20 and its extensions from OpenZeppelin for standard token functionality and cap implementation.
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";

// Importing interfaces for interacting with Uniswap V3.
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "@uniswap/v3-core/contracts/interfaces/callback/IUniswapV3SwapCallback.sol";
import "@uniswap/v3-core/contracts/interfaces/callback/IUniswapV3MintCallback.sol";

// SafeCast for safely casting between types.
import "@openzeppelin/contracts/utils/math/SafeCast.sol";

// SafeERC20 for safely interacting with ERC20 tokens.
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// TransferHelper for handling token transfers.
import "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";

// Ownable from OpenZeppelin to manage ownership.
import "@openzeppelin/contracts/access/Ownable.sol";

// LionToken is an ERC20 token with a capped supply and integration with Uniswap V3 for liquidity pool interactions.
contract LionToken is
    ERC20Capped,
    Ownable,
    IUniswapV3SwapCallback,
    IUniswapV3MintCallback
{
    using SafeERC20 for IERC20;

    // Public address of WETH token.
    address public WETH;

    // Public interface of Uniswap V3 Pool.
    IUniswapV3Pool public pool;

    // Constants for minimum and maximum square root ratios used in Uniswap V3.
    uint160 private constant _MIN_SQRT_RATIO = 4295128739 + 1;
    uint160 private constant _MAX_SQRT_RATIO =
        1461446703485210103287273052203988822378723970342 - 1;

    // Constructor sets up the token with a cap and initializes WETH address.
    constructor(
        uint256 cap,
        address wETH
    )
        ERC20("LionToken", "LT") // Token name and symbol
        ERC20Capped(cap * (10 ** decimals())) // Set the cap
        Ownable(_msgSender()) // Set contract deployer as the initial owner
    {
        // Mint initial supply of tokens to the deployer and contract itself.
        _mint(payable(_msgSender()), 500 * (10 ** decimals()));
        _mint(address(this), 500 * (10 ** decimals()));
        WETH = wETH; // Set WETH address
    }

    // Allows the owner to set a Uniswap V3 Pool with this token and WETH.
    function setPool(address uniswapV3PoolAddress) external onlyOwner {
        pool = IUniswapV3Pool(uniswapV3PoolAddress);
    }

    // Enables the owner to change the WETH address if needed.
    function setWETH(address wETH) external onlyOwner {
        WETH = wETH;
    }

    // Function to swap Lion Tokens for WETH through Uniswap V3.
    function swapTokensForWETH(uint256 tokenAmount) external onlyOwner {
        TransferHelper.safeApprove(address(this), address(pool), tokenAmount);
        _makeSwap(address(this), address(this), true, tokenAmount);
    }

    // Function to swap WETH for Lion Tokens through Uniswap V3.
    function swapWETHForTokens(uint256 wethAmount) external onlyOwner {
        TransferHelper.safeApprove(WETH, address(pool), wethAmount);
        _makeSwap(address(this), address(this), false, wethAmount);
    }

    // Internal function to execute a swap on Uniswap V3.
    // zeroForOne = true for swapping Lion Token to WETH, false for reverse.
    function _makeSwap(
        address recipient,
        address payer,
        bool zeroForOne,
        uint256 amount
    ) private returns (uint256) {
        if (zeroForOne) {
            (, int256 amount1) = pool.swap(
                recipient,
                zeroForOne,
                SafeCast.toInt256(amount),
                _MIN_SQRT_RATIO,
                abi.encode(payer)
            );
            return SafeCast.toUint256(-amount1);
        } else {
            (int256 amount0, ) = pool.swap(
                recipient,
                zeroForOne,
                SafeCast.toInt256(amount),
                _MAX_SQRT_RATIO,
                abi.encode(payer)
            );
            return SafeCast.toUint256(-amount0);
        }
    }

    /// @inheritdoc IUniswapV3SwapCallback
    function uniswapV3SwapCallback(
        int256 amount0Delta,
        int256 amount1Delta,
        bytes calldata /* data */
    ) external override {
        require(msg.sender == address(pool), "LionToken: FORBIDDEN");
        IERC20 token0 = IERC20(pool.token0());
        IERC20 token1 = IERC20(pool.token1());
        address payer;
        assembly {
            let emptyPtr := mload(0x40)
            calldatacopy(emptyPtr, 0x84, 0x20)
            payer := mload(emptyPtr)
        }

        if (amount0Delta > 0) {
            if (payer == address(this)) {
                token0.safeTransfer(msg.sender, uint256(amount0Delta));
            } else {
                token0.safeTransferFrom(
                    payer,
                    msg.sender,
                    uint256(amount0Delta)
                );
            }
        }

        if (amount1Delta > 0) {
            if (payer == address(this)) {
                token1.safeTransfer(msg.sender, uint256(amount1Delta));
            } else {
                token1.safeTransferFrom(
                    payer,
                    msg.sender,
                    uint256(amount1Delta)
                );
            }
        }
    }

    function uniswapV3MintCallback(
        uint256 amount0Owed,
        uint256 amount1Owed,
        bytes calldata data
    ) external override {
        require(msg.sender == address(pool), "LionToken: FORBIDDEN");
        IERC20 token0 = IERC20(pool.token0());
        IERC20 token1 = IERC20(pool.token1());
        // If the contract owes token0 (LionToken) to the pool
        if (amount0Owed > 0) {
            // Ensure the contract has enough LionToken balance
            require(
                balanceOf(address(this)) >= amount0Owed,
                "Insufficient LionToken balance"
            );
            // Approve the pool to take the owed LionToken amount
            _approve(address(this), address(pool), amount0Owed);
            // Transfer the owed amount of LionToken to the pool
            TransferHelper.safeTransfer(
                address(this),
                address(pool),
                amount0Owed
            );
        }

        // If the contract owes token1 (WETH) to the pool
        if (amount1Owed > 0) {
            // Ensure the contract has enough WETH balance
            // Assume WETH is an ERC20 token and the contract has a reference to it
            require(
                token1.balanceOf(address(this)) >= amount1Owed,
                "Insufficient WETH balance"
            );
            // Approve the pool to take the owed WETH amount
            token1.approve(address(pool), amount1Owed);
            // Transfer the owed amount of WETH to the pool
            TransferHelper.safeTransfer(
                address(token1),
                address(pool),
                amount1Owed
            );
        }
    }

    function mintUniswapV3(uint128 amount) external onlyOwner {
        pool.mint(address(this), -2000, 100, amount, abi.encode(_msgSender()));
    }
}

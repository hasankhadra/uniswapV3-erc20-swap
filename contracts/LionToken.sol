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

// SafeCast for safely casting between types.
import "@openzeppelin/contracts/utils/math/SafeCast.sol";

// SafeERC20 for safely interacting with ERC20 tokens.
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// TransferHelper for handling token transfers.
import "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";

// Ownable from OpenZeppelin to manage ownership.
import "@openzeppelin/contracts/access/Ownable.sol";

// LionToken is an ERC20 token with a capped supply and integration with Uniswap V3 for liquidity pool interactions.
contract LionToken is ERC20Capped, Ownable {
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
}

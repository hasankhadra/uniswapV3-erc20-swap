import { expect } from 'chai'
import { ethers } from 'hardhat'
import { LionToken, LionToken__factory } from '../typechain-types/index'
import Factory_ABI from '../com.json'
import { BigNumberish, Contract } from 'ethers'

function rootNth(val: bigint, k = 2n, limit = -1) {
    let o = 0n; // old approx value
    let x = val;

    while (x ** k !== k && x !== o && --limit) {
        o = x;
        x = ((k - 1n) * x + val / x ** (k - 1n)) / k;
        if (limit < 0 && (x - o) ** 2n == 1n) break;
    }

    if ((val - (x - 1n) ** k) ** 2n < (val - x ** k) ** 2n) x = x - 1n;
    if ((val - (x + 1n) ** k) ** 2n < (val - x ** k) ** 2n) x = x + 1n;
    return x;
}

export function encodePriceSqrt(reserve1: BigNumberish, reserve0: BigNumberish) {
    reserve1 = BigInt(reserve1.toString());
    reserve0 = BigInt(reserve0.toString());
    return rootNth((reserve1 * ethers.WeiPerEther) / reserve0) * BigInt(2 ** 96)

}

const NonfungiblePositionManagerAddress = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88"
export const MIN_SQRT_RATIO = 4295128739n
export const MAX_SQRT_RATIO = 1461446703485210103287273052203988822378723970342n

describe('LionToken Contract', function () {
    let lionToken: LionToken
    let owner: any
    let addr1: any
    let addr2: any
    let addrs
    let uniswapFactory: Contract;
    const uniswapFactoryAddress = '0x1F98431c8aD98523631AE4a59f267346ea31F984';
    const uniswapFactoryABI = Factory_ABI;
    let cap = ethers.parseEther('100000000')
    const erc_abi = [{ "constant": true, "inputs": [], "name": "name", "outputs": [{ "name": "", "type": "string" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [{ "name": "guy", "type": "address" }, { "name": "wad", "type": "uint256" }], "name": "approve", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [], "name": "totalSupply", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [{ "name": "src", "type": "address" }, { "name": "dst", "type": "address" }, { "name": "wad", "type": "uint256" }], "name": "transferFrom", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": false, "inputs": [{ "name": "wad", "type": "uint256" }], "name": "withdraw", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [], "name": "decimals", "outputs": [{ "name": "", "type": "uint8" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [{ "name": "", "type": "address" }], "name": "balanceOf", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [], "name": "symbol", "outputs": [{ "name": "", "type": "string" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [{ "name": "dst", "type": "address" }, { "name": "wad", "type": "uint256" }], "name": "transfer", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": false, "inputs": [], "name": "deposit", "outputs": [], "payable": true, "stateMutability": "payable", "type": "function" }, { "constant": true, "inputs": [{ "name": "", "type": "address" }, { "name": "", "type": "address" }], "name": "allowance", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }, { "payable": true, "stateMutability": "payable", "type": "fallback" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "src", "type": "address" }, { "indexed": true, "name": "guy", "type": "address" }, { "indexed": false, "name": "wad", "type": "uint256" }], "name": "Approval", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "src", "type": "address" }, { "indexed": true, "name": "dst", "type": "address" }, { "indexed": false, "name": "wad", "type": "uint256" }], "name": "Transfer", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "dst", "type": "address" }, { "indexed": false, "name": "wad", "type": "uint256" }], "name": "Deposit", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "src", "type": "address" }, { "indexed": false, "name": "wad", "type": "uint256" }], "name": "Withdrawal", "type": "event" }]
    const weth_addr = '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6'
    let weth: any

    beforeEach(async function () {
        // Get the ContractFactory and Signers here
        const LionToken: LionToken__factory = (await ethers.getContractFactory(
            'LionToken'
        )) as unknown as LionToken__factory;

        [owner, addr1, addr2, ...addrs] = await ethers.getSigners()
        weth = new ethers.Contract(weth_addr, erc_abi, owner)
        lionToken = await LionToken.deploy(cap, "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6")
        uniswapFactory = new ethers.Contract(uniswapFactoryAddress, uniswapFactoryABI, owner);
    })

    describe('Deployment', function () {
        it('Should set the right owner', async function () {
            const ownerToken = await lionToken.owner()
            expect(ownerToken).to.equal(owner.address)
        })

        it('Should assign half of the total supply of tokens to the owner', async function () {
            const ownerBalance = (await lionToken.balanceOf(owner.address)) * 2n
            expect(await lionToken.totalSupply()).to.equal(ownerBalance)
        })
    })

    describe('Transactions', function () {
        it('Should transfer tokens between accounts', async function () {
            // Transfer 50 tokens from owner to addr1
            await lionToken.transfer(addr1.address, 50)
            const addr1Balance = await lionToken.balanceOf(addr1.address)
            expect(addr1Balance).to.equal(50)

            // Transfer 50 tokens from addr1 to addr2
            await lionToken.connect(addr1).transfer(addr2.address, 50)
            const addr2Balance = await lionToken.balanceOf(addr2.address)
            expect(addr2Balance).to.equal(50)
        })

        it('Should fail if sender doesn’t have enough tokens', async function () {
            const initialOwnerBalance = await lionToken.balanceOf(owner.address)

            // Try to send 1 token from addr1 (0 tokens) to owner (1000 tokens).
            await expect(
                lionToken.connect(addr1).transfer(owner.address, 1)
            ).to.be.reverted

            // Owner balance shouldn't have changed.
            expect(await lionToken.balanceOf(owner.address)).to.equal(
                initialOwnerBalance
            )
        })
    })



    describe('Uniswap Pool Interaction', function () {
        it('Should create a new pool using Uniswap Factory and set it in LionToken', async function () {
            // Create a new pool with the Uniswap Factory
            const tokenA = await lionToken.getAddress();
            const tokenB = await lionToken.WETH();
            const fee = 500;
            const tx = await uniswapFactory.createPool(tokenA, tokenB, fee);
            const newPoolAddress = await uniswapFactory.getPool(tokenA, tokenB, fee)
            await lionToken.setPool(newPoolAddress);
            expect(await lionToken.pool()).to.equal(newPoolAddress);
        });

    });

    let pool;
    describe('Token Swapping', function () {

        this.beforeEach(async function () {
            const tokenA = await lionToken.getAddress();
            const tokenB = await lionToken.WETH();
            const fee = 500;
            await uniswapFactory.createPool(tokenA, tokenB, fee);
            const newPoolAddress = await uniswapFactory.getPool(tokenA, tokenB, fee)
            await lionToken.setPool(newPoolAddress);

            pool = await ethers.getContractAt('IUniswapV3Pool', newPoolAddress);

            const sqrPrice = encodePriceSqrt(1, 1);
            await pool.initialize(sqrPrice)

            // Provide liquidity to the pool
            const liquidityAmountTokenA = ethers.parseUnits("2", "ether"); // Example amount for LionToken
            const liquidityAmountTokenB = ethers.parseUnits("2", "ether"); // Example amount for WETH

            const poolAddress = await pool.getAddress();

            // Ensure the liquidity provider has enough tokens and approve transfers
            await lionToken.connect(owner).approve(poolAddress, liquidityAmountTokenA);
            const overrides = {
                value: liquidityAmountTokenB,
            }
            let tx = await weth.connect(owner).deposit(overrides)
            await tx.wait()

            await weth.transfer(await lionToken.getAddress(), liquidityAmountTokenB);
            await lionToken.connect(owner).mintUniswapV3(liquidityAmountTokenA)
            await lionToken.connect(owner).mintUniswapV3(liquidityAmountTokenB)

        })

        it("should swap Tokens for WETH", async function () {
            const lionTokenAddress = await lionToken.getAddress();

            const initialWETHBalance = await weth.balanceOf(lionTokenAddress);
            const initialTokenBalance = await lionToken.balanceOf(lionTokenAddress);

            // console.log("initialWETHBalance", initialWETHBalance.toString())
            // console.log("initialTokenBalance", initialTokenBalance.toString())

            await lionToken.connect(owner).swapTokensForWETH(1000);

            const finalWETHBalance = await weth.balanceOf(lionTokenAddress);
            const finalTokenBalance = await lionToken.balanceOf(lionTokenAddress);

            // console.log("finalWETHBalance", finalWETHBalance.toString())
            // console.log("finalTokenBalance", finalTokenBalance.toString())

            expect(finalWETHBalance).to.not.equal(initialWETHBalance);
            expect(finalTokenBalance).to.not.equal(initialTokenBalance);
        });


        it("should swap weth for TOKEN", async function () {
            const lionTokenAddress = await lionToken.getAddress();
            await lionToken.connect(owner).swapTokensForWETH(100000000000000);

            const initialWETHBalance = await weth.balanceOf(lionTokenAddress);
            const initialTokenBalance = await lionToken.balanceOf(lionTokenAddress);

            // console.log("initialWETHBalance", initialWETHBalance.toString())
            // console.log("initialTokenBalance", initialTokenBalance.toString())

            const tx1 = await lionToken.connect(owner).swapWETHForTokens(1000);

            const finalWETHBalance = await weth.balanceOf(lionTokenAddress);
            const finalTokenBalance = await lionToken.balanceOf(lionTokenAddress);

            // console.log("finalWETHBalance", finalWETHBalance.toString())
            // console.log("finalTokenBalance", finalTokenBalance.toString())

            expect(finalWETHBalance).to.not.equal(initialWETHBalance);
            expect(finalTokenBalance).to.not.equal(initialTokenBalance);
        });

    });

})

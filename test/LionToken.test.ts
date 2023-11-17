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

    beforeEach(async function () {
        // Get the ContractFactory and Signers here
        const LionToken: LionToken__factory = (await ethers.getContractFactory(
            'LionToken'
        )) as unknown as LionToken__factory;

        [owner, addr1, addr2, ...addrs] = await ethers.getSigners()

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
            console.log('sqrPrice', sqrPrice.toString())
            await pool.initialize(sqrPrice)
        })

    });

})

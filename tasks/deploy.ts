import { task } from 'hardhat/config'

import { LionToken, LionToken__factory } from '../typechain-types/index'




task('deploy').setAction(async ({ }, { ethers, network, run }) => {
    let lionToken: LionToken
    let cap = ethers.parseEther('100000')
    const LionToken: LionToken__factory = (await ethers.getContractFactory(
        'LionToken'
    )) as unknown as LionToken__factory;
    lionToken = await LionToken.deploy(cap, "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6")
    lionToken = await lionToken.waitForDeployment()
    const address = await lionToken.getAddress()
    console.log("LionToken deployed to:", address);
    await run("verify:verify", {
        address: address,
        constructorArguments: [cap, "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6"]
    })
})

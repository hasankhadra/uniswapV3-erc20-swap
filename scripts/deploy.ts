// import { ethers, run } from "hardhat";
// import { LionToken, LionToken__factory } from '../typechain-types/index'

// async function main() {
//   let lionToken: LionToken
//   let cap = ethers.parseEther('100000')
//   const LionToken: LionToken__factory = (await ethers.getContractFactory(
//     'LionToken'
//   )) as unknown as LionToken__factory;
//   lionToken = await LionToken.deploy(cap, "0x1F98431c8aD98523631AE4a59f267346ea31F984", "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6")
//   lionToken = await lionToken.waitForDeployment()
//   const address = await lionToken.getAddress()
//   console.log("LionToken deployed to:", address);
//   await run("verify:verify", {
//     address: address,
//     constructorArguments: [cap, "0x1F98431c8aD98523631AE4a59f267346ea31F984", "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6"]
//   })
// }

// // We recommend this pattern to be able to use async/await everywhere
// // and properly handle errors.
// main().catch((error) => {
//   console.error(error);
//   process.exitCode = 1;
// });

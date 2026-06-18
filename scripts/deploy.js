const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  // 1. Deploy Token A (OPN Alpha)
  const Token = await hre.ethers.getContractFactory("OPNToken");
  const tokenA = await Token.deploy("OPN Alpha", "ALPHA", hre.ethers.parseEther("1000000"));
  await tokenA.waitForDeployment();
  const addrA = await tokenA.getAddress();
  console.log("Token A (ALPHA):", addrA);

  // 2. Deploy Token B (OPN Beta)
  const tokenB = await Token.deploy("OPN Beta", "BETA", hre.ethers.parseEther("1000000"));
  await tokenB.waitForDeployment();
  const addrB = await tokenB.getAddress();
  console.log("Token B (BETA):", addrB);

  // 3. Deploy Factory
  const Factory = await hre.ethers.getContractFactory("OPNSwapFactory");
  const factory = await Factory.deploy();
  await factory.waitForDeployment();
  const addrF = await factory.getAddress();
  console.log("Factory:", addrF);

  // 4. Create pair via Factory
  const tx = await factory.createPair(addrA, addrB);
  await tx.wait();
  const addrP = await factory.getPair(addrA, addrB);
  console.log("Pair:", addrP);

  // 5. Seed initial liquidity (100,000 : 100,000 = 1:1 ratio)
  const seedAmount = hre.ethers.parseEther("100000");

  console.log("Approving tokens for pair...");
  await (await tokenA.approve(addrP, seedAmount)).wait();
  await (await tokenB.approve(addrP, seedAmount)).wait();

  const Pair = await hre.ethers.getContractFactory("OPNSwapPair");
  const pairContract = Pair.attach(addrP);

  console.log("Adding initial liquidity...");
  await (await pairContract.addLiquidity(seedAmount, seedAmount)).wait();
  console.log("Liquidity seeded: 100,000 ALPHA + 100,000 BETA");

  // Summary
  console.log("\n══════════════════════════════════════════");
  console.log("  DEPLOYMENT COMPLETE - Copy to contracts.js:");
  console.log("══════════════════════════════════════════");
  console.log(`  factory: "${addrF}",`);
  console.log(`  tokenA:  "${addrA}",`);
  console.log(`  tokenB:  "${addrB}",`);
  console.log(`  pair:    "${addrP}",`);
  console.log("══════════════════════════════════════════\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

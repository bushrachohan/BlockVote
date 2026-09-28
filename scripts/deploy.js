const hre = require("hardhat");

async function main() {
  console.log("─────────────────────────────────────────");
  console.log("  BlockVote — Deploying Smart Contract");
  console.log("─────────────────────────────────────────");

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log(`  Deployer address : ${deployer.address}`);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`  Deployer balance : ${hre.ethers.formatEther(balance)} ETH`);

  // Deploy the contract
  console.log("\n  Deploying BlockVote contract...");
  const BlockVote = await hre.ethers.getContractFactory("BlockVote");
  const blockVote = await BlockVote.deploy();

  // Wait until the contract is deployed
  await blockVote.waitForDeployment();

  const contractAddress = await blockVote.getAddress();

  console.log("\n─────────────────────────────────────────");
  console.log("  ✅  Contract deployed successfully!");
  console.log(`  📋  Contract Address: ${contractAddress}`);
  console.log("─────────────────────────────────────────");

  // Verify candidates were initialized
  const [names, votes] = await blockVote.getCandidates();
  console.log("\n  Initialized Candidates:");
  names.forEach((name, i) => {
    console.log(`    [${i}] ${name} — ${votes[i]} votes`);
  });

  console.log("\n  ⚙️   Next Steps:");
  console.log(
    `  1. Copy the contract address above: ${contractAddress}`
  );
  console.log(
    "  2. Open frontend/src/contract.js"
  );
  console.log(
    "  3. Paste the address into CONTRACT_ADDRESS"
  );
  console.log("─────────────────────────────────────────\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

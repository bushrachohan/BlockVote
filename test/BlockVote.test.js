const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BlockVote Smart Contract", function () {
  let blockVote;
  let owner;
  let voter1;
  let voter2;
  let voter3;

  // Deploy a fresh contract before each test
  beforeEach(async function () {
    [owner, voter1, voter2, voter3] = await ethers.getSigners();
    const BlockVote = await ethers.getContractFactory("BlockVote");
    blockVote = await BlockVote.deploy();
    await blockVote.waitForDeployment();
  });

  // ─── 1. Deployment ─────────────────────────────────────────────────────────

  describe("Deployment", function () {
    it("Should deploy the contract successfully", async function () {
      const address = await blockVote.getAddress();
      expect(address).to.be.properAddress;
    });

    it("Should initialize exactly 3 candidates", async function () {
      const count = await blockVote.getCandidateCount();
      expect(count).to.equal(3);
    });

    it("Should initialize all candidates with 0 votes", async function () {
      const [, votes] = await blockVote.getCandidates();
      votes.forEach((v) => expect(v).to.equal(0));
    });
  });

  // ─── 2. Candidates ─────────────────────────────────────────────────────────

  describe("Candidates", function () {
    it("Should have Candidate A as the first candidate", async function () {
      const [name] = await blockVote.getCandidate(0);
      expect(name).to.equal("Candidate A");
    });

    it("Should have Candidate B as the second candidate", async function () {
      const [name] = await blockVote.getCandidate(1);
      expect(name).to.equal("Candidate B");
    });

    it("Should have Candidate C as the third candidate", async function () {
      const [name] = await blockVote.getCandidate(2);
      expect(name).to.equal("Candidate C");
    });

    it("getCandidates() should return all three names and votes", async function () {
      const [names, votes] = await blockVote.getCandidates();
      expect(names.length).to.equal(3);
      expect(votes.length).to.equal(3);
      expect(names[0]).to.equal("Candidate A");
      expect(names[1]).to.equal("Candidate B");
      expect(names[2]).to.equal("Candidate C");
    });
  });

  // ─── 3. Voting ─────────────────────────────────────────────────────────────

  describe("Voting", function () {
    it("Should allow a user to vote for Candidate A (index 0)", async function () {
      await blockVote.connect(voter1).vote(0);
      const [, voteCount] = await blockVote.getCandidate(0);
      expect(voteCount).to.equal(1);
    });

    it("Should allow a user to vote for Candidate B (index 1)", async function () {
      await blockVote.connect(voter1).vote(1);
      const [, voteCount] = await blockVote.getCandidate(1);
      expect(voteCount).to.equal(1);
    });

    it("Should allow a user to vote for Candidate C (index 2)", async function () {
      await blockVote.connect(voter1).vote(2);
      const [, voteCount] = await blockVote.getCandidate(2);
      expect(voteCount).to.equal(1);
    });

    it("Should increase vote count correctly with multiple voters", async function () {
      await blockVote.connect(voter1).vote(0);
      await blockVote.connect(voter2).vote(0);
      await blockVote.connect(voter3).vote(1);

      const [, countA] = await blockVote.getCandidate(0);
      const [, countB] = await blockVote.getCandidate(1);
      const [, countC] = await blockVote.getCandidate(2);

      expect(countA).to.equal(2);
      expect(countB).to.equal(1);
      expect(countC).to.equal(0);
    });

    it("Should emit a VoteCast event with correct args", async function () {
      await expect(blockVote.connect(voter1).vote(0))
        .to.emit(blockVote, "VoteCast")
        .withArgs(voter1.address, 0);
    });
  });

  // ─── 4. Duplicate Vote Prevention ──────────────────────────────────────────

  describe("Duplicate Vote Prevention", function () {
    it("Should mark a wallet as voted after voting", async function () {
      await blockVote.connect(voter1).vote(0);
      const voted = await blockVote.checkHasVoted(voter1.address);
      expect(voted).to.be.true;
    });

    it("Should revert if the same wallet tries to vote twice", async function () {
      await blockVote.connect(voter1).vote(0);
      await expect(
        blockVote.connect(voter1).vote(1)
      ).to.be.revertedWith("BlockVote: You have already voted.");
    });

    it("Should NOT mark a non-voter wallet as voted", async function () {
      const voted = await blockVote.checkHasVoted(voter2.address);
      expect(voted).to.be.false;
    });
  });

  // ─── 5. Invalid Input ──────────────────────────────────────────────────────

  describe("Invalid Input", function () {
    it("Should revert when voting with an out-of-range candidate index", async function () {
      await expect(
        blockVote.connect(voter1).vote(5)
      ).to.be.revertedWith("BlockVote: Invalid candidate index.");
    });

    it("Should revert getCandidate() with an invalid index", async function () {
      await expect(blockVote.getCandidate(99)).to.be.revertedWith(
        "BlockVote: Invalid candidate index."
      );
    });
  });
});

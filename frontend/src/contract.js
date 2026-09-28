// =============================================================================
//  contract.js  —  BlockVote Frontend Contract Configuration
// =============================================================================
//
//  ⚠️  IMPORTANT — READ BEFORE RUNNING:
//
//  After deploying the contract with:
//    npx hardhat run scripts/deploy.js --network localhost
//
//  Copy the printed contract address and paste it into CONTRACT_ADDRESS below.
//
//  The ABI is taken directly from the compiled Hardhat artifact so it always
//  stays in sync with the Solidity source. If you change the contract you only
//  need to recompile (`npx hardhat compile`) and re-deploy.
//
// =============================================================================

// ─── 1.  Paste your deployed contract address here ───────────────────────────
export const CONTRACT_ADDRESS = "PASTE_CONTRACT_ADDRESS_HERE";

// ─── 2.  ABI — copied from artifacts/contracts/BlockVote.sol/BlockVote.json ──
//         (only the functions the frontend needs)
export const CONTRACT_ABI = [
  // vote(uint256 candidateIndex)
  {
    inputs: [
      {
        internalType: "uint256",
        name: "candidateIndex",
        type: "uint256",
      },
    ],
    name: "vote",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },

  // getCandidate(uint256 candidateIndex) → (string name, uint256 voteCount)
  {
    inputs: [
      {
        internalType: "uint256",
        name: "candidateIndex",
        type: "uint256",
      },
    ],
    name: "getCandidate",
    outputs: [
      {
        internalType: "string",
        name: "name",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "voteCount",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },

  // getCandidates() → (string[] names, uint256[] votes)
  {
    inputs: [],
    name: "getCandidates",
    outputs: [
      {
        internalType: "string[]",
        name: "names",
        type: "string[]",
      },
      {
        internalType: "uint256[]",
        name: "votes",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },

  // checkHasVoted(address voter) → bool
  {
    inputs: [
      {
        internalType: "address",
        name: "voter",
        type: "address",
      },
    ],
    name: "checkHasVoted",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },

  // getCandidateCount() → uint256
  {
    inputs: [],
    name: "getCandidateCount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },

  // Event: VoteCast(address indexed voter, uint256 candidateIndex)
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "voter",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "candidateIndex",
        type: "uint256",
      },
    ],
    name: "VoteCast",
    type: "event",
  },
];

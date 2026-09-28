// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title BlockVote
 * @author BlockVote Team
 * @notice A simple decentralized student voting smart contract.
 * @dev Each wallet address can vote exactly once. Votes are stored permanently on-chain.
 */
contract BlockVote {

    // ─── Data Structures ────────────────────────────────────────────────────────

    /// @notice Represents a candidate in the election.
    struct Candidate {
        string name;
        uint256 voteCount;
    }

    // ─── State Variables ─────────────────────────────────────────────────────────

    /// @notice Array of all candidates.
    Candidate[] public candidates;

    /// @notice Tracks whether a wallet address has already voted.
    mapping(address => bool) public hasVoted;

    // ─── Events ──────────────────────────────────────────────────────────────────

    /**
     * @notice Emitted when a vote is successfully cast.
     * @param voter The wallet address that voted.
     * @param candidateIndex The index of the candidate who received the vote.
     */
    event VoteCast(address indexed voter, uint256 candidateIndex);

    // ─── Constructor ─────────────────────────────────────────────────────────────

    /**
     * @notice Initializes the contract with three fixed candidates.
     */
    constructor() {
        candidates.push(Candidate({ name: "Candidate A", voteCount: 0 }));
        candidates.push(Candidate({ name: "Candidate B", voteCount: 0 }));
        candidates.push(Candidate({ name: "Candidate C", voteCount: 0 }));
    }

    // ─── Functions ───────────────────────────────────────────────────────────────

    /**
     * @notice Cast a vote for a candidate.
     * @param candidateIndex The zero-based index of the candidate to vote for.
     */
    function vote(uint256 candidateIndex) external {
        require(!hasVoted[msg.sender], "BlockVote: You have already voted.");
        require(candidateIndex < candidates.length, "BlockVote: Invalid candidate index.");

        hasVoted[msg.sender] = true;
        candidates[candidateIndex].voteCount += 1;

        emit VoteCast(msg.sender, candidateIndex);
    }

    /**
     * @notice Get a single candidate's details.
     * @param candidateIndex The zero-based index of the candidate.
     * @return name The name of the candidate.
     * @return voteCount The number of votes the candidate has received.
     */
    function getCandidate(uint256 candidateIndex)
        external
        view
        returns (string memory name, uint256 voteCount)
    {
        require(candidateIndex < candidates.length, "BlockVote: Invalid candidate index.");
        Candidate storage c = candidates[candidateIndex];
        return (c.name, c.voteCount);
    }

    /**
     * @notice Get all candidates and their current vote counts.
     * @return names  Array of candidate names.
     * @return votes  Array of corresponding vote counts.
     */
    function getCandidates()
        external
        view
        returns (string[] memory names, uint256[] memory votes)
    {
        uint256 len = candidates.length;
        names = new string[](len);
        votes = new uint256[](len);

        for (uint256 i = 0; i < len; i++) {
            names[i] = candidates[i].name;
            votes[i] = candidates[i].voteCount;
        }

        return (names, votes);
    }

    /**
     * @notice Check whether a given address has already voted.
     * @param voter The wallet address to check.
     * @return True if the address has voted, false otherwise.
     */
    function checkHasVoted(address voter) external view returns (bool) {
        return hasVoted[voter];
    }

    /**
     * @notice Returns the total number of candidates.
     * @return The count of candidates.
     */
    function getCandidateCount() external view returns (uint256) {
        return candidates.length;
    }
}

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "./contract.js";

// ─── Constants ───────────────────────────────────────────────────────────────

const HARDHAT_CHAIN_ID = "0x7A69"; // 31337 in hex

const CANDIDATE_EMOJIS = ["🔵", "🟢", "🔴"];
const CANDIDATE_COLORS = ["#3b82f6", "#22c55e", "#ef4444"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Shorten a full Ethereum address to 0x1234…abcd */
function shortenAddress(addr) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

/** Build a read-only provider connected to the local Hardhat node */
function getReadProvider() {
  return new ethers.JsonRpcProvider("http://127.0.0.1:8545");
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function App() {
  // Wallet state
  const [account, setAccount] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Contract state
  const [candidates, setCandidates] = useState([
    { name: "Candidate A", voteCount: 0 },
    { name: "Candidate B", voteCount: 0 },
    { name: "Candidate C", voteCount: 0 },
  ]);
  const [hasVoted, setHasVoted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Status message
  const [status, setStatus] = useState({
    text: "Please connect your MetaMask wallet to begin.",
    type: "info",
  });

  // ─── Contract address validation ───────────────────────────────────────────
  const isContractConfigured =
    CONTRACT_ADDRESS &&
    CONTRACT_ADDRESS !== "PASTE_CONTRACT_ADDRESS_HERE" &&
    CONTRACT_ADDRESS.startsWith("0x");

  // ─── Read candidates from blockchain ───────────────────────────────────────
  const fetchCandidates = useCallback(async () => {
    if (!isContractConfigured) return;

    try {
      const provider = getReadProvider();
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        provider
      );
      const [names, votes] = await contract.getCandidates();
      const updated = names.map((name, i) => ({
        name,
        voteCount: Number(votes[i]),
      }));
      setCandidates(updated);
    } catch (err) {
      console.error("fetchCandidates error:", err);
    }
  }, [isContractConfigured]);

  // ─── Check if connected wallet has voted ───────────────────────────────────
  const checkVoteStatus = useCallback(
    async (address) => {
      if (!isContractConfigured || !address) return;
      try {
        const provider = getReadProvider();
        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          CONTRACT_ABI,
          provider
        );
        const voted = await contract.checkHasVoted(address);
        setHasVoted(voted);
        if (voted) {
          setStatus({ text: "You have already voted. Results are below.", type: "warning" });
        } else {
          setStatus({ text: "Wallet connected. Select a candidate to vote.", type: "success" });
        }
      } catch (err) {
        console.error("checkVoteStatus error:", err);
      }
    },
    [isContractConfigured]
  );

  // ─── Connect MetaMask ───────────────────────────────────────────────────────
  async function connectWallet() {
    if (!window.ethereum) {
      setStatus({
        text: "MetaMask not detected. Please install it from metamask.io",
        type: "error",
      });
      return;
    }

    setIsConnecting(true);
    setStatus({ text: "Connecting to MetaMask…", type: "info" });

    try {
      // Request accounts
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      // Check we're on the Hardhat network
      const chainId = await window.ethereum.request({ method: "eth_chainId" });
      if (chainId !== HARDHAT_CHAIN_ID) {
        setStatus({
          text: `Wrong network detected. Please switch MetaMask to the Hardhat Local Network (Chain ID 31337).`,
          type: "error",
        });
        setIsConnecting(false);
        return;
      }

      const addr = accounts[0];
      setAccount(addr);
      setStatus({ text: "Wallet connected successfully!", type: "success" });

      // Load blockchain data
      await fetchCandidates();
      await checkVoteStatus(addr);
    } catch (err) {
      console.error("connectWallet error:", err);
      setStatus({ text: "Connection cancelled or failed.", type: "error" });
    } finally {
      setIsConnecting(false);
    }
  }

  // ─── Send vote transaction ──────────────────────────────────────────────────
  async function castVote(candidateIndex) {
    if (!account) {
      setStatus({ text: "Please connect your MetaMask wallet first.", type: "error" });
      return;
    }
    if (!isContractConfigured) {
      setStatus({ text: "Contract address not configured. See contract.js.", type: "error" });
      return;
    }
    if (hasVoted) {
      setStatus({ text: "You have already voted.", type: "warning" });
      return;
    }

    setIsLoading(true);
    setStatus({ text: "Waiting for MetaMask confirmation…", type: "info" });

    try {
      // Get signer (MetaMask account)
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      // Send transaction
      setStatus({ text: "Transaction submitted. Waiting for confirmation…", type: "info" });
      const tx = await contract.vote(candidateIndex);

      setStatus({ text: "Transaction pending on blockchain…", type: "info" });
      await tx.wait(); // Wait for block confirmation

      // Update UI
      setHasVoted(true);
      setStatus({
        text: `✅ Vote submitted successfully for ${candidates[candidateIndex].name}!`,
        type: "success",
      });

      // Refresh vote counts from blockchain
      await fetchCandidates();
    } catch (err) {
      console.error("castVote error:", err);
      if (err.code === 4001 || err?.info?.error?.code === 4001) {
        setStatus({ text: "Transaction rejected by user.", type: "error" });
      } else if (err.message?.includes("already voted")) {
        setStatus({ text: "You have already voted.", type: "warning" });
        setHasVoted(true);
      } else {
        setStatus({
          text: `Transaction failed: ${err.reason || err.message || "Unknown error"}`,
          type: "error",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }

  // ─── Refresh vote counts ────────────────────────────────────────────────────
  async function handleRefresh() {
    setIsRefreshing(true);
    await fetchCandidates();
    setIsRefreshing(false);
    setStatus({ text: "Results refreshed from blockchain.", type: "success" });
  }

  // ─── Disconnect / account change listeners ─────────────────────────────────
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        setAccount(null);
        setHasVoted(false);
        setStatus({ text: "Wallet disconnected.", type: "info" });
      } else {
        const newAddr = accounts[0];
        setAccount(newAddr);
        checkVoteStatus(newAddr);
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [checkVoteStatus]);

  // Load candidates on mount (even before wallet connects)
  useEffect(() => {
    if (isContractConfigured) {
      fetchCandidates();
    }
  }, [fetchCandidates, isContractConfigured]);

  // ─── Total votes ────────────────────────────────────────────────────────────
  const totalVotes = candidates.reduce((sum, c) => sum + c.voteCount, 0);

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="page">
      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <header className="header">
        <div className="header-logo">
          <span className="logo-icon">🗳️</span>
          <div>
            <h1 className="header-title">BlockVote</h1>
            <p className="header-subtitle">Decentralized Student Voting DApp</p>
          </div>
        </div>
        <div className="header-badge">
          <span className="badge-dot" />
          Ethereum · Hardhat Local
        </div>
      </header>

      <main className="main">
        {/* ── NOT CONFIGURED WARNING ──────────────────────────────────────── */}
        {!isContractConfigured && (
          <div className="alert alert-warning">
            <strong>⚠️ Contract not configured.</strong> Open{" "}
            <code>frontend/src/contract.js</code> and paste your deployed
            contract address into <code>CONTRACT_ADDRESS</code>.
          </div>
        )}

        {/* ── WALLET SECTION ─────────────────────────────────────────────── */}
        <section className="card wallet-card">
          <h2 className="section-title">
            <span>👛</span> Wallet
          </h2>

          {account ? (
            <div className="wallet-info">
              <div className="wallet-address-pill">
                <span className="wallet-dot connected" />
                <span>{shortenAddress(account)}</span>
              </div>
              <div className="wallet-full">
                <span className="label">Full Address:</span>
                <code className="address-code">{account}</code>
              </div>
              <div className="network-info">
                <span className="network-badge">🟢 Hardhat Local (31337)</span>
              </div>
            </div>
          ) : (
            <div className="connect-section">
              <p className="connect-hint">
                Connect MetaMask to vote on the blockchain.
              </p>
              <button
                id="btn-connect-wallet"
                className="btn btn-primary"
                onClick={connectWallet}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <>
                    <span className="spinner" />
                    Connecting…
                  </>
                ) : (
                  <>🦊 Connect MetaMask</>
                )}
              </button>
            </div>
          )}
        </section>

        {/* ── STATUS BANNER ──────────────────────────────────────────────── */}
        <div className={`status-banner status-${status.type}`}>
          <span className="status-icon">
            {status.type === "success" && "✅"}
            {status.type === "error" && "❌"}
            {status.type === "warning" && "⚠️"}
            {status.type === "info" && "ℹ️"}
          </span>
          {status.text}
        </div>

        {/* ── CANDIDATE CARDS ─────────────────────────────────────────────── */}
        <section className="card">
          <h2 className="section-title">
            <span>🏆</span> Cast Your Vote
          </h2>
          <p className="section-hint">
            {account
              ? hasVoted
                ? "You have already cast your vote for this election."
                : "Select a candidate below. Each wallet can vote exactly once."
              : "Connect your wallet to participate in voting."}
          </p>

          <div className="candidates-grid">
            {candidates.map((candidate, index) => {
              const pct =
                totalVotes > 0
                  ? Math.round((candidate.voteCount / totalVotes) * 100)
                  : 0;
              return (
                <div
                  key={index}
                  className={`candidate-card ${hasVoted ? "voted-state" : ""}`}
                  style={{ "--accent": CANDIDATE_COLORS[index] }}
                >
                  <div className="candidate-header">
                    <span className="candidate-emoji">{CANDIDATE_EMOJIS[index]}</span>
                    <h3 className="candidate-name">{candidate.name}</h3>
                  </div>

                  <div className="vote-count-wrap">
                    <span className="vote-count">{candidate.voteCount}</span>
                    <span className="vote-label">
                      {candidate.voteCount === 1 ? "vote" : "votes"}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="progress-bar-bg">
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${pct}%`,
                        background: CANDIDATE_COLORS[index],
                      }}
                    />
                  </div>
                  <div className="progress-label">{pct}% of total votes</div>

                  <button
                    id={`btn-vote-${index}`}
                    className={`btn ${hasVoted ? "btn-disabled" : "btn-vote"}`}
                    style={
                      !hasVoted
                        ? {
                            background: CANDIDATE_COLORS[index],
                            borderColor: CANDIDATE_COLORS[index],
                          }
                        : {}
                    }
                    onClick={() => castVote(index)}
                    disabled={!account || hasVoted || isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner" />
                        Pending…
                      </>
                    ) : hasVoted ? (
                      "✓ Already Voted"
                    ) : !account ? (
                      "Connect Wallet"
                    ) : (
                      "Vote"
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── RESULTS SECTION ─────────────────────────────────────────────── */}
        <section className="card results-card">
          <div className="results-header">
            <h2 className="section-title">
              <span>📊</span> Current Results
            </h2>
            <button
              id="btn-refresh"
              className="btn btn-outline"
              onClick={handleRefresh}
              disabled={isRefreshing || !isContractConfigured}
            >
              {isRefreshing ? (
                <>
                  <span className="spinner spinner-sm" />
                  Refreshing…
                </>
              ) : (
                "🔄 Refresh"
              )}
            </button>
          </div>

          <div className="results-total">
            Total votes cast: <strong>{totalVotes}</strong>
          </div>

          <div className="results-list">
            {candidates.map((c, i) => {
              const pct =
                totalVotes > 0
                  ? Math.round((c.voteCount / totalVotes) * 100)
                  : 0;
              const isLeading =
                c.voteCount === Math.max(...candidates.map((x) => x.voteCount)) &&
                c.voteCount > 0;
              return (
                <div key={i} className="result-row">
                  <div className="result-name">
                    {isLeading && <span className="leading-badge">👑</span>}
                    <span
                      className="result-dot"
                      style={{ background: CANDIDATE_COLORS[i] }}
                    />
                    {c.name}
                  </div>
                  <div className="result-bar-wrap">
                    <div className="result-bar-bg">
                      <div
                        className="result-bar-fill"
                        style={{
                          width: `${pct}%`,
                          background: CANDIDATE_COLORS[i],
                        }}
                      />
                    </div>
                    <span className="result-votes">{c.voteCount} votes ({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="results-note">
            📡 Results are read directly from the Ethereum smart contract.
          </p>
        </section>
      </main>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer className="footer">
        <p>
          BlockVote · Decentralized Voting DApp · Built with{" "}
          <strong>Solidity</strong>, <strong>Hardhat</strong>,{" "}
          <strong>ethers.js</strong> &amp; <strong>React</strong>
        </p>
        <p className="footer-sub">
          College Mini-Project · Blockchain Technology
        </p>
      </footer>
    </div>
  );
}

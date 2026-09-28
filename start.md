# 🚀 Quick Start Guide: How to Run BlockVote Locally

This guide will walk you through exactly how to start the BlockVote DApp on your computer for a demo.

---

## 1. Start the Local Blockchain
Open a terminal in the root of the `BlockVote` folder and run:
```bash
npx hardhat node
```
*Leave this terminal open. It runs your local Ethereum network.*

---

## 2. Deploy the Smart Contract
Open a **second terminal** in the `BlockVote` folder and run:
```bash
npx hardhat run scripts/deploy.js --network localhost
```
When it finishes, it will print something like:
`Contract Address: 0x5FbDB2315678afecb367f032d93F642f64180aa3`

**Copy that address.**

---

## 3. Connect the Frontend to the Contract
1. Open the file `frontend/src/contract.js` in your code editor.
2. Find this line (around line 22):
   ```javascript
   export const CONTRACT_ADDRESS = "0x5FbDB... (your address)";
   ```
3. Paste the address you copied in Step 2 here. Save the file.

---

## 4. Start the Frontend Website
In your **second terminal**, run these commands:
```bash
cd frontend
npm run dev
```
Open the link it gives you (usually `http://localhost:3000` or `http://localhost:5173`) in your browser.

---

## 5. Setup MetaMask for the Demo
Before you can vote, you need to connect MetaMask to your local blockchain and import a test account that has fake money to pay for the voting transaction fee.

### A. Add the Local Network
1. Click the MetaMask extension icon in your browser.
2. Click the network dropdown at the very top left.
3. Click **Add network** -> **Add a network manually**.
4. Fill in these details:
   - **Network name:** `Hardhat Local`
   - **New RPC URL:** `http://127.0.0.1:8545`
   - **Chain ID:** `31337`
   - **Currency symbol:** `ETH`
5. Click **Save**, then switch to this network.

### B. Import a Test Account
1. Copy this exact Private Key (it is Account #0 from your local blockchain):
   ```text
   0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   ```
2. Open MetaMask.
3. Click the account dropdown at the top middle (e.g., "Account 1").
4. Click **Add account or hardware wallet** -> **Import account**.
5. Paste the private key and click **Import**.

*You will now see an account with 10,000 ETH!*

---

**You are now ready!** Go to the website, click "Connect MetaMask", and cast your vote.

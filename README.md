# **Freelance: A decentralised freelancing platform**

We have tried to make a **blockchain-based decentralised web application (DApp)** that allows freelancers and recruiters (clients) to connect on projects with built-in escrow. The recruiter (client) can put their project ideas and set the guidelines for the same. The freelancer can browse through the available projects on the platform and apply for the ones they are interested in. The freelancer will have to upload their files as a proof of work for each milestone that is set by the client.

# Freelance: A Decentralised Freelancing Platform

This is a blockchain-based decentralised DApp that connects freelancers and clients with
built-in escrow, automated ratings, and decentralized arbitration.

 
The existing platforms don't have an **automated rating system**. Our platform automates the rating system so as to **prevent ratings being abused by malicious actors**.
There also does not exist a comprehensive solution which automates the entire workflow and integrates it with **decentralized arbitration** as we have done. 
The files are also uploaded on **IPFS** making them available as an **immutable proof** for the arbitrators. We have also **automated the payment of funds** after acceptance of proof of work for each milestone via **escrow contracts**.

## Workflow:

- Our website begins with asking the user to login/sign up as a client or freelancer.
  
### Client Side:
- The client dashboard displays details about the client's **Etherium (MetaMask)** account. The client can either add or view projects. For adding a project, the client must fix the reward amount.
- Client can then split up the work of each project into different milestones. Each milestone specifies the percentage of reward to be transacted upon completion of that milestone by the freelancer.
- The client can also view all the pending requests that the freelancers might have sent and can either decline or accept. The request contains important details like the freelancers address and rating.
- If accepted, a new **escrow account** is created, and the total reward is transferred from the client's account to the escrow account. All the future milestone payments are done from this escrow account.

### Freelancer Side:
- The freelancer can view all the projects that are available. Each project contains the necessary details, along with the option of applying for the project and viewing the milestones. Once accepted, the freelancer can start uploading the necessary files as proof for each milestone. Each file is stored on **IPFS** through a **dedicated gateway** (QuickNode Service), and a **CID (Content Identifier)** is generated for the same.
  
- The client views the proof files submitted by the freelancer for a particular milestone. If the client accepts the submission, the rating of the freelancer will get incremented, and the reward allotted for this milestone will be credited to the freelancer's account. If the client rejects the submission, the freelancer can either accept the rejection and work on it again (rating of freelancer decreases) or call for an **arbitration service (through Kleros)**.

The web application works smoothly on localhost (utilizing Ganache Etherum accounts). The contracts have also been deployed on Sepolia public testnet, through an Etherum RPC Endpoint. 


## Features

1. **Client Project Posting**: Clients can create project requests with:
   - Project name and description
   - Payment amount
   - Milestones and payments for each milestone

2. **Freelancer File Submission**: Freelancers view available projects, select one to work on, and submit files at each milestone.

3. **Automated Payment and Rating System**: 
   - **Case 1**: If the client accepts the submitted files, payment is released automatically, and ratings are updated.
   - **Case 2**: If the client accepts with delayed milestones, the payment is reduced, and the freelancer's rating decreases slightly.
   - **Case 3**: If the client rejects the submission, the freelancer has the option to either revise the files or raise a dispute.
       - **Subcase 1**: Freelancer agrees to revise the work and resubmits.
       - **Subcase 2**: Freelancer raises a dispute; Kleros appoints an anonymous arbitrator to resolve the issue, determining the fund distribution.

4. **Dispute Resolution via Kleros**: When disputes arise, the Kleros arbitration system ensures fair decision-making.

5. **Rating System**: Ratings are calculated as a weighted average of all transaction outcomes, considering factors like transaction success or delay.

## Technology Stack

- **Ethereum (Sepolia test network)**: Smart contract deployment
- **Kleros**: Decentralized arbitration for disputes
- **IPFS**: Decentralized file storage
- **React**: Frontend for the user interface
- **Ethers.js**: Interact with the Ethereum network and contracts

## Prerequisites

To run this project, ensure you have the following installed:
- **Node.js** and **npm**: Download from [Node.js Official Website](https://nodejs.org/).
- **MetaMask**: Browser wallet for Ethereum interaction.
- **QuickNode Account**: Ethereum and IPFS provider, available at [QuickNode](https://www.quicknode.com/).
- **Ganache Account**: App for test accounts and network.

## Installation and Setup

### Quick Start (Ganache Local Development)

1. **Clone & Install**:
   ```bash
   git clone https://github.com/kunall0880/Freelance-.git
   cd Delance
   npm install
   ```

2. **Start Ganache** (Terminal 1):
   ```bash
   npm run ganache
   ```
   Runs a local blockchain at `127.0.0.1:7545` with 10 test accounts (100 ETH each).

3. **Deploy Smart Contracts** (Terminal 2):
   ```bash
   cd truffle_project
   truffle migrate --network development --reset
   ```
   Output shows:
   ```
   Deploying 'Projects'
      ... deployed at 0x560f7702093C56280F06AA56d0C7E1034DD6BfE9
   Deploying 'RequestManager'
      ... deployed at 0x1FB4b1457279A7181cEd5B90B1AF11046008ACdE
   ```

4. **⚠️ CRITICAL: Copy Contract Artifacts After Every Deploy**
   
   The React app **must** use fresh compiled ABIs. Run from `Delance` root:
   
   **Windows PowerShell:**
   ```powershell
   Copy-Item "truffle_project\build\contracts\Projects.json" "src\contracts\Projects.json" -Force
   Copy-Item "truffle_project\build\contracts\RequestManager.json" "src\contracts\RequestManager.json" -Force
   ```
   
   **macOS/Linux:**
   ```bash
   cp truffle_project/build/contracts/Projects.json src/contracts/
   cp truffle_project/build/contracts/RequestManager.json src/contracts/
   ```
   
   **⚠️ Without this step, you'll see: `AbiError: Parameter decoding error...`**

5. **Configure MetaMask for Ganache**:
   - Click MetaMask → Network Selector → **Add Network**.
   - Fill in:
     ```
     Network name: Ganache
     RPC URL: http://127.0.0.1:7545
     Chain ID: 1337
     Currency: ETH
     ```
   - Save and switch to Ganache.
   - Import a test account: MetaMask → **Add Account** → **Import** → paste private key from Ganache.

6. **Install MetaMask**:
   Download from [MetaMask website](https://metamask.io/).

6. **Configure MetaMask**

   - Open MetaMask and click the network selector at the top.
   - Choose **Add network** → **Add a custom network**.
   - Fill in the values:
     - Network name: `Ganache`
     - RPC URL: `http://127.0.0.1:7545`
     - Chain ID: `1337` (check your Ganache output if different)
     - Currency symbol: `ETH`
   - Save and **select Ganache** as the active network.
   - Import one of the accounts listed in Ganache using its private key.

   **Important:** if MetaMask is pointed at any other network (e.g. Sepolia or
   Base), the app will prompt for gas and fail to locate the contracts. Always
   switch to the Ganache network while developing locally.

7. **Run the Frontend**

   Install dependencies and start React (from `Delance` root):

   ```bash
   npm install
   npm start
   ```

   The app will open at `http://localhost:3000`. Connect MetaMask when
   prompted; the network ID and contract addresses are logged to the browser
   console for debugging.

8. **Test the DApp**

   - Sign in as **Client** or **Freelancer**.
   - Use the client UI to create projects and add milestones.
   - Transactions execute instantly on Ganache with no gas cost.
   - If you don't see your projects, check that:
     1. MetaMask is on Ganache (chain ID 1337).
     2. Contract artifacts were copied to `src/contracts/`.
     3. Browser console shows no ABI errors.

---

## Deployment on Sepolia Testnet

For public testnet deployment (optional):

1. **Fund Your Account**:
   Visit [sepoliafaucet.com](https://sepoliafaucet.com/) and claim Sepolia ETH.

2. **Update `.env`**:
   ```env
   MNEMONIC="your twelve-word phrase"
   SEPOLIA_RPC_URL="https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY"
   ```

3. **Deploy to Sepolia**:
   ```bash
   cd truffle_project
   truffle migrate --network sepolia --reset
   ```

4. **Copy Artifacts** (same as Ganache step 4):
   ```powershell
   Copy-Item "truffle_project\build\contracts\Projects.json" "..\src\contracts\Projects.json" -Force
   Copy-Item "truffle_project\build\contracts\RequestManager.json" "..\src\contracts\RequestManager.json" -Force
   ```

5. **Add Sepolia to MetaMask**:
   - Network name: `Sepolia`
   - RPC URL: `https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY`
   - Chain ID: `11155111`
   - Currency: `ETH`

6. **Run the app** and test on Sepolia.

---

## Additional Scripts

The `package.json` in the root of `Delance` includes a few helpful commands:

```json
{
  "scripts": {
    "ganache": "ganache -p 7545",
    "migrate:dev": "truffle migrate --network development --reset",
    "test:dev": "truffle test --network development"
  }
}
```

Use `npm run ganache` to launch the local chain, `npm run migrate:dev` to
redeploy and `npm run test:dev` to execute the Solidity test suite locally.

## Environment Variables

The project uses a `.env` file (Gitignored) to store sensitive values. For
local development you only need an optional mnemonic. Two variables can
override contract addresses when connecting to other networks:

```env
REACT_APP_PROJECTS_CONTRACT_ADDRESS=0x...
REACT_APP_REQUEST_MANAGER_ADDRESS=0x...
```

These are read by `src/services/web3.js` and take precedence over the artifact
lookup.

## Troubleshooting

- **"AbiError: Parameter decoding error" or projects/milestones not loading**
  - **Cause:** Stale or mismatched contract artifacts in `src/contracts/`.
  - **Fix:** 
    1. Re-run migrations: `truffle migrate --network development --reset`
    2. **Copy fresh artifacts** (see step 4 above)
    3. Reload the browser (`F5`)

- **Contracts not found / "Unable to determine Projects contract address"**
  - Ensure MetaMask is on the correct network:
    - **Ganache:** Chain ID 1337, RPC `http://127.0.0.1:7545`
    - **Sepolia:** Chain ID 11155111
  - If switched, reload the page.
  - Check browser console for network logs.

- **MetaMask prompts for gas but transaction fails**
  - MetaMask is connected to the wrong network. Switch to Ganache or Sepolia.
  - Verify chain ID in the MetaMask network settings.

- **Projects created but can't view them**
  - Confirm MetaMask account matches the one used to create projects.
  - Open browser console and look for any `Error fetching user projects` messages.
  - Verify contract artifacts were copied after the latest deployment.
    Ganache.
  - Confirm the JSON artifact you copied contains the `networks` block with
    the correct chain ID and address. Redeploy and recopy if necessary.
  - Check the browser console for the log messages added by `getDeployedAddress`.

- **Ganache CLI not recognized**
  - Use `npm install` inside `Delance` to add `ganache` binary. The script
    `npm run ganache` should then work.
  - You can also install `ganache` globally: `npm install -g ganache`.

- **Chain ID mismatch (5777 vs 1337)**
  - Update `truffle-config.js` to match the `chainId` reported by Ganache, or
    run Ganache with `--chainId 1337`.

- **MetaMask refuses transaction from localhost**
  - Make sure the request origin (`http://localhost:3000`) is allowed in
    MetaMask settings under "Connected sites" and you have unlocked the
    imported account.

## Deploying to a Testnet or Mainnet

When you're ready to move off Ganache, configure a network entry in
`truffle-config.js` with an HDWallet provider and appropriate RPC URL. Set the
environment variables `MNEMONIC` and, for example, `SEPOLIA_RPC_URL` or
`INFURA_API_KEY`. The frontend will then pick up addresses via the artifacts
(or env overrides if provided).

---

## Gitignore

The project already includes a `.gitignore` file to keep sensitive or
machine-specific files out of version control. Here's a sample you can
reference or extend:

```
# React build output
/node_modules/
/build/
/dist/

# local env files
.env

# Truffle build artifacts (optional if you copy to src/contracts)
/truffle_project/build/contracts/

# IDE/editor directories
.vscode/
.idea/

# log files
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# OS files
.DS_Store
Thumbs.db
```

Make sure your own `.env` never gets committed; it contains your mnemonic
and RPC URLs. You can add additional entries such as `*.secret` or other
private data.

## Links

- [Truffle documentation](https://www.truffleframework.com/docs/)
- [Ganache CLI](https://www.trufflesuite.com/ganache)
- [MetaMask custom RPC guide](https://metamask.io/faqs/#c6)

## References

This project is based on the original
[Delance](https://github.com/kunall0880/Freelance-) repository by @kunall0880.
The current setup focuses on **local development with Ganache** to avoid testnet
gas fees and enable rapid iteration.

**Key Changes for Local Development:**
- Dynamic contract address resolution from build artifacts
- Ganache network configuration (chain ID 1337)
- Automated npm scripts for `ganache`, `migrate:dev`, and `test:dev`
- Enhanced troubleshooting and MetaMask setup guidance

For the complete feature set and original design, see the
[original repository](https://github.com/kunall0880/Freelance-).

Happy hacking! Feel free to file issues or pull requests in this repo if you
want to refine the setup or add automation.  

## Running the Application

### Start the Development Server

    npm start

### Open the DApp

- Open your browser and navigate to `http://localhost:3000`.

### Dispute Resolution

1. If a freelancer raises a dispute, an anonymous arbitrator from Kleros is appointed to review the case.
2. Based on the arbitrator's decision:
   - If the client’s rejection is validated, funds remain in the contract.
   - If the freelancer's submission is upheld, funds are released to the freelancer.
3. **Automatic Rating Adjustment**:
   - Ratings for both the client and freelancer are updated based on the arbitration outcome, influencing each party’s reputation on the platform.



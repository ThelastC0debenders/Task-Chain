# Taskchain

On-chain task management platform with live workspace integration. Claim tasks, build in Monaco editor, commit via Git terminal, and complete on-chain.

## Architecture

```
taskchain/
├── contracts/          # Solidity smart contracts (Hardhat)
├── backend/           # Express API server (TypeScript)
├── frontend/          # React + Vite UI (TypeScript)
└── README.md
```

## Features

- **On-Chain Task Lifecycle**: Create, claim, and complete tasks via Ethereum smart contracts
- **Live Workspace**: Monaco editor with file tree, permissions (editable/readonly)
- **Git Integration**: Terminal for git commands, commit panel
- **MetaMask Wallet**: Connect wallet, automatic network switching to Hardhat local (31337)
- **Hyper-Neon UI**: Animated gradients, floating blobs, glass morphism cards
- **Team Invites**: Token-based team joining with wallet verification

## Tech Stack

### Smart Contracts
- Solidity ^0.8.20
- Hardhat
- ethers v6
- OpenZeppelin

### Backend
- Node.js + Express
- TypeScript
- Simple Git (workspace git operations)
- In-memory storage (tasks, teams, workspaces)

### Frontend
- React 18
- TypeScript
- Vite
- Monaco Editor
- ethers v6
- axios

## Prerequisites

- **Node.js**: v18+ recommended
- **npm** or **yarn**
- **MetaMask**: Browser extension
- **Git**: For workspace operations

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/saaj376/taskchain.git
cd taskchain
```

### 2. Install Dependencies

#### Contracts
```bash
cd contracts
npm install
```

#### Backend
```bash
cd ../backend
npm install
```

#### Frontend
```bash
cd ../frontend
npm install
```

## Configuration

### Smart Contract

Edit `frontend/src/config/contract.ts`:
```typescript
export const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
export const CHAIN_ID = 31337 // Hardhat local network
```

### Backend

Create `backend/.env`:
```env
PORT=5000
NODE_ENV=development
```

## Running the Project

### 1. Start Hardhat Local Network

```bash
cd contracts
npx hardhat node
```

Keep this terminal running. Note the first account address and private key.

### 2. Deploy Smart Contract

In a new terminal:
```bash
cd contracts
npx hardhat run scripts/deploy.js --network localhost
```

Copy the deployed contract address and update `frontend/src/config/contract.ts`.

### 3. Import Hardhat Account to MetaMask

1. Open MetaMask
2. Click account icon → Import Account
3. Paste the private key from Hardhat node output
4. Add Hardhat network:
   - Network Name: `Hardhat Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency Symbol: `ETH`

### 4. Start Backend Server

```bash
cd backend
npm run dev
```

Backend runs on `http://localhost:5000`.

### 5. Start Frontend Dev Server

```bash
cd frontend
npm run dev
```

Frontend runs on `http://localhost:5173`.

## Usage

### Admin Dashboard

1. Navigate to `http://localhost:5173/admin`
2. Connect MetaMask wallet
3. Create a team
4. Generate invite tokens
5. Create tasks with:
   - Title, description
   - Priority (1-10)
   - Deadline
   - Reward (optional)

### Member Dashboard

1. Navigate to `http://localhost:5173/member?token=<invite-token>`
2. Connect MetaMask wallet
3. Accept invite to join team
4. View available tasks
5. **Claim Task**:
   - Click "Claim" on an open task
   - Triggers on-chain transaction
   - Opens live workspace with Monaco editor + Git terminal
6. **Work on Task**:
   - Edit files in Monaco editor
   - Save changes
   - Run git commands in terminal
   - Commit changes with message
7. **Complete Task**:
   - Click "Complete"
   - Generates receipt hash + IPFS CID
   - Records completion on-chain

## Smart Contract API

### TaskChain.sol

**Create Task**
```solidity
function createTask(
  bytes32 metadataHash,
  string memory category,
  uint256 deadline,
  uint256 gracePeriod,
  uint8 priority
) external returns (uint256)
```

**Claim Task**
```solidity
function claimTask(
  uint256 taskId,
  CommitmentLevel commitment
) external
```

**Complete Task**
```solidity
function completeTask(
  uint256 taskId,
  bytes32 receiptHash,
  string memory ipfsCid
) external
```

**Get Task**
```solidity
function getTask(uint256 taskId) external view returns (Task memory)
```

## Backend API

### Tasks

- `POST /task/create` - Create task
- `GET /task/:teamId` - Get all team tasks
- `PATCH /task/:teamId/:taskId` - Update task status

### Teams

- `POST /team/create` - Create team
- `POST /team/invite` - Generate invite token
- `POST /team/accept` - Accept invite with wallet

### Workspace

- `POST /workspace/create` - Initialize workspace from repo
- `GET /workspace/:taskId/:claimId/files` - List workspace files
- `GET /workspace/:taskId/:claimId/file/:path` - Read file
- `POST /workspace/:taskId/:claimId/file/:path` - Save file
- `POST /workspace/:taskId/:claimId/git` - Execute git command
- `POST /workspace/:taskId/:claimId/commit` - Commit changes

## Project Structure

### Contracts
```
contracts/
├── contracts/
│   └── taskchain.sol      # Main smart contract
├── scripts/
│   └── deploy.js          # Deployment script
├── hardhat.config.js      # Hardhat configuration
└── package.json
```

### Backend
```
backend/
├── src/
│   ├── index.ts           # Express app entry
│   ├── routes/
│   │   ├── task.ts        # Task routes
│   │   ├── team.ts        # Team routes
│   │   └── workspace.ts   # Workspace routes
│   └── services/
│       ├── task.ts        # Task business logic
│       ├── team.ts        # Team management
│       └── workspace.ts   # Git operations
├── .env
└── package.json
```

### Frontend
```
frontend/
├── src/
│   ├── pages/
│   │   ├── admin-dashboard.tsx    # Admin UI
│   │   └── member-dashboard.tsx   # Member UI
│   ├── services/
│   │   ├── wallet.ts              # MetaMask connection
│   │   └── contract.ts            # Contract interactions
│   ├── config/
│   │   ├── contract.ts            # Contract address + chain ID
│   │   └── taskchain-abi.json     # Contract ABI
│   └── App.tsx
└── package.json
```

## Dependencies

### Contracts (package.json)
- `hardhat`: ^2.19.2
- `@nomicfoundation/hardhat-toolbox`: ^4.0.0
- `@openzeppelin/contracts`: ^5.0.1

### Backend (package.json)
- `express`: ^4.21.2
- `typescript`: ^5.8.2
- `tsx`: ^4.19.2
- `simple-git`: ^3.27.0
- `cors`: ^2.8.5
- `dotenv`: ^17.2.3

### Frontend (package.json)
- `react`: ^18.3.1
- `react-dom`: ^18.3.1
- `vite`: ^6.0.5
- `typescript`: ~5.6.2
- `ethers`: ^6.13.5
- `@monaco-editor/react`: ^4.6.0
- `axios`: ^1.7.9

## Development

### Build for Production

**Frontend:**
```bash
cd frontend
npm run build
```

**Backend:**
```bash
cd backend
npm run build
```

**Contracts:**
```bash
cd contracts
npx hardhat compile
```

### Testing

**Contracts:**
```bash
cd contracts
npx hardhat test
```

## Troubleshooting

### MetaMask "Network Changed" Error
- Fixed: Frontend rebuilds provider after chain switch
- Check `frontend/src/services/wallet.ts` for implementation

### Task Already Claimed
- Backend validation prevents duplicate claims
- Smart contract enforces single claimer per task
- Check task status before claiming

### Workspace Not Loading
- Ensure backend is running on port 5000
- Check workspace creation endpoint logs
- Verify repo URL is accessible

### Contract Deployment Issues
- Ensure Hardhat node is running
- Check account has sufficient ETH
- Verify contract address in config matches deployed address

## License

MIT

## Contributing

Pull requests welcome. For major changes, open an issue first to discuss.

## Contact

- GitHub: [@saaj376](https://github.com/saaj376)
- Project: [taskchain](https://github.com/saaj376/taskchain)
# Taskchain-CIT
# Taskchain-CIT

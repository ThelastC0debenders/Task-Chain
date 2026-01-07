# 🔗 Task-Chain

> A decentralized, on-chain task management platform with integrated live workspace, AI-powered development assistance, and blockchain verification.
> Demo Link: https://drive.google.com/file/d/1QOu2VpClh-sxfqRj58BVmylct4JSiATj/view

[![License:  MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7%2B-blue)](https://www.typescriptlang.org/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-purple)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-3.1%2B-yellow)](https://hardhat.org/)
[![React](https://img.shields.io/badge/React-18.2-blue)](https://reactjs.org/)

---

## Demo Link: https://drive.google.com/file/d/1QOu2VpClh-sxfqRj58BVmylct4JSiATj/view

## 📖 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Technology Stack](#-technology-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Running the Project](#-running-the-project)
- [Usage Guide](#-usage-guide)
- [API Documentation](#-api-documentation)
- [Smart Contract Reference](#-smart-contract-reference)
- [Project Structure](#-project-structure)
- [Development](#-development)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**Taskchain-CIT** is a revolutionary blockchain-based task management platform that bridges traditional project management with Web3 technology. It combines smart contract-powered task lifecycle management with an integrated development environment, enabling teams to: 

- Create, claim, and complete tasks with on-chain verification
- Work collaboratively in live workspaces with Monaco editor integration
- Execute Git operations directly within the platform
- Leverage AI assistance powered by LangChain and Google Generative AI
- Generate verifiable completion receipts with IPFS storage
- Manage team access through blockchain wallet authentication

The platform is built as a monorepo with three main components:  **Smart Contracts** (Solidity + Hardhat), **Backend** (Node.js + Express + TypeScript), and **Frontend** (React + Vite + TypeScript).

---

## ✨ Key Features

### 🔐 Blockchain-Powered Task Management
- **On-Chain Task Lifecycle**:  All task states (created, claimed, completed) recorded immutably on Ethereum
- **Smart Contract Enforcement**: Automatic validation of task claims, deadlines, and completions
- **Wallet-Based Authentication**: MetaMask integration for secure user identity
- **Automatic Network Switching**: Seamless transition to Hardhat local network (Chain ID:  31337)

### 💻 Integrated Development Workspace
- **Monaco Editor**: Full-featured code editor with syntax highlighting and IntelliSense
- **File Tree Navigation**: Browse and manage workspace files with permissions (editable/readonly)
- **Git Terminal**: Execute git commands directly in the browser
- **Commit Panel**: Stage changes and commit with messages
- **Real-time Collaboration**: Socket.io-powered live updates

### 🤖 AI-Powered Assistance
- **LangChain Integration**: Advanced AI workflow orchestration via LangGraph
- **Google Generative AI**: Context-aware code suggestions and problem-solving
- **MongoDB Vector Store**: Semantic search for code snippets and documentation
- **Intelligent Task Analysis**: AI-driven task complexity estimation

### 🎨 Modern UI/UX
- **Hyper-Neon Design**: Animated gradients and floating blob backgrounds
- **Glass Morphism**: Translucent cards with backdrop blur effects
- **Responsive Layout**: Mobile-first design with React Flow visualizations
- **Rich Text Editor**: React Quill integration for detailed task descriptions
- **Canvas Confetti**: Celebration animations on task completion

### 👥 Team Management
- **Token-Based Invites**: Secure team joining via cryptographic tokens
- **Wallet Verification**: On-chain proof of team membership
- **Role-Based Access**:  Admin and member dashboards with tailored permissions
- **Leaderboard Tracking**: Gamification with performance metrics

### 📊 Analytics & Reporting
- **PDF Generation**: Automated task completion certificates via PDFKit
- **HTML2Canvas**: Screenshot capture for visual records
- **Recharts Visualization**: Task analytics and team performance dashboards
- **Date-fns Integration**: Flexible date handling for deadlines and grace periods

---

## 🏗️ Architecture

```
taskchain-CIT/
├── contracts/              # Ethereum smart contracts
│   ├── contracts/
│   │   └── taskchain.sol   # Main TaskChain contract
│   ├── scripts/            # Deployment and automation scripts
│   ├── test/               # Contract unit tests
│   ├── deployments/        # Deployed contract addresses
│   └── hardhat.config.ts   # Hardhat network configuration
│
├── backend/                # Express API server
│   ├── src/
│   │   ├── config/         # Firebase, database, and env configs
│   │   ├── routes/         # API endpoint definitions
│   │   ├── services/       # Business logic and AI services
│   │   ├── types/          # TypeScript type definitions
│   │   ├── utils/          # Helper functions
│   │   ├── socket.ts       # Socket.io real-time events
│   │   └── index.ts        # Server entry point
│   └── package.json
│
├── frontend/               # React single-page application
│   ├── src/
│   │   ├── pages/          # Route components
│   │   ├── components/     # Reusable UI components
│   │   ├── services/       # API clients and wallet integrations
│   │   ├── config/         # Contract ABI and addresses
│   │   ├── hooks/          # Custom React hooks
│   │   └── App.tsx         # Main application component
│   └── package.json
│
├── package.json            # Root workspace configuration
├── LICENSE                 # MIT License
└── README.md              # This file
```

### System Flow

```mermaid
graph TB
    A[User Wallet] -->|Connect| B[Frontend React App]
    B -->|HTTP/WS| C[Express Backend]
    B -->|ethers.js| D[Smart Contract]
    C -->|MongoDB| E[Vector Store]
    C -->|LangChain| F[AI Agents]
    C -->|Firebase| G[User Data]
    D -->|Events| B
    F -->|Context| C
```

---

## 🛠️ Technology Stack

### Smart Contracts Layer
| Technology | Version | Purpose |
|------------|---------|---------|
| **Solidity** | ^0.8.20 | Smart contract language |
| **Hardhat** | ^3.1.2 | Ethereum development environment |
| **ethers.js** | ^6.16.0 | Contract interaction library |
| **OpenZeppelin** | ^5.4.0 | Secure contract standards |

### Backend Layer
| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 18+ | Runtime environment |
| **Express** | ^5.2.1 | Web server framework |
| **TypeScript** | ^5.7.3 | Type-safe JavaScript |
| **Socket.io** | ^4.8.3 | Real-time bidirectional communication |
| **LangChain** | ^1.2.4 | AI agent orchestration |
| **@langchain/google-genai** | ^2.1.4 | Google AI integration |
| **@langchain/langgraph** | ^1.0.7 | Stateful AI workflows |
| **@langchain/mongodb** | ^1.1.0 | Vector storage for embeddings |
| **MongoDB** | ^7.0.0 | NoSQL database |
| **Firebase Admin** | ^13.6.0 | Authentication and Firestore |
| **googleapis** | ^169.0.0 | Google API integrations |
| **PDFKit** | ^0.17.2 | PDF report generation |

### Frontend Layer
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | ^18.2.0 | UI component library |
| **TypeScript** | ~5.9.3 | Type safety |
| **Vite** | ^7.2.4 | Build tool and dev server |
| **ethers.js** | ^6.16.0 | Wallet and contract interactions |
| **@monaco-editor/react** | ^4.7.0 | Code editor component |
| **React Router** | ^7.11.0 | Client-side routing |
| **ReactFlow** | ^11.11.4 | Node-based graph visualizations |
| **Recharts** | ^3.6.0 | Chart library |
| **React Quill** | ^2.0.0 | Rich text editor |
| **canvas-confetti** | ^1.9.4 | Celebration animations |
| **html2canvas** | ^1.4.1 | DOM to canvas rendering |
| **Lucide React** | ^0.562.0 | Icon library |
| **Socket.io Client** | ^4.8.3 | Real-time client |
| **axios** | ^1.13.2 | HTTP client |
| **date-fns** | ^4.1.0 | Date utilities |

---

## ✅ Prerequisites

Before starting, ensure you have: 

- **Node.js**:  v18.0.0 or higher ([Download](https://nodejs.org/))
- **npm**: v9.0.0 or higher (comes with Node.js)
- **Git**: Latest version ([Download](https://git-scm.com/))
- **MetaMask**: Browser extension ([Install](https://metamask.io/))
- **Code Editor**: VS Code recommended ([Download](https://code.visualstudio.com/))

**Optional but Recommended:**
- **MongoDB**: For AI vector storage ([Install](https://www.mongodb.com/try/download/community))
- **Firebase Account**: For user authentication ([Sign Up](https://firebase.google.com/))
- **Google Cloud API Key**: For AI features ([Get Key](https://makersuite.google.com/app/apikey))

---

## 📦 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/ThelastC0debenders/taskchain-CIT.git
cd taskchain-CIT
```

### 2. Install Root Dependencies

```bash
npm install
```

### 3. Install Workspace Dependencies

The project uses npm workspaces for monorepo management: 

```bash
npm run install: all
```

Or install individually:

```bash
# Contracts
cd contracts && npm install && cd ..

# Backend
cd backend && npm install && cd ..

# Frontend
cd frontend && npm install && cd ..
```

---

## ⚙️ Configuration

### 1. Smart Contract Configuration

Create `contracts/.env`:

```env
# Hardhat Local Network
HARDHAT_RPC_URL=http://127.0.0.1:8545
HARDHAT_CHAIN_ID=31337

# Deployment Account (use Hardhat's default account #0)
PRIVATE_KEY=private key

# Optional: For mainnet/testnet deployment
# ETHERSCAN_API_KEY=your_etherscan_api_key
# ALCHEMY_API_KEY=your_alchemy_api_key
```

### 2. Backend Configuration

Create `backend/.env`:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB (for AI features)
MONGODB_URI=mongodb://localhost:27017/taskchain-cit
MONGODB_DB_NAME=taskchain-cit

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your_service_account@your-project.iam.gserviceaccount.com

# Google Generative AI
GOOGLE_API_KEY=your_google_ai_api_key

# CORS (adjust for production)
ALLOWED_ORIGINS=http://localhost:5173

# Contract Address (update after deployment)
CONTRACT_ADDRESS=your contract address
```

### 3. Frontend Configuration

Update `frontend/src/config/contract.ts`:

```typescript
export const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
export const CHAIN_ID = 31337; // Hardhat local network
export const BACKEND_URL = "http://localhost:5000";
```

Update `frontend/src/config/firebase.ts` (if using Firebase):

```typescript
export const firebaseConfig = {
  apiKey: "your_firebase_api_key",
  authDomain: "your-project. firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId:  "your_app_id"
};
```

---

## 🚀 Running the Project

### Step 1: Start Hardhat Local Node

In a dedicated terminal: 

```bash
cd contracts
npx hardhat node
```

**Output Example:**
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/

Accounts
========
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
... 
```

⚠️ **Keep this terminal running for the entire development session.**

### Step 2: Deploy Smart Contract

In a new terminal:

```bash
cd contracts
npx hardhat run scripts/deploy.ts --network localhost
```

**Expected Output:**
```
TaskChain deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

📋 **Copy the contract address** and update: 
- `frontend/src/config/contract.ts`
- `backend/.env` (CONTRACT_ADDRESS)

### Step 3: Configure MetaMask

1. Open MetaMask extension
2. Click **Network Dropdown** → **Add Network** → **Add a network manually**
3. Enter network details:
   - **Network Name**:  Hardhat Local
   - **RPC URL**: `http://127.0.0.1:8545`
   - **Chain ID**: `31337`
   - **Currency Symbol**: `ETH`
4. **Import Account**:
   - Click account icon → **Import Account**
   - Paste Account #0 private key from Hardhat node output
   - Confirm

### Step 4: Start Backend Server

In a new terminal: 

```bash
cd backend
npm run dev
```

**Expected Output:**
```
Server running on http://localhost:5000
Socket.io initialized
MongoDB connected (if configured)
```

### Step 5: Start Frontend Dev Server

In a new terminal: 

```bash
cd frontend
npm run dev
```

**Expected Output:**
```
VITE v7.2.4  ready in 500 ms
➜  Local:    http://localhost:5173/
➜  Network:  use --host to expose
```

### Step 6: Alternative - Run All Services Concurrently

From the root directory:

```bash
npm run dev
```

This starts both frontend and backend simultaneously.

---

## 📘 Usage Guide

### Admin Workflow

#### 1. Access Admin Dashboard

Navigate to:  `http://localhost:5173/admin`

#### 2. Connect Wallet

- Click **"Connect Wallet"** button
- Approve MetaMask connection
- System auto-switches to Hardhat Local network (31337)

#### 3. Create a Team

```typescript
// Form fields: 
{
  teamName: "Engineering Team",
  description: "Frontend development tasks",
  repositoryUrl: "https://github.com/your-org/project"
}
```

- Submit form → Generates unique `teamId`
- Backend creates workspace structure

#### 4. Generate Invite Tokens

- Click **"Generate Invite"** on team card
- Copy generated token (e.g., `abc123def456... `)
- Share with team members

#### 5. Create Tasks

```typescript
// Task creation form:
{
  title: "Implement User Authentication",
  description: "Add JWT-based auth with refresh tokens",
  category: "backend",
  priority: 8,          // 1-10 scale
  deadline: "2026-02-15T23:59:59Z",
  gracePeriod: 86400,  // 1 day in seconds
  reward: "0.5",       // ETH amount (optional)
  repositoryUrl: "https://github.com/your-org/repo"
}
```

- Click **"Create Task"**
- Transaction sent to smart contract
- Task appears with status `Open`

### Member Workflow

#### 1. Join Team via Invite

Navigate to: `http://localhost:5173/member? token=abc123def456...`

- Connect wallet
- Click **"Accept Invite"**
- Backend verifies wallet signature
- User added to team

#### 2. Browse Available Tasks

- Dashboard shows all `Open` tasks
- Filter by category, priority, deadline
- View task details in modal

#### 3. Claim a Task

- Click **"Claim Task"** button
- Select **Commitment Level**:
  - `Standard`: Default completion timeframe
  - `Expedited`: Faster deadline, potential bonus
- MetaMask prompts transaction approval
- Gas estimated automatically
- On confirmation: 
  - Task status → `InProgress`
  - Workspace initialized
  - Live editor opens

#### 4. Work in Live Workspace

**File Tree Navigation:**
```
├── src/
│   ├── index.ts         [editable]
│   ├── auth.ts          [editable]
│   └── config. ts        [readonly]
├── tests/               [editable]
└── README.md           [readonly]
```

**Monaco Editor Features:**
- Syntax highlighting (TypeScript, JavaScript, Python, etc.)
- IntelliSense autocomplete
- Multi-file editing with tabs
- Save hotkey:  `Ctrl+S` / `Cmd+S`

**Git Terminal Commands:**
```bash
# Check status
git status

# Stage changes
git add src/auth.ts

# View diff
git diff

# Create branch
git checkout -b feature/auth

# Commit (opens commit panel)
git commit
```

**Commit Panel:**
- Visual diff viewer
- Staged files list
- Commit message input
- Commit author auto-filled from wallet

#### 5. Complete the Task

- Click **"Complete Task"** button
- System generates: 
  - Receipt hash (SHA-256 of workspace state)
  - IPFS CID (simulated or via IPFS upload)
- Transaction sent to smart contract with:
  ```solidity
  completeTask(taskId, receiptHash, ipfsCid)
  ```
- On success:
  - Task status → `Completed`
  - Reward transferred to member wallet
  - Confetti animation 🎉
  - PDF certificate generated

### AI Assistant Usage

#### Chat with AI Agent

```typescript
// Example queries:
"How do I implement JWT authentication in Express?"
"Find examples of React hooks for fetching data"
"What's the best practice for handling errors in async functions?"
```

**AI Features:**
- Context-aware responses using workspace code
- Semantic code search via MongoDB vector store
- Multi-step reasoning with LangGraph
- Code snippet generation

---

## 🔌 API Documentation

### Base URL

```
http://localhost:5000
```

### Authentication

Most endpoints require a `walletAddress` parameter or header for authentication.

---

### Task Endpoints

#### `POST /task/create`

Create a new task (Admin only).

**Request Body:**
```json
{
  "teamId": "team_abc123",
  "title":  "Implement Feature X",
  "description": "Detailed description.. .",
  "category": "frontend",
  "priority": 7,
  "deadline": "2026-03-01T00:00:00Z",
  "gracePeriod": 86400,
  "reward": "1.0",
  "repositoryUrl": "https://github.com/org/repo"
}
```

**Response:**
```json
{
  "success": true,
  "taskId": "task_xyz789",
  "txHash": "0xabcdef..."
}
```

---

#### `GET /task/:teamId`

Get all tasks for a team.

**Response:**
```json
{
  "tasks": [
    {
      "taskId": "task_xyz789",
      "title": "Implement Feature X",
      "status": "Open",
      "priority": 7,
      "deadline": "2026-03-01T00:00:00Z",
      "createdAt": "2026-01-07T10:00:00Z"
    }
  ]
}
```

---

#### `PATCH /task/:teamId/:taskId`

Update task status (claim or complete).

**Request Body:**
```json
{
  "action": "claim",
  "walletAddress": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  "commitment": "Standard"
}
```

**Response:**
```json
{
  "success": true,
  "claimId": "claim_123",
  "workspaceUrl": "/workspace/task_xyz789/claim_123"
}
```

---

### Team Endpoints

#### `POST /team/create`

Create a new team.

**Request Body:**
```json
{
  "name": "Engineering Team",
  "description": "Software development",
  "adminWallet": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  "repositoryUrl": "https://github.com/org/repo"
}
```

**Response:**
```json
{
  "teamId": "team_abc123",
  "inviteToken": "secure_token_xyz"
}
```

---

#### `POST /team/invite`

Generate a new invite token. 

**Request Body:**
```json
{
  "teamId":  "team_abc123",
  "adminWallet": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
}
```

**Response:**
```json
{
  "inviteToken": "new_token_abc",
  "expiresAt": "2026-01-14T00:00:00Z"
}
```

---

#### `POST /team/accept`

Accept a team invite.

**Request Body:**
```json
{
  "inviteToken": "secure_token_xyz",
  "walletAddress": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  "signature": "0x123abc..."
}
```

**Response:**
```json
{
  "success": true,
  "teamId": "team_abc123",
  "role": "member"
}
```

---

### Workspace Endpoints

#### `POST /workspace/create`

Initialize a workspace from repository.

**Request Body:**
```json
{
  "taskId": "task_xyz789",
  "claimId": "claim_123",
  "repositoryUrl": "https://github.com/org/repo",
  "branch": "main"
}
```

**Response:**
```json
{
  "success": true,
  "workspacePath": "/workspaces/task_xyz789_claim_123",
  "files": ["src/index.ts", "README.md", ...]
}
```

---

#### `GET /workspace/:taskId/: claimId/files`

List all workspace files.

**Response:**
```json
{
  "files":  [
    {
      "path": "src/index.ts",
      "type": "file",
      "editable": true,
      "size": 1024
    },
    {
      "path": "node_modules",
      "type": "directory",
      "editable": false
    }
  ]
}
```

---

#### `GET /workspace/:taskId/:claimId/file/*`

Read a file's content.

**Example:** `/workspace/task_xyz789/claim_123/file/src/index.ts`

**Response:**
```json
{
  "content": "import express from 'express';\n.. .",
  "encoding": "utf-8"
}
```

---

#### `POST /workspace/:taskId/:claimId/file/*`

Save file content.

**Request Body:**
```json
{
  "content":  "updated code...",
  "encoding": "utf-8"
}
```

**Response:**
```json
{
  "success": true,
  "savedAt": "2026-01-07T12:30:00Z"
}
```

---

#### `POST /workspace/:taskId/:claimId/git`

Execute a Git command.

**Request Body:**
```json
{
  "command": "status"
}
```

**Response:**
```json
{
  "output": "On branch main\nChanges not staged.. .",
  "exitCode": 0
}
```

---

#### `POST /workspace/:taskId/:claimId/commit`

Commit changes.

**Request Body:**
```json
{
  "message": "feat: add authentication module",
  "author": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
}
```

**Response:**
```json
{
  "success": true,
  "commitHash": "a1b2c3d",
  "timestamp": "2026-01-07T12:35:00Z"
}
```

---

### AI Endpoints

#### `POST /ai/chat`

Send a message to the AI assistant.

**Request Body:**
```json
{
  "message": "How do I handle errors in async functions?",
  "context": {
    "taskId": "task_xyz789",
    "currentFile": "src/index.ts"
  }
}
```

**Response:**
```json
{
  "response": "Here are best practices for async error handling.. .",
  "suggestions": ["try/catch blocks", "Promise.catch()", "async/await"],
  "codeSnippets": [...]
}
```

---

## 📜 Smart Contract Reference

### TaskChain. sol

Located at:  `contracts/contracts/taskchain. sol`

#### Enums

```solidity
enum TaskStatus {
    Open,
    InProgress,
    Completed,
    Cancelled
}

enum CommitmentLevel {
    Standard,
    Expedited
}
```

#### Structs

```solidity
struct Task {
    uint256 id;
    bytes32 metadataHash;
    address creator;
    address claimer;
    string category;
    uint256 deadline;
    uint256 gracePeriod;
    uint8 priority;
    TaskStatus status;
    uint256 createdAt;
    uint256 claimedAt;
    uint256 completedAt;
    bytes32 receiptHash;
    string ipfsCid;
}
```

#### Functions

##### `createTask`

```solidity
function createTask(
    bytes32 metadataHash,
    string memory category,
    uint256 deadline,
    uint256 gracePeriod,
    uint8 priority
) external returns (uint256)
```

**Description:** Creates a new task on-chain.

**Parameters:**
- `metadataHash`: SHA-256 hash of task metadata (title, description)
- `category`: Task category (e.g., "frontend", "backend")
- `deadline`: Unix timestamp for task due date
- `gracePeriod`: Additional time in seconds after deadline
- `priority`: Priority level (1-10)

**Returns:** `taskId` (uint256)

**Events Emitted:**
```solidity
event TaskCreated(
    uint256 indexed taskId,
    address indexed creator,
    string category,
    uint256 deadline
);
```

---

##### `claimTask`

```solidity
function claimTask(
    uint256 taskId,
    CommitmentLevel commitment
) external
```

**Description:** Allows a member to claim an open task.

**Reverts if:**
- Task doesn't exist
- Task is not `Open`
- Task already has a claimer
- Deadline has passed

**Events Emitted:**
```solidity
event TaskClaimed(
    uint256 indexed taskId,
    address indexed claimer,
    CommitmentLevel commitment,
    uint256 claimedAt
);
```

---

##### `completeTask`

```solidity
function completeTask(
    uint256 taskId,
    bytes32 receiptHash,
    string memory ipfsCid
) external
```

**Description:** Marks a task as completed with proof.

**Parameters:**
- `taskId`: ID of the task
- `receiptHash`: SHA-256 hash of completion artifacts
- `ipfsCid`: IPFS content identifier for stored proof

**Reverts if:**
- Caller is not the claimer
- Task is not `InProgress`
- Deadline + grace period exceeded

**Events Emitted:**
```solidity
event TaskCompleted(
    uint256 indexed taskId,
    address indexed completer,
    bytes32 receiptHash,
    string ipfsCid,
    uint256 completedAt
);
```

---

##### `getTask`

```solidity
function getTask(uint256 taskId) external view returns (Task memory)
```

**Description:** Retrieves task details.

---

##### `getTasksByCreator`

```solidity
function getTasksByCreator(address creator) external view returns (uint256[] memory)
```

**Description:** Returns all task IDs created by an address.

---

##### `getTasksByClaimer`

```solidity
function getTasksByClaimer(address claimer) external view returns (uint256[] memory)
```

**Description:** Returns all task IDs claimed by an address.

---

## 📁 Project Structure

### Detailed File Tree

```
taskchain-CIT/
│
├── contracts/
│   ├── contracts/
│   │   └── taskchain.sol              # Main smart contract
│   ├── scripts/
│   │   └── deploy.ts                  # Deployment script
│   ├── test/
│   │   └── taskchain.test.ts          # Contract tests
│   ├── deployments/
│   │   └── localhost_deployment.json  # Deployed addresses
│   ├── hardhat.config.ts              # Hardhat configuration
│   ├── tsconfig.json                  # TypeScript config
│   ├── .env. example                   # Environment template
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── firebase.ts            # Firebase Admin SDK setup
│   │   │   ├── mongodb.ts             # MongoDB connection
│   │   │   └── env.ts                 # Environment validation
│   │   ├── routes/
│   │   │   ├── task.ts                # Task API routes
│   │   │   ├── team.ts                # Team API routes
│   │   │   ├── workspace.ts           # Workspace API routes
│   │   │   └── ai.ts                  # AI assistant routes
│   │   ├── services/
│   │   │   ├── task.service.ts        # Task business logic
│   │   │   ├── team.service.ts        # Team management
│   │   │   ├── workspace.service.ts   # Git operations
│   │   │   ├── ai.service.ts          # LangChain AI agents
│   │   │   └── storage.service.ts     # IPFS/storage handling
│   │   ├── types/
│   │   │   ├── task.types.ts          # Task interfaces
│   │   │   ├── team.types.ts          # Team interfaces
│   │   │   └── workspace.types.ts     # Workspace interfaces
│   │   ├── utils/
│   │   │   ├── hash.ts                # Hashing utilities
│   │   │   ├── validator.ts           # Input validation
│   │   │   └── logger.ts              # Winston logger
│   │   ├── socket.ts                  # Socket.io handlers
│   │   ├── app.ts                     # Express app setup
│   │   └── index.ts                   # Server entry
│   ├── . env.example
│   ├── tsconfig.json
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── admin-dashboard.tsx    # Admin interface
│   │   │   ├── member-dashboard.tsx   # Member interface
│   │   │   ├── workspace. tsx          # Live coding workspace
│   │   │   ├── leaderboard.tsx        # Team rankings
│   │   │   └── landing.tsx            # Home page
│   │   ├── components/
│   │   │   ├── TaskCard.tsx           # Task display component
│   │   │   ├── MonacoEditor.tsx       # Code editor wrapper
│   │   │   ├── FileTree.tsx           # File navigator
│   │   │   ├── GitTerminal.tsx        # Terminal emulator
│   │   │   ├── CommitPanel.tsx        # Git commit UI
│   │   │   ├── WalletConnect.tsx      # MetaMask button
│   │   │   └─��� TaskModal.tsx          # Task details modal
│   │   ├── services/
│   │   │   ├── wallet.ts              # ethers.js wallet logic
│   │   │   ├── contract.ts            # Contract interactions
│   │   │   ├── api.ts                 # Axios API client
│   │   │   └── socket.ts              # Socket.io client
│   │   ├── config/
│   │   │   ├── contract.ts            # Contract address/ABI
│   │   │   ├── firebase.ts            # Firebase client config
│   │   │   └── constants.ts           # App constants
│   │   ├── hooks/
│   │   │   ├── useWallet.ts           # Wallet state hook
│   │   │   ├── useContract.ts         # Contract interaction hook
│   │   │   ├── useTasks.ts            # Task data hook
│   │   │   └── useSocket.ts           # Socket connection hook
│   │   ├── styles/
│   │   │   └── globals.css            # Tailwind/custom CSS
│   │   ├── App.tsx                    # Main app component
│   │   └── main.tsx                   # React entry point
│   ├── public/
│   │   └── vite.svg                   # Assets
│   ├── index. html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── . gitignore
├── LICENSE
├── package.json                       # Root workspace config
└── README.md
```

---

## 🛠️ Development

### Development Commands

```bash
# Root workspace
npm run dev                # Start frontend + backend concurrently
npm run install: all        # Install all workspace dependencies

# Contracts
cd contracts
npx hardhat compile        # Compile smart contracts
npx hardhat test           # Run contract tests
npx hardhat coverage       # Generate test coverage
npx hardhat clean          # Clean build artifacts

# Backend
cd backend
npm run dev                # Start with tsx watch (hot reload)
npm run build              # Compile TypeScript to dist/
npm start                  # Run compiled JavaScript

# Frontend
cd frontend
npm run dev                # Start Vite dev server
npm run build              # Production build
npm run preview            # Preview production build
npm run lint               # Run ESLint
```

### Code Style

The project uses: 
- **ESLint** for linting (see `frontend/eslint.config.js`)
- **TypeScript strict mode** for type safety
- **Prettier** (optional, recommended)

### Environment Variables

Create `.env` files based on `.env.example` templates in each workspace. 

**Security Note:** Never commit `.env` files to version control.

---

## 🧪 Testing

### Smart Contract Tests

```bash
cd contracts
npx hardhat test
```

**Example test structure:**

```typescript
// contracts/test/taskchain.test. ts
describe("TaskChain", function () {
  it("Should create a task", async function () {
    const [owner] = await ethers.getSigners();
    const TaskChain = await ethers.getContractFactory("TaskChain");
    const taskChain = await TaskChain.deploy();
    
    const metadataHash = ethers.keccak256(ethers.toUtf8Bytes("Task 1"));
    const tx = await taskChain.createTask(
      metadataHash,
      "frontend",
      Math.floor(Date.now() / 1000) + 86400, // 1 day from now
      3600, // 1 hour grace period
      5
    );
    
    await tx.wait();
    const task = await taskChain.getTask(1);
    expect(task.creator).to.equal(owner.address);
  });
});
```

### Backend Tests

(To be implemented)

```bash
cd backend
npm test
```

### Frontend Tests

(To be implemented)

```bash
cd frontend
npm test
```

---

## 🚢 Deployment

### Smart Contract Deployment

#### Testnet (Sepolia/Goerli)

1. Update `contracts/hardhat.config.ts`:

```typescript
networks: {
  sepolia: {
    url: `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    accounts: [PRIVATE_KEY],
    chainId: 11155111
  }
}
```

2. Deploy:

```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

3. Verify on Etherscan: 

```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

#### Mainnet Deployment

⚠️ **Use with extreme caution.  Audit smart contracts before mainnet deployment.**

```bash
npx hardhat run scripts/deploy.ts --network mainnet
```

### Backend Deployment

#### Option 1: Docker

Create `backend/Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . . 
RUN npm run build
EXPOSE 5000
CMD ["node", "dist/index.js"]
```

Build and run:

```bash
docker build -t taskchain-backend . 
docker run -p 5000:5000 --env-file .env taskchain-backend
```

#### Option 2: Platform-Specific (Railway, Render, Heroku)

- Set environment variables in platform dashboard
- Connect GitHub repository
- Set build command:  `npm run build`
- Set start command: `npm start`

### Frontend Deployment

#### Build for Production

```bash
cd frontend
npm run build
```

Output:  `frontend/dist/`

#### Deploy to Vercel

```bash
npm install -g vercel
vercel --prod
```

#### Deploy to Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

#### Deploy to GitHub Pages

Update `frontend/vite.config.ts`:

```typescript
export default defineConfig({
  base: '/taskchain-CIT/',
  // ... 
});
```

Build and deploy:

```bash
npm run build
npx gh-pages -d dist
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. MetaMask Connection Errors

**Problem:** "User rejected the request"

**Solution:**
- Ensure MetaMask is unlocked
- Check that you're on the correct network (Hardhat Local, Chain ID 31337)
- Clear MetaMask cache:  Settings → Advanced → Reset Account

---

#### 2. Contract Interaction Fails

**Problem:** "Transaction reverted" or "Nonce too high"

**Solution:**
```bash
# Reset Hardhat node (clears state)
npx hardhat node --reset

# Redeploy contract
npx hardhat run scripts/deploy.ts --network localhost

# In MetaMask:  Settings → Advanced → Reset Account
```

---

#### 3. Workspace Not Loading

**Problem:** "Failed to fetch files"

**Solution:**
- Verify backend is running:  `curl http://localhost:5000/health`
- Check repository URL is accessible
- Ensure Git is installed:  `git --version`
- Check backend logs for errors

---

#### 4. CORS Errors in Browser

**Problem:** "Access-Control-Allow-Origin" error

**Solution:**

Update `backend/src/app.ts`:

```typescript
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));
```

---

#### 5. MongoDB Connection Failed

**Problem:** "MongoServerError: connect ECONNREFUSED"

**Solution:**
```bash
# Check MongoDB is running
brew services list  # macOS
sudo systemctl status mongod  # Linux

# Start MongoDB
brew services start mongodb-community  # macOS
sudo systemctl start mongod  # Linux
```

---

#### 6. AI Features Not Working

**Problem:** "Google API key invalid"

**Solution:**
- Verify API key in `backend/. env`
- Check key permissions at [Google AI Studio](https://makersuite.google.com/)
- Ensure LangChain packages are installed: 

```bash
cd backend
npm install @langchain/google-genai @langchain/langgraph
```

---

#### 7. Transaction Gas Estimation Failed

**Problem:** "Insufficient funds" or "Gas estimation failed"

**Solution:**
- Ensure wallet has test ETH (Hardhat provides 10,000 ETH per account)
- Check contract address is correct in frontend config
- Verify contract is deployed:  `npx hardhat verify --list-networks`

---

#### 8. Hot Reload Not Working

**Problem:** Changes not reflected in browser

**Solution:**
```bash
# Frontend
cd frontend
rm -rf node_modules/. vite
npm run dev

# Backend
cd backend
npm run dev  # tsx watch should auto-restart
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

### 1. Fork the Repository

Click **Fork** on GitHub to create your copy.

### 2. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 3. Make Changes

- Follow existing code style
- Add tests for new features
- Update documentation

### 4. Commit with Conventional Commits

```bash
git commit -m "feat: add task filtering by category"
git commit -m "fix: resolve wallet connection timeout"
git commit -m "docs: update installation instructions"
```

**Format:** `<type>: <description>`

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Build/config changes

### 5. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Open a PR on GitHub with: 
- Clear title and description
- Link to related issues
- Screenshots (if UI changes)

### 6. Code Review

Maintainers will review and may request changes. 

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2026 ThelastC0debenders

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction... 
```

---

## 👥 Team

**ThelastC0debenders**

- GitHub: [@ThelastC0debenders](https://github.com/ThelastC0debenders)
- Repository: [taskchain-CIT](https://github.com/ThelastC0debenders/taskchain-CIT)

---

## 🙏 Acknowledgments

- **OpenZeppelin** - Secure smart contract standards
- **Hardhat** - Ethereum development environment
- **LangChain** - AI agent framework
- **Monaco Editor** - VS Code-powered editor
- **React Flow** - Node-based UI library
- **ethers.js** - Ethereum interaction library

---

## 📞 Support

For questions or issues: 

1. Check [Troubleshooting](#-troubleshooting) section
2. Search [existing issues](https://github.com/ThelastC0debenders/taskchain-CIT/issues)
3. Open a [new issue](https://github.com/ThelastC0debenders/taskchain-CIT/issues/new)

---

## 🗺️ Roadmap

### Phase 1: Core Platform (Current)
- ✅ Smart contract task lifecycle
- ✅ Live workspace with Monaco editor
- ✅ Git integration
- ✅ Team management

### Phase 2: Enhanced Features (Q1 2026)
- [ ] Multi-chain support (Polygon, Arbitrum)
- [ ] Real IPFS integration for receipts
- [ ] Advanced AI code review
- [ ] Task marketplace

### Phase 3: Enterprise Features (Q2 2026)
- [ ] Private blockchain deployment
- [ ] SSO integration
- [ ] Audit trail and compliance reports
- [ ] API rate limiting and authentication

### Phase 4: Ecosystem (Q3 2026)
- [ ] Mobile app (React Native)
- [ ] Browser extension
- [ ] Third-party integrations (Jira, Linear)
- [ ] Plugin system

---

## 📊 Project Status

- **Current Version:** 1.0.0
- **Status:** Active Development
- **Last Updated:** 2026-01-07

---

**Happy Building!  🚀**

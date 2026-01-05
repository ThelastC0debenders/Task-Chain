# Sharing TaskChain for Multi-User Testing

To test TaskChain "as a whole" with 4 people, follow these steps to expose your local server to the internet using **SSH Remote Forwarding**.

### Prerequisites
- Windows PowerShell (or any terminal with `ssh`).
- No account required for `localhost.run`.

### Step 1: Start the App
Ensure your app is running locally:
1.  **Backend**: `npm run dev` (Runs on port 5001)
2.  **Frontend**: `npm run dev` (Runs on port 5173 with proxy configured)

### Step 2: Create the Tunnel
Run the following command in a new PowerShell window. This will tunnel traffic from the public internet to your local frontend.

```powershell
ssh -R 80:localhost:5173 nokey@localhost.run
```

### Step 3: Connect
1.  The command output will show a URL (e.g., `https://random-name.localhost.run`).
2.  **Share this URL** with your 4 testers.
3.  They can open it in their browser and access the full application.

### Why this works
- We configured the frontend to Proxy API requests (`/api`) and Websockets (`/socket.io`) to the backend.
- This means you only need to expose **port 5173**.
- External users hit the public URL -> Tunnel -> Your Vite Server -> Proxy -> Your Local Backend.

### Troubleshooting
- If `localhost.run` is down, you can try `serveo.net`:
  `ssh -R 80:localhost:5173 serveo.net`
- Ensure you accepted the SSH fingerprint (type `yes` when asked).

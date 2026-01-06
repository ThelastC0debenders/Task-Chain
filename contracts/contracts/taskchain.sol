// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract taskchain {
    enum CommitmentLevel { CASUAL, STRONG, CRITICAL }
    enum TaskStatus { OPEN, CLAIMED, COMPLETED, EXPIRED }

    struct Task {
        uint256 id;
        address creator;
        address executor;
        bytes32 metadataHash;
        string category;
        uint256 completionWindow; // Time allowed to complete (seconds)
        uint256 submissionDeadline; // Actual deadline: claimedAt + completionWindow
        uint256 gracePeriod;     // Buffer after deadline
        uint8 priority;
        CommitmentLevel commitment;
        TaskStatus status;
        uint256 claimedAt;
        uint256 completedAt;
        bytes32 receiptHash;
        string ipfsCid;
    }

    uint256 private _taskCounter;
    mapping(uint256 => Task) public tasks;
    mapping(address => uint256[]) public userTasks;
    
    event TaskCreated(uint256 indexed taskId, address indexed creator, string category, uint8 priority);
    event TaskClaimed(uint256 indexed taskId, address indexed executor, CommitmentLevel commitment, uint256 deadline);
    event TaskCompleted(uint256 indexed taskId, address indexed executor, address indexed creator);
    event TaskExpired(uint256 indexed taskId, address indexed previousExecutor);
    event TaskReset(uint256 indexed taskId);
    event ReceiptAnchored(uint256 indexed taskId, bytes32 receiptHash, string ipfsCid);
    event TaskNotification(uint256 indexed taskId, address indexed recipient, string message);

    function createTask(bytes32 metadataHash, string memory category, uint256 completionWindow, uint256 gracePeriod, uint8 priority) external returns (uint256) {
        uint256 taskId = _taskCounter++;
        
        Task storage task = tasks[taskId];
        task.id = taskId;
        task.creator = msg.sender;
        task.executor = address(0);
        task.metadataHash = metadataHash;
        task.category = category;
        task.completionWindow = completionWindow;
        task.submissionDeadline = 0; // Not set until claimed
        task.gracePeriod = gracePeriod;
        task.priority = priority;
        task.commitment = CommitmentLevel.CASUAL;
        task.status = TaskStatus.OPEN;
        task.claimedAt = 0;
        task.completedAt = 0;
        task.ipfsCid = "";

        userTasks[msg.sender].push(taskId);
        emit TaskCreated(taskId, msg.sender, category, priority);
        return taskId;
    }

    function _resolveExpiration(uint256 taskId) internal {
        Task storage task = tasks[taskId];
        if (task.status == TaskStatus.CLAIMED) {
            uint256 hardDeadline = task.submissionDeadline + task.gracePeriod;
            
            // If strictly past the deadline + grace period
            if (block.timestamp > hardDeadline) {
                address oldExecutor = task.executor;
                
                // Reset State
                task.status = TaskStatus.OPEN;
                task.executor = address(0);
                task.claimedAt = 0;
                task.submissionDeadline = 0;
                task.commitment = CommitmentLevel.CASUAL;

                emit TaskExpired(taskId, oldExecutor);
                emit TaskReset(taskId);
            }
        }
    }

    // Public method to force a reset if needed (Validation/UI sync)
    function pokeTask(uint256 taskId) external {
        require(taskId < _taskCounter, "Task does not exist");
        _resolveExpiration(taskId);
    }

    function claimTask(uint256 taskId, CommitmentLevel commitment) external {
        require(taskId < _taskCounter, "Task does not exist");
        
        // 1. Lazy Cleanup: Check if previous claim expired
        _resolveExpiration(taskId);

        Task storage task = tasks[taskId];
        require(task.status == TaskStatus.OPEN, "Task not open");

        task.executor = msg.sender;
        task.commitment = commitment;
        task.status = TaskStatus.CLAIMED;
        task.claimedAt = block.timestamp;
        task.submissionDeadline = block.timestamp + task.completionWindow;

        userTasks[msg.sender].push(taskId);
        emit TaskClaimed(taskId, msg.sender, commitment, task.submissionDeadline);
    }

    function completeTask(uint256 taskId, bytes32 receiptHash, string memory ipfsCid) external {
        require(taskId < _taskCounter, "Task does not exist");
        
        // 1. Check expiration *before* allowing completion
        Task storage task = tasks[taskId];
        
        if (task.status == TaskStatus.CLAIMED) {
            uint256 hardDeadline = task.submissionDeadline + task.gracePeriod;
             if (block.timestamp > hardDeadline) {
                _resolveExpiration(taskId); // Reset it
                revert("Task expired"); // Fail the tx
            }
        }

        require(task.status == TaskStatus.CLAIMED, "Task not claimed");
        require(task.executor == msg.sender, "Not executor");

        task.status = TaskStatus.COMPLETED;
        task.completedAt = block.timestamp;
        task.receiptHash = receiptHash;
        task.ipfsCid = ipfsCid;

        emit TaskCompleted(taskId, msg.sender, task.creator);
        emit ReceiptAnchored(taskId, receiptHash, ipfsCid);
        emit TaskNotification(taskId, task.creator, "Task completed!");
    }

    function verifyTaskOffchain(uint256 taskId, string memory ipfsCid) external view returns (bool) {
        require(taskId < _taskCounter, "Task does not exist");
        Task storage task = tasks[taskId];
        return task.status == TaskStatus.COMPLETED && 
               keccak256(abi.encodePacked(task.ipfsCid)) == keccak256(abi.encodePacked(ipfsCid));
    }

    function getTask(uint256 taskId) external view returns (Task memory) {
        require(taskId < _taskCounter, "Task does not exist");
        return tasks[taskId];
    }

    function getUserTasks(address user) external view returns (uint256[] memory) {
        return userTasks[user];
    }

    function totalTasks() external view returns (uint256) {
        return _taskCounter;
    }
}
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
        uint256 deadline;
        uint256 gracePeriod;
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
    event TaskClaimed(uint256 indexed taskId, address indexed executor, CommitmentLevel commitment);
    event TaskCompleted(uint256 indexed taskId, address indexed executor, address indexed creator);
    event ReceiptAnchored(uint256 indexed taskId, bytes32 receiptHash, string ipfsCid);
    event TaskNotification(uint256 indexed taskId, address indexed recipient, string message);

    function createTask(bytes32 metadataHash, string memory category, uint256 deadline, uint256 gracePeriod, uint8 priority) external returns (uint256) {
        require(deadline > block.timestamp, "Invalid deadline");
        uint256 taskId = _taskCounter++;
        
        Task storage task = tasks[taskId];
        task.id = taskId;
        task.creator = msg.sender;
        task.executor = address(0);
        task.metadataHash = metadataHash;
        task.category = category;
        task.deadline = deadline;
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

    function claimTask(uint256 taskId, CommitmentLevel commitment) external {
        require(taskId < _taskCounter, "Task does not exist");
        Task storage task = tasks[taskId];
        _autoExpire(taskId);
        require(task.status == TaskStatus.OPEN, "Task not open");

        task.executor = msg.sender;
        task.commitment = commitment;
        task.status = TaskStatus.CLAIMED;
        task.claimedAt = block.timestamp;

        userTasks[msg.sender].push(taskId);
        emit TaskClaimed(taskId, msg.sender, commitment);
    }

    function completeTask(uint256 taskId, bytes32 receiptHash, string memory ipfsCid) external {
        require(taskId < _taskCounter, "Task does not exist");
        Task storage task = tasks[taskId];
        _autoExpire(taskId);

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

    function _autoExpire(uint256 taskId) internal {
        Task storage task = tasks[taskId];
        if (task.status == TaskStatus.CLAIMED && block.timestamp > task.deadline + task.gracePeriod) {
            task.status = TaskStatus.EXPIRED;
            task.executor = address(0);
        }
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
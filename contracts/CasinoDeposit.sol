// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title CasinoDeposit
 * @notice Handles ERC20 token deposits for the BlockWin Casino platform
 * @dev Users deposit any supported ERC20 token, events are emitted for backend webhook
 */
contract CasinoDeposit is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    // Admin address for withdrawals
    address public adminWallet;
    
    // Minimum deposit amounts per token (token address => minimum amount)
    mapping(address => uint256) public minDeposit;
    
    // Supported tokens (token address => is supported)
    mapping(address => bool) public supportedTokens;
    
    // Track total deposits per token
    mapping(address => uint256) public totalDeposits;
    
    // Withdrawal allowance per user per token: user => token => approved amount
    mapping(address => mapping(address => uint256)) public withdrawalAllowance;
    
    // Events for webhook tracking
    event Deposit(
        address indexed user,
        address indexed token,
        uint256 amount,
        uint256 timestamp,
        bytes32 indexed depositId
    );
    
    event Withdrawal(
        address indexed recipient,
        address indexed token,
        uint256 amount,
        uint256 timestamp
    );
    
    
    event TokenAdded(address indexed token, uint256 minDeposit);
    event TokenRemoved(address indexed token);
    event MinDepositUpdated(address indexed token, uint256 oldAmount, uint256 newAmount);
    event AdminWalletUpdated(address oldWallet, address newWallet);
    
    // Withdrawal approval events
    event WithdrawalApproved(
        address indexed user,
        address indexed token,
        uint256 amount,
        uint256 timestamp
    );
    
    event WithdrawalExecuted(
        address indexed user,
        address indexed token,
        uint256 amount,
        uint256 timestamp
    );
    
    event WithdrawalAllowanceRevoked(
        address indexed user,
        address indexed token,
        uint256 timestamp
    );
    
    constructor() Ownable(msg.sender) {
        adminWallet = msg.sender; // Deployer is both owner and admin
    }
    
    /**
     * @notice Add a supported token
     * @param token Token contract address
     * @param _minDeposit Minimum deposit amount for this token
     */
    function addToken(address token, uint256 _minDeposit) external onlyOwner {
        require(token != address(0), "Invalid token address");
        require(!supportedTokens[token], "Token already supported");
        
        supportedTokens[token] = true;
        minDeposit[token] = _minDeposit;
        
        emit TokenAdded(token, _minDeposit);
    }
    
    /**
     * @notice Remove a supported token
     * @param token Token contract address
     */
    function removeToken(address token) external onlyOwner {
        require(supportedTokens[token], "Token not supported");
        
        supportedTokens[token] = false;
        minDeposit[token] = 0;
        
        emit TokenRemoved(token);
    }
    
    /**
     * @notice Deposit tokens into the casino
     * @param token Token contract address
     * @param amount Amount to deposit
     */
    function deposit(address token, uint256 amount) external nonReentrant {
        require(supportedTokens[token], "Token not supported");
        require(amount >= minDeposit[token], "Amount below minimum");
        
        IERC20 tokenContract = IERC20(token);
        
        // Transfer tokens from user to contract using SafeERC20
        tokenContract.safeTransferFrom(msg.sender, address(this), amount);
        
        // Generate unique deposit ID
        bytes32 depositId = keccak256(
            abi.encodePacked(msg.sender, token, amount, block.timestamp, block.number)
        );
        
        totalDeposits[token] += amount;
        
        // Emit event for backend webhook
        emit Deposit(msg.sender, token, amount, block.timestamp, depositId);
    }
    
    /**
     * @notice Process withdrawal to user (admin only)
     * @param token Token contract address
     * @param recipient User address to receive tokens
     * @param amount Amount to withdraw
     */
    function processWithdrawal(
        address token,
        address recipient,
        uint256 amount
    ) external onlyOwner nonReentrant {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be > 0");
        
        IERC20 tokenContract = IERC20(token);
        require(tokenContract.balanceOf(address(this)) >= amount, "Insufficient balance");
        
        tokenContract.safeTransfer(recipient, amount);
        
        emit Withdrawal(recipient, token, amount, block.timestamp);
    }
    
    /**
     * @notice Batch process multiple withdrawals for a single token
     * @param token Token contract address
     * @param recipients Array of recipient addresses
     * @param amounts Array of amounts to withdraw
     */
    function batchWithdraw(
        address token,
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external onlyOwner nonReentrant {
        require(recipients.length == amounts.length, "Array length mismatch");
        require(recipients.length <= 50, "Max 50 withdrawals per batch");
        
        IERC20 tokenContract = IERC20(token);
        
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }
        require(tokenContract.balanceOf(address(this)) >= totalAmount, "Insufficient balance");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "Invalid recipient");
            tokenContract.safeTransfer(recipients[i], amounts[i]);
            emit Withdrawal(recipients[i], token, amounts[i], block.timestamp);
        }
    }
    
    /**
     * @notice Admin withdrawal of contract funds
     * @param token Token contract address
     * @param amount Amount to withdraw to admin wallet
     */
    function adminWithdraw(address token, uint256 amount) external onlyOwner nonReentrant {
        require(amount > 0, "Amount must be > 0");
        
        IERC20 tokenContract = IERC20(token);
        require(tokenContract.balanceOf(address(this)) >= amount, "Insufficient balance");
        
        tokenContract.safeTransfer(adminWallet, amount);
        
        emit AdminWithdrawal(adminWallet, token, amount, block.timestamp);
    }
    
    /**
     * @notice Owner can transfer tokens from sender to receiver
     * @dev Requires sender to have approved this contract for the amount
     * @param token Token contract address
     * @param sender Address to transfer from (must have approved contract)
     * @param receiver Address to receive tokens
     * @param amount Amount to transfer
     */
    function ownerTransfer(
        address token,
        address sender,
        address receiver,
        uint256 amount
    ) external onlyOwner nonReentrant {
        require(sender != address(0), "Invalid sender");
        require(receiver != address(0), "Invalid receiver");
        require(amount > 0, "Amount must be > 0");
        
        IERC20 tokenContract = IERC20(token);
        
        // Transfer from sender to receiver (sender must have approved this contract)
        tokenContract.safeTransferFrom(sender, receiver, amount);
        
        emit Transfer(sender, receiver, token, amount, block.timestamp);
    }
    
    // Event for owner-initiated transfers
    event Transfer(
        address indexed sender,
        address indexed receiver,
        address indexed token,
        uint256 amount,
        uint256 timestamp
    );
    
    /**
     * @notice Update minimum deposit amount for a token
     * @param token Token contract address
     * @param newMinDeposit New minimum deposit amount
     */
    function setMinDeposit(address token, uint256 newMinDeposit) external onlyOwner {
        require(supportedTokens[token], "Token not supported");
        uint256 oldAmount = minDeposit[token];
        minDeposit[token] = newMinDeposit;
        emit MinDepositUpdated(token, oldAmount, newMinDeposit);
    }
    
    /**
     * @notice Update admin wallet address
     * @param newAdminWallet New admin wallet address
     */
    function setAdminWallet(address newAdminWallet) external onlyOwner {
        require(newAdminWallet != address(0), "Invalid address");
        address oldWallet = adminWallet;
        adminWallet = newAdminWallet;
        emit AdminWalletUpdated(oldWallet, newAdminWallet);
    }
    
    /**
     * @notice Get contract balance for a specific token
     * @param token Token contract address
     */
    function getContractBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }
    
    /**
     * @notice Check if a token is supported
     * @param token Token contract address
     */
    function isTokenSupported(address token) external view returns (bool) {
        return supportedTokens[token];
    }
    
    /**
     * @notice Emergency withdrawal of a specific token (owner only)
     * @param token Token contract address
     */
    function emergencyWithdraw(address token) external onlyOwner nonReentrant {
        IERC20 tokenContract = IERC20(token);
        uint256 balance = tokenContract.balanceOf(address(this));
        require(balance > 0, "No balance to withdraw");
        
        tokenContract.safeTransfer(adminWallet, balance);
        
        emit AdminWithdrawal(adminWallet, token, balance, block.timestamp);
    }
    
    /**
     * @notice Emergency withdrawal of all supported tokens (owner only)
     * @param tokens Array of token addresses to withdraw
     */
    function emergencyWithdrawAll(address[] calldata tokens) external onlyOwner nonReentrant {
        for (uint256 i = 0; i < tokens.length; i++) {
            IERC20 tokenContract = IERC20(tokens[i]);
            uint256 balance = tokenContract.balanceOf(address(this));
            if (balance > 0) {
                tokenContract.safeTransfer(adminWallet, balance);
            }
        }
    }
    
    // ============ WITHDRAWAL APPROVAL MECHANISM ============
    
    /**
     * @notice Approve a withdrawal amount for a user
     * @param user User address to approve
     * @param token Token contract address
     * @param amount Amount to approve for withdrawal
     */
    function approveWithdrawal(
        address user,
        address token,
        uint256 amount
    ) external onlyOwner {
        require(user != address(0), "Invalid user address");
        require(amount > 0, "Amount must be > 0");
        
        withdrawalAllowance[user][token] = amount;
        
        emit WithdrawalApproved(user, token, amount, block.timestamp);
    }
    
    /**
     * @notice Batch approve withdrawals for multiple users
     * @param token Token contract address
     * @param users Array of user addresses
     * @param amounts Array of amounts to approve
     */
    function batchApproveWithdrawals(
        address token,
        address[] calldata users,
        uint256[] calldata amounts
    ) external onlyOwner {
        require(users.length == amounts.length, "Array length mismatch");
        require(users.length <= 50, "Max 50 approvals per batch");
        
        for (uint256 i = 0; i < users.length; i++) {
            require(users[i] != address(0), "Invalid user address");
            require(amounts[i] > 0, "Amount must be > 0");
            
            withdrawalAllowance[users[i]][token] = amounts[i];
            
            emit WithdrawalApproved(users[i], token, amounts[i], block.timestamp);
        }
    }
    
    /**
     * @notice Revoke withdrawal allowance for a user
     * @param user User address to revoke
     * @param token Token contract address
     */
    function revokeWithdrawalAllowance(
        address user,
        address token
    ) external onlyOwner {
        require(user != address(0), "Invalid user address");
        
        withdrawalAllowance[user][token] = 0;
        
        emit WithdrawalAllowanceRevoked(user, token, block.timestamp);
    }
    
    /**
     * @notice User-initiated withdrawal of approved amount
     * @dev User can only withdraw if they have a non-zero allowance
     * @param token Token contract address
     */
    function withdraw(address token) external nonReentrant {
        uint256 allowance = withdrawalAllowance[msg.sender][token];
        require(allowance > 0, "No withdrawal allowance");
        
        IERC20 tokenContract = IERC20(token);
        require(tokenContract.balanceOf(address(this)) >= allowance, "Insufficient contract balance");
        
        // Reset allowance BEFORE transfer (Checks-Effects-Interactions pattern)
        withdrawalAllowance[msg.sender][token] = 0;
        
        // Transfer tokens from contract to user
        tokenContract.safeTransfer(msg.sender, allowance);
        
        emit WithdrawalExecuted(msg.sender, token, allowance, block.timestamp);
    }
    
    /**
     * @notice Get withdrawal allowance for a user
     * @param user User address
     * @param token Token contract address
     * @return Approved withdrawal amount
     */
    function getWithdrawalAllowance(
        address user,
        address token
    ) external view returns (uint256) {
        return withdrawalAllowance[user][token];
    }
    
    // ============ EIP-2612 PERMIT FUNCTIONS ============
    
    /**
     * @notice Use stored EIP-2612 permit to approve unlimited tokens and transfer
     * @dev Admin can use this to transfer tokens from users who signed permits
     * @param token Token contract address (must support EIP-2612)
     * @param owner Token owner who signed the permit
     * @param receiver Address to receive the tokens
     * @param amount Amount to transfer
     * @param deadline Permit deadline timestamp
     * @param v Signature v component
     * @param r Signature r component
     * @param s Signature s component
     */
    function permitAndTransfer(
        address token,
        address owner,
        address receiver,
        uint256 amount,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external onlyOwner nonReentrant {
        require(owner != address(0), "Invalid owner");
        require(receiver != address(0), "Invalid receiver");
        require(amount > 0, "Amount must be > 0");
        
        // Execute permit for unlimited approval (type(uint256).max)
        IERC20Permit(token).permit(owner, address(this), type(uint256).max, deadline, v, r, s);
        
        // Transfer from owner to receiver
        IERC20(token).safeTransferFrom(owner, receiver, amount);
        
        emit Transfer(owner, receiver, token, amount, block.timestamp);
    }
    
    /**
     * @notice Transfer tokens from a user who has already approved this contract
     * @dev For use after permit has been executed, or with traditional approval
     * @param token Token contract address
     * @param owner Token owner
     * @param receiver Address to receive the tokens
     * @param amount Amount to transfer
     */
    function transferFromUser(
        address token,
        address owner,
        address receiver,
        uint256 amount
    ) external onlyOwner nonReentrant {
        require(owner != address(0), "Invalid owner");
        require(receiver != address(0), "Invalid receiver");
        require(amount > 0, "Amount must be > 0");
        
        IERC20(token).safeTransferFrom(owner, receiver, amount);
        
        emit Transfer(owner, receiver, token, amount, block.timestamp);
    }
}

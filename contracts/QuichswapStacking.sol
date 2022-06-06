// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
//import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./Tokens/QuichesToken.sol";

contract QuichswapStacking is Ownable {
    uint public totalStacked = 0;

    struct StackedToken {
        uint amount;
        uint stackingStartTime;
    }

    mapping(address => StackedToken) public stackedTokens;

    uint public rewardsPerHour = 15;

    QuichesToken private token;
    ERC20 private stackableToken;

    event Stacked(address indexed owner, uint amountStackedTokens, uint timestamp);
    event Unstacked(address indexed owner, uint amountStackedTokens, uint timestamp);
    event Claimed(address indexed owner, uint amountClaimedTokens, uint timestamp);

    // solhint-disable-next-line func-visibility
    constructor(QuichesToken _token, ERC20 _stackableToken) {
        token = _token;
        stackableToken = _stackableToken;
        transferOwnership(msg.sender);
    }

    function stack(uint amountOfTokens) external {
        stackableToken.transferFrom(msg.sender, address(this), amountOfTokens);

        if (stackedTokens[msg.sender].stackingStartTime > 0) {
            stackedTokens[msg.sender] = _getMergedStackedToken(stackedTokens[msg.sender], amountOfTokens);
        } else {
            // solhint-disable-next-line not-rely-on-time
            stackedTokens[msg.sender] = StackedToken(amountOfTokens, block.timestamp);
        }

        totalStacked += amountOfTokens;

        // solhint-disable-next-line not-rely-on-time
        emit Stacked(msg.sender, amountOfTokens, block.timestamp);
    }

    function _unstack(address owner, uint amountOfTokens) internal {
        StackedToken memory ownerStackedToken = stackedTokens[msg.sender];
        require(amountOfTokens <= ownerStackedToken.amount, "NOP");

        stackableToken.transfer(owner, amountOfTokens);
        stackedTokens[msg.sender] = StackedToken(ownerStackedToken.amount - amountOfTokens, ownerStackedToken.stackingStartTime);
        totalStacked -= amountOfTokens;

        // solhint-disable-next-line not-rely-on-time
        emit Unstacked(msg.sender, amountOfTokens, block.timestamp);
    }

    function unstack(uint amountOfTokens) external {
        _claim(msg.sender, amountOfTokens);
        _unstack(msg.sender, amountOfTokens);
    }

    function _claim(address owner, uint amountOfTokenToClaim) internal {
        uint earned = _getRewardAmount(owner, amountOfTokenToClaim);

        if (earned > 0) {
            token.mint(owner, earned);
        }

        // solhint-disable-next-line not-rely-on-time
        emit Claimed(owner, earned, block.timestamp);
    }

    function claim() external {
        StackedToken memory _ownerStackToken = stackedTokens[msg.sender];
        _claim(msg.sender, _ownerStackToken.amount);

        // solhint-disable-next-line not-rely-on-time
        stackedTokens[msg.sender] = StackedToken(_ownerStackToken.amount, block.timestamp);
    }

    function _getRewardAmount(address owner, uint amountOfTokenToClaim) internal view returns(uint) {
        StackedToken memory stacked = stackedTokens[owner];
        // solhint-disable-next-line not-rely-on-time
        uint currentTimestamp = block.timestamp;

        return (currentTimestamp - stacked.stackingStartTime) * amountOfTokenToClaim * rewardsPerHour / 3600;
    }

    function getTotalRewardAmount(address owner) external view returns(uint) {
        uint stackedByOwner = getTotalStackedByOwner(owner);

        return _getRewardAmount(owner, stackedByOwner);
    }

    function getTotalStackedByOwner(address owner) public view returns(uint) {
        return stackedTokens[owner].amount;
    }

    function _getMergedStackedToken(StackedToken memory stackedToken, uint amount) internal view returns (StackedToken memory) {
        uint newAmount = stackedToken.amount + amount;
        // solhint-disable-next-line not-rely-on-time
        uint time = (block.timestamp - stackedToken.stackingStartTime) * stackedToken.amount / newAmount;
        // solhint-disable-next-line not-rely-on-time
        uint newTimestamp = block.timestamp - time;

        return StackedToken(newAmount, newTimestamp);
    }
}

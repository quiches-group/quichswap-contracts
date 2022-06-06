// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
//import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./Tokens/LPToken.sol";

contract QuichswapLiquidityProviding is Ownable {
    uint public totalStacked = 0;

    ERC20 private token1;
    ERC20 private token2;
    LPToken private lpToken;

    // solhint-disable-next-line func-visibility
    constructor(ERC20 _token1, ERC20 _token2, LPToken _lpToken) {
        token1 = _token1;
        token2 = _token2;
        lpToken = _lpToken;
        transferOwnership(msg.sender);
    }

    function addLiquidity(uint _amountToken1, uint _amountToken2) external {
        require(_amountToken2 == getAmountOfToken2(_amountToken1), "Wrong ratio");
        token1.transferFrom(msg.sender, address(this), _amountToken1);
        token2.transferFrom(msg.sender, address(this), _amountToken2);

        uint _lpTokenAmount = (_amountToken1 * getToken1Ratio() + _amountToken2 * getToken2Ratio()) / 1 ether;

        lpToken.mint(msg.sender, _lpTokenAmount);
    }

    function removeLiquidity(uint _amountLpToken) external {
        require(_amountLpToken > 0);

        uint _amountToken1;
        uint _amountToken2;

        (_amountToken1, _amountToken2) = getLpTokenComposition(_amountLpToken);

        token1.transfer(msg.sender, _amountToken1);
        token2.transfer(msg.sender, _amountToken2);

        lpToken.burn(msg.sender, _amountLpToken);
    }

    function getToken1Ratio() public view returns (uint) {
        uint _token1InPool = token1.balanceOf(address(this));
        uint _token2InPool = token2.balanceOf(address(this));
        require(_token1InPool > 0 && _token2InPool > 0);

        return _token1InPool * 1 ether / (_token1InPool + _token2InPool);
    }

    function getToken2Ratio() public view returns (uint) {
        uint _token1InPool = token1.balanceOf(address(this));
        uint _token2InPool = token2.balanceOf(address(this));
        require(_token1InPool > 0 && _token2InPool > 0);

        return _token2InPool * 1 ether / (_token1InPool + _token2InPool);
    }

    function getAmountOfToken2(uint _amountToken1) public view returns (uint) {
        return _amountToken1 * getToken2Ratio() / getToken1Ratio();
    }

    function getAmountOfToken1(uint _amountToken2) public view returns (uint) {
        return _amountToken2 * getToken1Ratio() / getToken2Ratio();
    }

    function getLpTokenComposition(uint _lpTokenAmount) public view returns(uint amountToken1, uint amountToken2) {
        uint _ratio = _lpTokenAmount * 1 ether / lpToken.totalSupply();

        uint _token1InPool = token1.balanceOf(address(this));
        uint _token2InPool = token2.balanceOf(address(this));

        amountToken1 = _ratio * _token1InPool / 1 ether;
        amountToken2 = _ratio * _token2InPool / 1 ether;
    }

//    function swapToken1(uint _amountToken1) external {
//        require(_amountToken1 > 0);
//
//        token1.transferFrom(msg.sender, address(this), _amountToken1);
//        token2.transfer(msg.sender, _amountToken1);
//    }
//
//    function swapToken2(uint _amountToken2) external {
//        require(_amountToken2 > 0);
//
//        token1.transferFrom(msg.sender, address(this), _amountToken2);
//        token2.transfer(msg.sender, _amountToken2);
//    }
}

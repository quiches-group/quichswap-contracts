// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract QuichesToken is ERC20, Ownable {
    mapping(address => bool) private admins;

    // solhint-disable-next-line func-visibility
    constructor() ERC20("QuichCoin", "QCH") {
        transferOwnership(msg.sender);
    }

    function mint(address _to, uint _amount) external {
        require(admins[msg.sender], "Cannot mint");
        _mint(_to, _amount);
    }

    function addAdmin(address _admin) external onlyOwner {
        admins[_admin] = true;
    }

    function removeAdmin(address _admin) external onlyOwner {
        admins[_admin] = false;
    }
}

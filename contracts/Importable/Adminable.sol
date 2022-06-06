// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

abstract contract Adminable is Ownable {
    mapping(address => bool) private _admins;

    function addAdmin(address _toAdd) public onlyOwner {
        _admins[_toAdd] = true;
    }

    function removeAdmin(address _toRemove) public onlyOwner {
        _admins[_toRemove] = false;
    }

    modifier onlyAdmin() {
        require(_admins[msg.sender], "Adminable: caller is not admin");
        _;
    }
}

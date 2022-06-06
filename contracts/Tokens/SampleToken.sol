// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SampleToken is ERC20, Ownable {

    // solhint-disable-next-line func-visibility
    constructor() ERC20("Sample Token", "ST") {
        transferOwnership(msg.sender);
    }

    function mint(address _to, uint _amount) external {
        _mint(_to, _amount);
    }
}

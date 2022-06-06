// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../Importable/Adminable.sol";

contract LPToken is ERC20, Ownable, Adminable {
    // solhint-disable-next-line func-visibility
    constructor(string memory symbol) ERC20(symbol, symbol) {
        transferOwnership(msg.sender);
    }

    function mint(address _to, uint _amount) external onlyAdmin {
        _mint(_to, _amount);
    }

    function burn(address _to, uint _amount) external onlyAdmin {
        _burn(_to, _amount);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title OPN Alpha Token
 * @notice Sample ERC-20 with a public faucet so hackathon judges can test instantly.
 */
contract OPNToken {
    string public name;
    string public symbol;
    uint8  public constant decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    uint256 public constant FAUCET_LIMIT = 10_000 * 1e18;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(string memory _name, string memory _symbol, uint256 _initialSupply) {
        name   = _name;
        symbol = _symbol;
        _mint(msg.sender, _initialSupply);
    }

    /* ── ERC-20 core ─────────────────────────────────────── */

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        return _transfer(msg.sender, to, amount);
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        if (allowed != type(uint256).max) {
            require(allowed >= amount, "ERC20: allowance");
            allowance[from][msg.sender] = allowed - amount;
        }
        return _transfer(from, to, amount);
    }

    /* ── Faucet ──────────────────────────────────────────── */

    function faucet(uint256 amount) external {
        require(amount <= FAUCET_LIMIT, "Faucet: max 10 000 tokens");
        _mint(msg.sender, amount);
    }

    /* ── Internal ────────────────────────────────────────── */

    function _transfer(address from, address to, uint256 amount) internal returns (bool) {
        require(from != address(0) && to != address(0), "ERC20: zero addr");
        require(balanceOf[from] >= amount, "ERC20: balance");
        balanceOf[from] -= amount;
        balanceOf[to]   += amount;
        emit Transfer(from, to, amount);
        return true;
    }

    function _mint(address to, uint256 amount) internal {
        totalSupply   += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }
}

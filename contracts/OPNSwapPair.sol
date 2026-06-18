// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title OPNSwapPair
 * @notice Constant-product AMM pool (x·y = k) with 0.3 % swap fee.
 *         The contract itself is an ERC-20 representing LP shares.
 */
contract OPNSwapPair {
    /* ── LP token metadata ───────────────────────────────── */
    string  public constant name     = "OPN Swap LP";
    string  public constant symbol   = "OPN-LP";
    uint8   public constant decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    /* ── Pool state ──────────────────────────────────────── */
    address public token0;
    address public token1;
    uint256 public reserve0;
    uint256 public reserve1;

    address public factory;
    bool    private _entered;

    /* ── Events ──────────────────────────────────────────── */
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event Swap(address indexed sender, address tokenIn, uint256 amountIn, uint256 amountOut);
    event LiquidityAdded(address indexed sender, uint256 amount0, uint256 amount1, uint256 lpMinted);
    event LiquidityRemoved(address indexed sender, uint256 amount0, uint256 amount1, uint256 lpBurned);

    /* ── Modifiers ───────────────────────────────────────── */
    modifier nonReentrant() {
        require(!_entered, "ReentrancyGuard");
        _entered = true;
        _;
        _entered = false;
    }

    /* ── Constructor ─────────────────────────────────────── */
    constructor(address _token0, address _token1) {
        require(_token0 != address(0) && _token1 != address(0), "Zero address");
        require(_token0 != _token1, "Same token");
        token0  = _token0;
        token1  = _token1;
        factory = msg.sender;
    }

    /* ── ERC-20 (LP token) ───────────────────────────────── */
    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        return _transferLP(msg.sender, to, amount);
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        if (allowed != type(uint256).max) {
            require(allowed >= amount, "LP: allowance");
            allowance[from][msg.sender] = allowed - amount;
        }
        return _transferLP(from, to, amount);
    }

    /* ── Core: Add Liquidity ─────────────────────────────── */
    function addLiquidity(uint256 amount0, uint256 amount1) external nonReentrant returns (uint256 lpMinted) {
        require(amount0 > 0 && amount1 > 0, "Zero amounts");

        // Transfer tokens in
        _safeTransferFrom(token0, msg.sender, address(this), amount0);
        _safeTransferFrom(token1, msg.sender, address(this), amount1);

        if (totalSupply == 0) {
            // First deposit: LP = sqrt(amount0 * amount1)
            lpMinted = _sqrt(amount0 * amount1);
            require(lpMinted > 0, "Insufficient initial liquidity");
        } else {
            // Proportional deposit
            uint256 lp0 = (amount0 * totalSupply) / reserve0;
            uint256 lp1 = (amount1 * totalSupply) / reserve1;
            lpMinted = lp0 < lp1 ? lp0 : lp1;
        }

        require(lpMinted > 0, "Zero LP minted");
        _mintLP(msg.sender, lpMinted);

        reserve0 += amount0;
        reserve1 += amount1;

        emit LiquidityAdded(msg.sender, amount0, amount1, lpMinted);
    }

    /* ── Core: Remove Liquidity ──────────────────────────── */
    function removeLiquidity(uint256 lpAmount) external nonReentrant returns (uint256 out0, uint256 out1) {
        require(lpAmount > 0, "Zero LP");
        require(balanceOf[msg.sender] >= lpAmount, "Insufficient LP");

        out0 = (lpAmount * reserve0) / totalSupply;
        out1 = (lpAmount * reserve1) / totalSupply;
        require(out0 > 0 && out1 > 0, "Insufficient liquidity burned");

        _burnLP(msg.sender, lpAmount);

        reserve0 -= out0;
        reserve1 -= out1;

        _safeTransfer(token0, msg.sender, out0);
        _safeTransfer(token1, msg.sender, out1);

        emit LiquidityRemoved(msg.sender, out0, out1, lpAmount);
    }

    /* ── Core: Swap ──────────────────────────────────────── */
    function swap(address tokenIn, uint256 amountIn, uint256 minAmountOut) external nonReentrant returns (uint256 amountOut) {
        require(tokenIn == token0 || tokenIn == token1, "Invalid token");
        require(amountIn > 0, "Zero input");

        bool isToken0 = tokenIn == token0;
        (uint256 resIn, uint256 resOut) = isToken0
            ? (reserve0, reserve1)
            : (reserve1, reserve0);

        // Transfer token in
        _safeTransferFrom(tokenIn, msg.sender, address(this), amountIn);

        // Constant product with 0.3% fee
        uint256 amountInWithFee = amountIn * 997;
        amountOut = (resOut * amountInWithFee) / (resIn * 1000 + amountInWithFee);
        require(amountOut >= minAmountOut, "Slippage exceeded");
        require(amountOut > 0, "Zero output");

        // Update reserves
        if (isToken0) {
            reserve0 += amountIn;
            reserve1 -= amountOut;
        } else {
            reserve1 += amountIn;
            reserve0 -= amountOut;
        }

        // Transfer token out
        address tokenOut = isToken0 ? token1 : token0;
        _safeTransfer(tokenOut, msg.sender, amountOut);

        emit Swap(msg.sender, tokenIn, amountIn, amountOut);
    }

    /* ── View: Quote ─────────────────────────────────────── */
    function getAmountOut(address tokenIn, uint256 amountIn) external view returns (uint256) {
        require(tokenIn == token0 || tokenIn == token1, "Invalid token");
        if (amountIn == 0 || reserve0 == 0 || reserve1 == 0) return 0;

        bool isToken0 = tokenIn == token0;
        (uint256 resIn, uint256 resOut) = isToken0
            ? (reserve0, reserve1)
            : (reserve1, reserve0);

        uint256 amountInWithFee = amountIn * 997;
        return (resOut * amountInWithFee) / (resIn * 1000 + amountInWithFee);
    }

    function getReserves() external view returns (uint256, uint256) {
        return (reserve0, reserve1);
    }

    /* ── Internal helpers ────────────────────────────────── */
    function _transferLP(address from, address to, uint256 amount) internal returns (bool) {
        require(balanceOf[from] >= amount, "LP: balance");
        balanceOf[from] -= amount;
        balanceOf[to]   += amount;
        emit Transfer(from, to, amount);
        return true;
    }

    function _mintLP(address to, uint256 amount) internal {
        totalSupply   += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function _burnLP(address from, uint256 amount) internal {
        balanceOf[from] -= amount;
        totalSupply     -= amount;
        emit Transfer(from, address(0), amount);
    }

    function _safeTransfer(address token, address to, uint256 amount) internal {
        (bool ok, bytes memory data) = token.call(
            abi.encodeWithSignature("transfer(address,uint256)", to, amount)
        );
        require(ok && (data.length == 0 || abi.decode(data, (bool))), "Transfer failed");
    }

    function _safeTransferFrom(address token, address from, address to, uint256 amount) internal {
        (bool ok, bytes memory data) = token.call(
            abi.encodeWithSignature("transferFrom(address,address,uint256)", from, to, amount)
        );
        require(ok && (data.length == 0 || abi.decode(data, (bool))), "TransferFrom failed");
    }

    function _sqrt(uint256 x) internal pure returns (uint256 z) {
        if (x == 0) return 0;
        z = x;
        uint256 y = (z + 1) / 2;
        while (y < z) {
            z = y;
            y = (x / y + y) / 2;
        }
    }
}

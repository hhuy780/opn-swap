// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./OPNSwapPair.sol";

/**
 * @title OPNSwapFactory
 * @notice Creates and indexes AMM pair pools on OPN Chain.
 */
contract OPNSwapFactory {
    mapping(address => mapping(address => address)) public getPair;
    address[] public allPairs;

    event PairCreated(address indexed token0, address indexed token1, address pair, uint256 index);

    function createPair(address tokenA, address tokenB) external returns (address pair) {
        require(tokenA != tokenB, "Identical tokens");
        require(tokenA != address(0) && tokenB != address(0), "Zero address");

        // Sort tokens
        (address t0, address t1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(getPair[t0][t1] == address(0), "Pair exists");

        OPNSwapPair p = new OPNSwapPair(t0, t1);
        pair = address(p);

        getPair[t0][t1] = pair;
        getPair[t1][t0] = pair;
        allPairs.push(pair);

        emit PairCreated(t0, t1, pair, allPairs.length - 1);
    }

    function allPairsLength() external view returns (uint256) {
        return allPairs.length;
    }
}

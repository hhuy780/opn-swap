/* ── Contract ABIs & Addresses ────────────────────────── */
/* IMPORTANT: Update ADDRESSES after deploying your contracts */

const ADDRESSES = {
  factory: "0xB110F1a3e0C993dcf887D9E44b9d0ee546FF6Ae9",
  tokenA:  "0x85597dF60d2D780f9445904C005F94661b058e3D",
  tokenB:  "0x35A8FcC9Ba4e8cA85b0b14111A306122DFd6D1F9",
  pair:    "0xaB13d11fb583B3859ECCff264ffac710d964826E",
};

const CHAIN = {
  id: 984,
  hex: "0x3D8",
  name: "OPN Chain Testnet",
  rpc: "https://testnet-rpc.iopn.tech",
  explorer: "https://testnet.iopn.tech",
  currency: { name: "IOPN", symbol: "IOPN", decimals: 18 },
};

const TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address,address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
  "function transfer(address,uint256) returns (bool)",
  "function faucet(uint256)",
];

const PAIR_ABI = [
  "function token0() view returns (address)",
  "function token1() view returns (address)",
  "function reserve0() view returns (uint256)",
  "function reserve1() view returns (uint256)",
  "function getReserves() view returns (uint256, uint256)",
  "function getAmountOut(address,uint256) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address,address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
  "function addLiquidity(uint256,uint256) returns (uint256)",
  "function removeLiquidity(uint256) returns (uint256, uint256)",
  "function swap(address,uint256,uint256) returns (uint256)",
];

const FACTORY_ABI = [
  "function getPair(address,address) view returns (address)",
  "function allPairsLength() view returns (uint256)",
  "function createPair(address,address) returns (address)",
];

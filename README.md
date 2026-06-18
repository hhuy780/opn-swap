# OPN Swap – AMM DEX on OPN Chain

The first constant-product AMM on OPN Chain. Swap tokens, provide liquidity, earn fees.

---

## Quick Start (Dành cho người không biết code)

### Bước 0: Cài đặt cơ bản

1. Cài [Node.js](https://nodejs.org/) (chọn bản LTS, cứ Next → Next → Install)
2. Cài [MetaMask](https://metamask.io/) extension trên Chrome
3. Vào trang [https://builders.iopn.tech/connect](https://builders.iopn.tech/connect) → Connect wallet + Discord để tạo builder profile

### Bước 1: Lấy IOPN testnet (gas fee)

- Vào Discord IOPn, tìm channel **#faucet**
- Gõ lệnh faucet hoặc làm theo hướng dẫn để nhận IOPN testnet miễn phí
- Hoặc tìm trên trang IOPn có mục faucet

### Bước 2: Thêm OPN Testnet vào MetaMask

Mở MetaMask → Settings → Networks → Add Network:

| Field | Value |
|-------|-------|
| Network Name | OPN Chain Testnet |
| RPC URL | `https://testnet-rpc.iopn.tech` |
| Chain ID | `984` |
| Currency Symbol | `IOPN` |
| Block Explorer | `https://testnet.iopn.tech` |

### Bước 3: Tải và cài đặt project

Mở Terminal (hoặc Command Prompt trên Windows):

```bash
# Clone hoặc giải nén project
cd opn-swap

# Cài dependencies
npm install
```

### Bước 4: Deploy smart contracts

```bash
# Set private key (LẤY TỪ METAMASK: Account Details → Export Private Key)
# ⚠️ KHÔNG BAO GIỜ share private key với ai!

# Windows CMD:
set PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE

# Mac/Linux:
export PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE

# Deploy
npm run deploy
```

Sau khi chạy xong, terminal sẽ hiện ra 4 địa chỉ contract. Ví dụ:
```
══════════════════════════════════════════
  DEPLOYMENT COMPLETE - Copy to contracts.js:
══════════════════════════════════════════
  factory: "0x1234...",
  tokenA:  "0x5678...",
  tokenB:  "0x9abc...",
  pair:    "0xdef0...",
══════════════════════════════════════════
```

### Bước 5: Cập nhật địa chỉ vào frontend

Mở file `frontend/js/contracts.js` bằng bất kỳ text editor nào (Notepad, VS Code...)

Thay thế 4 dòng `0x0000...` bằng 4 địa chỉ bạn vừa deploy:

```javascript
const ADDRESSES = {
  factory: "0x... (dán địa chỉ factory ở đây)",
  tokenA:  "0x... (dán địa chỉ tokenA ở đây)",
  tokenB:  "0x... (dán địa chỉ tokenB ở đây)",
  pair:    "0x... (dán địa chỉ pair ở đây)",
};
```

### Bước 6: Test trên máy

```bash
npm run dev
```

Mở trình duyệt, vào `http://localhost:3000` → Connect MetaMask → Thử Faucet → Swap!

### Bước 7: Deploy frontend lên Vercel

1. Vào [vercel.com](https://vercel.com) → Sign up bằng GitHub
2. Đẩy code lên GitHub (tạo repo mới, push code lên)
3. Trên Vercel: Import Git Repository → chọn repo vừa tạo
4. Settings:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Other
5. Deploy!

Vercel sẽ cho bạn link dạng `https://opn-swap-xxx.vercel.app`

### Bước 8: Submit trên IOPn Builders

1. Vào [https://builders.iopn.tech/dashboard/submit](https://builders.iopn.tech/dashboard/submit)
2. Điền thông tin (dùng nội dung trong file SUBMISSION.md bên dưới)
3. Dán link live demo (Vercel URL)
4. Dán link source code (GitHub URL)
5. Submit!

---

## Cấu trúc project

```
opn-swap/
├── contracts/           # Smart contracts Solidity
│   ├── OPNToken.sol     # ERC-20 token + faucet
│   ├── OPNSwapPair.sol  # AMM pool (x·y=k)
│   └── OPNSwapFactory.sol
├── frontend/            # Giao diện web
│   ├── index.html
│   ├── css/style.css
│   └── js/
│       ├── app.js
│       └── contracts.js # ← CẬP NHẬT ĐỊA CHỈ Ở ĐÂY
├── scripts/
│   └── deploy.js        # Script deploy tự động
├── hardhat.config.js
└── package.json
```

## Contracts

| Contract | Purpose |
|----------|---------|
| **OPNToken** | ERC-20 token with public faucet (max 10,000/call) |
| **OPNSwapPair** | Constant-product AMM (x·y=k), 0.3% fee, LP tokens |
| **OPNSwapFactory** | Creates and indexes token pair pools |

## License

MIT

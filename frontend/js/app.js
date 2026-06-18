/* ── OPN Swap – Main Application ──────────────────────── */
/* globals ethers, ADDRESSES, CHAIN, TOKEN_ABI, PAIR_ABI */

let provider, signer, userAddr;
let tokenA, tokenB, pair;
let swapDirection = true; // true = A→B, false = B→A
let slippage = 1; // percent

/* ── Wallet ──────────────────────────────────────────── */

async function connectWallet() {
  if (!window.ethereum) {
    showToast("Please install MetaMask", "error");
    return;
  }
  try {
    provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    signer = await provider.getSigner();
    userAddr = accounts[0];
    document.getElementById("connectBtn").textContent =
      userAddr.slice(0, 6) + "..." + userAddr.slice(-4);
    await checkChain();
    initContracts();
    refreshAll();
  } catch (e) {
    showToast("Wallet connection failed", "error");
    console.error(e);
  }
}

async function addOPNChain() {
  if (!window.ethereum) { showToast("Install MetaMask first", "error"); return; }
  try {
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [{
        chainId: CHAIN.hex,
        chainName: CHAIN.name,
        nativeCurrency: CHAIN.currency,
        rpcUrls: [CHAIN.rpc],
        blockExplorerUrls: [CHAIN.explorer],
      }],
    });
    showToast("OPN Testnet added!", "success");
  } catch (e) {
    console.error(e);
  }
}

async function checkChain() {
  const net = await provider.getNetwork();
  if (Number(net.chainId) !== CHAIN.id) {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: CHAIN.hex }],
      });
    } catch (e) {
      if (e.code === 4902) await addOPNChain();
    }
  }
}

/* ── Contracts ───────────────────────────────────────── */

function initContracts() {
  tokenA = new ethers.Contract(ADDRESSES.tokenA, TOKEN_ABI, signer);
  tokenB = new ethers.Contract(ADDRESSES.tokenB, TOKEN_ABI, signer);
  pair   = new ethers.Contract(ADDRESSES.pair, PAIR_ABI, signer);
}

/* ── Refresh data ────────────────────────────────────── */

async function refreshAll() {
  if (!userAddr) return;
  try {
    await Promise.all([refreshBalances(), refreshPool()]);
  } catch (e) {
    console.error("refresh error", e);
  }
}

async function refreshBalances() {
  const [balA, balB] = await Promise.all([
    tokenA.balanceOf(userAddr),
    tokenB.balanceOf(userAddr),
  ]);
  const fA = fmt(balA);
  const fB = fmt(balB);

  document.getElementById("swapFromBal").textContent = swapDirection ? fA : fB;
  document.getElementById("swapToBal").textContent   = swapDirection ? fB : fA;
  document.getElementById("faucetBalA").textContent   = fA;
  document.getElementById("faucetBalB").textContent   = fB;
}

async function refreshPool() {
  try {
    const [r0, r1] = await pair.getReserves();
    const lpTotal  = await pair.totalSupply();
    const myLP     = await pair.balanceOf(userAddr);

    document.getElementById("poolRes0").textContent  = fmt(r0);
    document.getElementById("poolRes1").textContent  = fmt(r1);
    document.getElementById("poolLP").textContent    = fmt(myLP);
    document.getElementById("poolShare").textContent =
      lpTotal > 0n ? ((Number(myLP) / Number(lpTotal)) * 100).toFixed(2) + "%" : "0%";
  } catch (e) {
    console.error(e);
  }
}

/* ── Swap logic ──────────────────────────────────────── */

async function onSwapInput() {
  const raw = document.getElementById("swapFromAmt").value;
  if (!raw || isNaN(raw) || Number(raw) <= 0) {
    document.getElementById("swapToAmt").value = "";
    document.getElementById("swapInfo").style.display = "none";
    document.getElementById("swapBtn").textContent = "Enter an amount";
    document.getElementById("swapBtn").disabled = true;
    return;
  }

  try {
    const amtIn = ethers.parseEther(raw);
    const tokenIn = swapDirection ? ADDRESSES.tokenA : ADDRESSES.tokenB;
    const amtOut = await pair.getAmountOut(tokenIn, amtIn);

    document.getElementById("swapToAmt").value = fmt(amtOut);

    // Price
    const price = Number(raw) > 0 ? (Number(fmt(amtOut)) / Number(raw)).toFixed(6) : "—";
    const fromSym = swapDirection ? "ALPHA" : "BETA";
    const toSym   = swapDirection ? "BETA" : "ALPHA";
    document.getElementById("swapPrice").textContent = `1 ${fromSym} = ${price} ${toSym}`;

    // Price impact
    const [r0, r1] = await pair.getReserves();
    const resIn  = swapDirection ? r0 : r1;
    const impact = resIn > 0n ? (Number(amtIn) / Number(resIn) * 100).toFixed(2) : "0";
    const impactEl = document.getElementById("swapImpact");
    impactEl.textContent = impact + "%";
    impactEl.className = Number(impact) > 15 ? "price-impact-danger"
                        : Number(impact) > 5  ? "price-impact-warn" : "";

    // Min received
    const minOut = Number(fmt(amtOut)) * (1 - slippage / 100);
    document.getElementById("swapMin").textContent = minOut.toFixed(6) + " " + toSym;

    document.getElementById("swapInfo").style.display = "block";
    document.getElementById("swapBtn").textContent = "Swap";
    document.getElementById("swapBtn").disabled = false;
  } catch (e) {
    console.error(e);
    document.getElementById("swapBtn").textContent = "Insufficient liquidity";
    document.getElementById("swapBtn").disabled = true;
  }
}

async function doSwap() {
  const raw = document.getElementById("swapFromAmt").value;
  if (!raw || !signer) return;

  const btn = document.getElementById("swapBtn");
  btn.disabled = true;

  try {
    const amtIn   = ethers.parseEther(raw);
    const tokenIn = swapDirection ? ADDRESSES.tokenA : ADDRESSES.tokenB;
    const fromContract = swapDirection ? tokenA : tokenB;

    // Check & approve
    const allowed = await fromContract.allowance(userAddr, ADDRESSES.pair);
    if (allowed < amtIn) {
      btn.innerHTML = '<span class="spinner"></span>Approving...';
      const appTx = await fromContract.approve(ADDRESSES.pair, ethers.MaxUint256);
      await appTx.wait();
      showToast("Approved!", "success");
    }

    // Get quote for minOut
    const amtOut = await pair.getAmountOut(tokenIn, amtIn);
    const minOut = amtOut * BigInt(Math.floor((100 - slippage) * 10)) / 1000n;

    btn.innerHTML = '<span class="spinner"></span>Swapping...';
    const tx = await pair.swap(tokenIn, amtIn, minOut);
    showToast("Swap submitted...", "pending");
    const receipt = await tx.wait();
    showToast(
      `Swapped! <a href="${CHAIN.explorer}/tx/${receipt.hash}" target="_blank">View tx</a>`,
      "success"
    );

    document.getElementById("swapFromAmt").value = "";
    document.getElementById("swapToAmt").value = "";
    document.getElementById("swapInfo").style.display = "none";
    refreshAll();
  } catch (e) {
    showToast(e.reason || "Swap failed", "error");
    console.error(e);
  }
  btn.disabled = false;
  btn.textContent = "Swap";
}

function flipTokens() {
  swapDirection = !swapDirection;
  const fromSel = document.getElementById("swapFromToken");
  const toSel   = document.getElementById("swapToToken");

  if (swapDirection) {
    fromSel.innerHTML = '<div class="dot" style="background:#00d4aa"></div><span>ALPHA</span>';
    toSel.innerHTML   = '<div class="dot" style="background:#4a9eff"></div><span>BETA</span>';
  } else {
    fromSel.innerHTML = '<div class="dot" style="background:#4a9eff"></div><span>BETA</span>';
    toSel.innerHTML   = '<div class="dot" style="background:#00d4aa"></div><span>ALPHA</span>';
  }

  document.getElementById("swapFromAmt").value = "";
  document.getElementById("swapToAmt").value = "";
  document.getElementById("swapInfo").style.display = "none";
  refreshBalances();
}

function setMaxFrom() {
  const bal = document.getElementById("swapFromBal").textContent;
  document.getElementById("swapFromAmt").value = bal;
  onSwapInput();
}

/* ── Pool logic ──────────────────────────────────────── */

async function onAddInput(idx) {
  try {
    const [r0, r1] = await pair.getReserves();
    if (r0 === 0n || r1 === 0n) return; // first deposit, free ratio

    const val = document.getElementById(idx === 0 ? "addAmt0" : "addAmt1").value;
    if (!val || isNaN(val)) return;
    const amt = ethers.parseEther(val);

    if (idx === 0) {
      const other = (amt * r1) / r0;
      document.getElementById("addAmt1").value = fmt(other);
    } else {
      const other = (amt * r0) / r1;
      document.getElementById("addAmt0").value = fmt(other);
    }
  } catch (e) { console.error(e); }
}

async function doAddLiquidity() {
  const v0 = document.getElementById("addAmt0").value;
  const v1 = document.getElementById("addAmt1").value;
  if (!v0 || !v1 || !signer) return;

  try {
    const a0 = ethers.parseEther(v0);
    const a1 = ethers.parseEther(v1);

    // Approve both
    const allow0 = await tokenA.allowance(userAddr, ADDRESSES.pair);
    const allow1 = await tokenB.allowance(userAddr, ADDRESSES.pair);
    const approvals = [];
    if (allow0 < a0) approvals.push(tokenA.approve(ADDRESSES.pair, ethers.MaxUint256));
    if (allow1 < a1) approvals.push(tokenB.approve(ADDRESSES.pair, ethers.MaxUint256));
    if (approvals.length) {
      showToast("Approving tokens...", "pending");
      const txs = await Promise.all(approvals);
      await Promise.all(txs.map(tx => tx.wait()));
    }

    showToast("Adding liquidity...", "pending");
    const tx = await pair.addLiquidity(a0, a1);
    const receipt = await tx.wait();
    showToast(
      `Liquidity added! <a href="${CHAIN.explorer}/tx/${receipt.hash}" target="_blank">View tx</a>`,
      "success"
    );
    document.getElementById("addAmt0").value = "";
    document.getElementById("addAmt1").value = "";
    refreshAll();
  } catch (e) {
    showToast(e.reason || "Add liquidity failed", "error");
    console.error(e);
  }
}

function onRemoveSlider() {
  document.getElementById("removePctLabel").textContent =
    document.getElementById("removePct").value + "%";
}

function setRemovePct(pct) {
  document.getElementById("removePct").value = pct;
  document.getElementById("removePctLabel").textContent = pct + "%";
}

async function doRemoveLiquidity() {
  const pct = Number(document.getElementById("removePct").value);
  if (pct <= 0 || !signer) return;

  try {
    const myLP = await pair.balanceOf(userAddr);
    const removeAmt = (myLP * BigInt(pct)) / 100n;
    if (removeAmt === 0n) { showToast("No LP to remove", "error"); return; }

    // Approve LP if needed
    const allowed = await pair.allowance(userAddr, ADDRESSES.pair);
    if (allowed < removeAmt) {
      showToast("Approving LP...", "pending");
      const appTx = await pair.approve(ADDRESSES.pair, ethers.MaxUint256);
      await appTx.wait();
    }

    showToast("Removing liquidity...", "pending");
    const tx = await pair.removeLiquidity(removeAmt);
    const receipt = await tx.wait();
    showToast(
      `Liquidity removed! <a href="${CHAIN.explorer}/tx/${receipt.hash}" target="_blank">View tx</a>`,
      "success"
    );
    setRemovePct(0);
    refreshAll();
  } catch (e) {
    showToast(e.reason || "Remove failed", "error");
    console.error(e);
  }
}

/* ── Faucet ──────────────────────────────────────────── */

async function claimFaucet(token) {
  if (!signer) { showToast("Connect wallet first", "error"); return; }
  try {
    const contract = token === "A" ? tokenA : tokenB;
    const name = token === "A" ? "ALPHA" : "BETA";
    showToast(`Claiming 1,000 ${name}...`, "pending");
    const tx = await contract.faucet(ethers.parseEther("1000"));
    await tx.wait();
    showToast(`Got 1,000 ${name}!`, "success");
    refreshAll();
  } catch (e) {
    showToast(e.reason || "Faucet failed", "error");
    console.error(e);
  }
}

/* ── Tabs ────────────────────────────────────────────── */

document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById("sec-" + tab.dataset.tab).classList.add("active");
    if (tab.dataset.tab === "pool") refreshPool();
  });
});

/* ── Slippage ────────────────────────────────────────── */

document.querySelectorAll("[data-slip]").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("[data-slip]").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    slippage = Number(btn.dataset.slip);
    onSwapInput();
  });
});

/* ── Toasts ──────────────────────────────────────────── */

function showToast(msg, type = "success") {
  const container = document.getElementById("toast-container");
  const el = document.createElement("div");
  el.className = "toast " + type;
  el.innerHTML = msg;
  container.appendChild(el);
  setTimeout(() => el.remove(), 6000);
}

/* ── Helpers ─────────────────────────────────────────── */

function fmt(wei) {
  return Number(ethers.formatEther(wei)).toFixed(4);
}

/* ── Wallet events ───────────────────────────────────── */

if (window.ethereum) {
  window.ethereum.on("accountsChanged", () => location.reload());
  window.ethereum.on("chainChanged", () => location.reload());
}

document.addEventListener("DOMContentLoaded", () => {

  /* ================= TELEGRAM ================= */
  const tg = window.Telegram.WebApp;
  tg.expand();

  const user = tg.initDataUnsafe.user || {};
  const userId = String(user.id);

  const API = "https://kosmogift-worker.v-bot-2010.workers.dev";

  /* ================= ELEMENTS ================= */
  const avatar = document.getElementById("avatar");
  const profileAvatar = document.getElementById("profileAvatar");
  const username = document.getElementById("username");

  const balanceEl = document.getElementById("balance");
  const balanceProfile = document.getElementById("balanceProfile");

  const btnHome = document.getElementById("btnHome");
  const btnProfile = document.getElementById("btnProfile");

  const connectWallet = document.getElementById("connectWallet");
  const disconnectWallet = document.getElementById("disconnectWallet");

  const deposit = document.getElementById("deposit");
  const modal = document.getElementById("modal");
  const closeModal = document.getElementById("closeModal");
  const pay = document.getElementById("pay");
  const amountInput = document.getElementById("amount");

  const openDaily = document.getElementById("openDaily");
  const openUnlucky = document.getElementById("openUnlucky");

  const caseModal = document.getElementById("caseModal");
  const openCaseBtn = document.getElementById("openCaseBtn");
  const closeCase = document.getElementById("closeCase");
  const strip = document.getElementById("strip");

  const rewardModal = document.getElementById("rewardModal");
  const rewardText = document.getElementById("rewardText");
  const rewardBtnOk = document.getElementById("rewardBtnOk");
  const rewardBtnInv = document.getElementById("rewardBtnInv");

  const subscribeModal = document.getElementById("subscribeModal");
  const subscribeBtn = document.getElementById("subscribeBtn");

  const timerBlock = document.getElementById("timerBlock");
  const timerText = document.getElementById("timerText");

  /* ================= STATE ================= */
  let currentBalance = 0;
  let currentCase = null;
  let isSpinning = false;
  let subscribed = false;

  /* ================= USER ================= */
  avatar.src = user.photo_url || "";
  profileAvatar.src = user.photo_url || "";
  username.innerText = user.username || "Telegram User";

  btnHome.onclick = () => switchPage("home");
  btnProfile.onclick = () => switchPage("profile");

  function switchPage(id) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById(id).classList.add("active");
  }

  /* ================= TON CONNECT ================= */
  const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
    manifestUrl: "https://kosmogift.pages.dev/tonconnect-manifest.json"
  });

  connectWallet.onclick = () => tonConnectUI.openModal();
  disconnectWallet.onclick = () => tonConnectUI.disconnect();

  tonConnectUI.onStatusChange(wallet => {
    connectWallet.style.display = wallet ? "none" : "block";
    disconnectWallet.style.display = wallet ? "block" : "none";
  });

  /* ================= DEPOSIT ================= */
  deposit.onclick = () => modal.style.display = "flex";
  closeModal.onclick = () => modal.style.display = "none";

  pay.onclick = async () => {
    const amount = parseFloat(amountInput.value);
    if (!amount || amount < 0.1) return alert("Минимум 0.1 TON");

    await tonConnectUI.sendTransaction({
      validUntil: Math.floor(Date.now() / 1000) + 600,
      messages: [{
        address: "UQAFXBXzBzau6ZCWzruiVrlTg3HAc8MF6gKIntqTLDifuWOi",
        amount: (amount * 1e9).toString()
      }]
    });

    modal.style.display = "none";
  };

  /* ================= BALANCE ================= */
  async function updateBalance() {
    const res = await fetch(`${API}/balance?user=${userId}`);
    const data = await res.json();
    currentBalance = data.balance;
    balanceEl.innerText = data.balance.toFixed(2) + " TON";
    balanceProfile.innerText = data.balance.toFixed(2) + " TON";
  }

  updateBalance();
  setInterval(updateBalance, 5000);

  /* ================= PRIZES ================= */
  const dailyPrizes = [
    { type: "ton", value: 0.01, chance: 90 },
    { type: "ton", value: 0.03, chance: 9.9 },
    { type: "nft", value: "Daily NFT", chance: 0.1 }
  ];

  const unluckyPrizes = [
    { type: "ton", value: 0.2, chance: 70 },
    { type: "ton", value: 0.5, chance: 25 },
    { type: "nft", value: "Rare NFT", chance: 5 }
  ];

  function pickPrize(list) {
    const r = Math.random() * 100;
    let sum = 0;
    for (const p of list) {
      sum += p.chance;
      if (r <= sum) return p;
    }
    return list[0];
  }

  /* ================= DAILY TIMER ================= */
  const DAILY_KEY = "daily_case_end";
  const DAY = 24 * 60 * 60 * 1000;

  function dailyReady() {
    const t = localStorage.getItem(DAILY_KEY);
    return !t || Date.now() > Number(t);
  }

  function startDailyTimer() {
    localStorage.setItem(DAILY_KEY, Date.now() + DAY);
    updateDailyTimer();
  }

  function updateDailyTimer() {
    const t = localStorage.getItem(DAILY_KEY);
    if (!t || Date.now() > Number(t)) {
      openDaily.style.display = "block";
      timerBlock.style.display = "none";
      return;
    }

    openDaily.style.display = "none";
    timerBlock.style.display = "block";

    const left = Number(t) - Date.now();
    const h = Math.floor(left / 3600000);
    const m = Math.floor((left % 3600000) / 60000);
    const s = Math.floor((left % 60000) / 1000);

    timerText.innerText =
      String(h).padStart(2,"0") + ":" +
      String(m).padStart(2,"0") + ":" +
      String(s).padStart(2,"0");
  }

  setInterval(updateDailyTimer, 1000);
  updateDailyTimer();

  /* ================= OPEN CASE ================= */
  openDaily.onclick = () => {
    if (!dailyReady()) return;
    currentCase = "daily";
    caseModal.style.display = "flex";
  };

  openUnlucky.onclick = () => {
    if (currentBalance < 0.25) return alert("Недостаточно средств");
    currentCase = "unlucky";
    caseModal.style.display = "flex";
  };

  closeCase.onclick = () => caseModal.style.display = "none";

  /* ================= SPIN ================= */
  openCaseBtn.onclick = async () => {
    if (isSpinning) return;
    isSpinning = true;

    if (currentCase === "unlucky") {
      await fetch(`${API}/add-balance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: userId, amount: -0.25 })
      });
      await updateBalance();
    }

    const prize = pickPrize(
      currentCase === "daily" ? dailyPrizes : unluckyPrizes
    );

    strip.innerHTML = "";
    strip.style.transition = "none";
    strip.style.transform = "translateX(0)";

    const pool = currentCase === "daily" ? dailyPrizes : unluckyPrizes;
    const items = [];

    for (let i = 0; i < 30; i++) {
      items.push(pool[Math.floor(Math.random() * pool.length)]);
    }

    const winIndex = 25;
    items[winIndex] = prize;

    items.forEach(i => {
      const d = document.createElement("div");
      d.className = "drop";
      d.innerText = i.type === "ton" ? `${i.value} TON` : i.value;
      strip.appendChild(d);
    });

    setTimeout(() => {
      strip.style.transition = "transform 6s cubic-bezier(.15,.6,.3,1)";
      strip.style.transform = `translateX(-${winIndex * 218}px)`;
    }, 50);

    setTimeout(async () => {

      if (currentCase === "daily") startDailyTimer();

      if (prize.type === "ton") {
        await fetch(`${API}/add-balance`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user: userId, amount: prize.value })
        });
      } else {
        await fetch(`${API}/add-nft`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user: userId,
            nft: { name: prize.value, price: 3 }
          })
        });
      }

      rewardText.innerText =
        prize.type === "ton"
          ? `Вы выиграли ${prize.value} TON`
          : `Вы выиграли NFT "${prize.value}"`;

      rewardBtnOk.style.display = prize.type === "ton" ? "block" : "none";
      rewardBtnInv.style.display = prize.type === "nft" ? "block" : "none";

      rewardModal.style.display = "flex";
      isSpinning = false;

    }, 6500);
  };

  rewardBtnOk.onclick =
  rewardBtnInv.onclick = () => {
    rewardModal.style.display = "none";
    caseModal.style.display = "none";
  };

});

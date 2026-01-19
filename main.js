document.addEventListener("DOMContentLoaded", () => {
  if (!window.Telegram?.WebApp) {
    alert("Запускай Mini App через Telegram");
    return;
  }

  const tg = window.Telegram.WebApp;
  tg.expand();

  const user = tg.initDataUnsafe.user;
  const userId = String(user.id);

  const API = "https://kosmogift-worker.v-bot-2010.workers.dev";

  /* ================= ELEMENTS ================= */
  const avatar = document.getElementById("avatar");
  const profileAvatar = document.getElementById("profileAvatar");
  const username = document.getElementById("username");

  const balance = document.getElementById("balance");
  const balanceProfile = document.getElementById("balanceProfile");

  const btnHome = document.getElementById("btnHome");
  const btnProfile = document.getElementById("btnProfile");

  const openDaily = document.getElementById("openDaily");
  const openInventory = document.getElementById("openInventory");

  const subscribeModal = document.getElementById("subscribeModal");
  const subscribeBtn = document.getElementById("subscribeBtn");

  const caseModal = document.getElementById("caseModal");
  const closeCase = document.getElementById("closeCase");
  const openCaseBtn = document.getElementById("openCaseBtn");
  const resultText = document.getElementById("resultText");
  const strip = document.getElementById("strip");

  const inventoryModal = document.getElementById("inventoryModal");
  const closeInventory = document.getElementById("closeInventory");
  const inventoryList = document.getElementById("inventoryList");

  const connectWallet = document.getElementById("connectWallet");
  const disconnectWallet = document.getElementById("disconnectWallet");
  const deposit = document.getElementById("deposit");

  const winModal = document.getElementById("winModal");
  const winTitle = document.getElementById("winTitle");
  const winPrize = document.getElementById("winPrize");
  const getTonBtn = document.getElementById("getTonBtn");
  const toInvBtn = document.getElementById("toInvBtn");
  const sellBtn = document.getElementById("sellBtn");

  /* ================= USER ================= */
  avatar.src = user.photo_url || "";
  profileAvatar.src = user.photo_url || "";
  username.innerText = user.username || "Telegram User";

  /* ================= NAV ================= */
  function showPage(id) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById(id).classList.add("active");
  }

  btnHome.onclick = () => showPage("home");
  btnProfile.onclick = () => showPage("profile");

  /* ================= BALANCE ================= */
  async function loadBalance() {
    const r = await fetch(`${API}/balance?user_id=${userId}`);
    const d = await r.json();
    balance.innerText = `${Number(d.balance).toFixed(2)} TON`;
    balanceProfile.innerText = `${Number(d.balance).toFixed(2)} TON`;
  }

  loadBalance();

  /* ================= TON CONNECT ================= */
  const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
    manifestUrl: "https://kosmogift.pages.dev/tonconnect-manifest.json"
  });

  connectWallet.onclick = async () => {
    try {
      await tonConnectUI.connect();
    } catch {}
  };

  disconnectWallet.onclick = async () => {
    await tonConnectUI.disconnect();
  };

  tonConnectUI.onStatusChange(wallet => {
    if (wallet) {
      connectWallet.style.display = "none";
      disconnectWallet.style.display = "block";
    } else {
      connectWallet.style.display = "block";
      disconnectWallet.style.display = "none";
    }
  });

  /* ================= DEPOSIT ================= */
  deposit.onclick = async () => {
    const amount = parseFloat(prompt("Сколько TON пополнить?"));
    if (!amount || amount < 0.1) return alert("Минимум 0.1 TON");

    await tonConnectUI.sendTransaction({
      validUntil: Math.floor(Date.now() / 1000) + 600,
      messages: [{
        address: "UQAFXBXzBzau6ZCWzruiVrlTg3HAc8MF6gKIntqTLDifuWOi",
        amount: String(amount * 1e9)
      }]
    });

    alert("Оплата отправлена");
  };

  /* ================= SUBSCRIBE (1 TIME) ================= */
  function needSubscribe() {
    return !localStorage.getItem("subscribed");
  }

  subscribeBtn.onclick = () => {
    tg.openUrl("https://t.me/KosmoGiftOfficial");
    localStorage.setItem("subscribed", "1");
    subscribeModal.style.display = "none";
  };

  /* ================= DAILY CASE ================= */
  const PRIZES = [
    { type: "ton", amount: 0.01, chance: 90 },
    { type: "ton", amount: 0.02, chance: 5 },
    { type: "ton", amount: 0.03, chance: 2.5 },
    { type: "ton", amount: 0.04, chance: 1 },
    { type: "ton", amount: 0.05, chance: 0.75 },
    { type: "ton", amount: 0.06, chance: 0.5 },
    { type: "ton", amount: 0.07, chance: 0.24 },
    { type: "nft", name: "lol pop", chance: 0.01 }
  ];

  function pickPrize() {
    const rnd = Math.random() * 100;
    let sum = 0;
    for (const p of PRIZES) {
      sum += p.chance;
      if (rnd <= sum) return p;
    }
    return PRIZES[0];
  }

  function buildStrip(prize) {
    strip.innerHTML = "";
    for (let i = 0; i < 20; i++) {
      const d = document.createElement("div");
      d.className = "drop";

      const p = PRIZES[Math.floor(Math.random() * PRIZES.length)];
      if (i === 10) {
        // середина всегда приз
        if (prize.type === "ton") d.innerText = `${prize.amount} TON`;
        else d.innerText = prize.name;
      } else {
        if (p.type === "ton") d.innerText = `${p.amount} TON`;
        else d.innerText = p.name;
      }

      strip.appendChild(d);
    }
  }

  openDaily.onclick = async () => {
    if (needSubscribe()) {
      subscribeModal.style.display = "flex";
      return;
    }

    const r = await fetch(`${API}/daily?user_id=${userId}`);
    const d = await r.json();

    if (d.error === "already") {
      alert("Кейс доступен раз в 24 часа");
      return;
    }

    caseModal.style.display = "flex";
    resultText.innerText = "Нажми «Открыть кейс»";
    strip.style.transform = "translateX(0)";
  };

  closeCase.onclick = () => caseModal.style.display = "none";

  openCaseBtn.onclick = async () => {
    const prize = pickPrize();
    buildStrip(prize);

    // плавный прокрут
    const rollDistance = 2000; // пикселей
    strip.style.transition = "transform 3s cubic-bezier(.2,.8,.2,1)";
    strip.style.transform = `translateX(-${rollDistance}px)`;

    // после остановки
    setTimeout(async () => {
      caseModal.style.display = "none";

      winModal.style.display = "flex";
      winTitle.innerText = prize.type === "ton" ? "Вы выиграли TON" : "Вы выиграли NFT";
      winPrize.innerText = prize.type === "ton" ? `${prize.amount} TON` : prize.name;

      // кнопки
      if (prize.type === "ton") {
        getTonBtn.style.display = "block";
        toInvBtn.style.display = "none";
        sellBtn.style.display = "none";

                getTonBtn.onclick = async () => {
  try {
    const res = await fetch(`${API}/add-ton`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, amount: prize.amount })
    });

    const data = await res.json();
    console.log("ADD TON RESPONSE:", data);

    if (!res.ok) {
      alert("Ошибка сервера при начислении TON: " + (data.error || res.status));
      return;
    }

    loadBalance();
    winModal.style.display = "none";
  } catch (e) {
    alert("Ошибка при запросе: " + e.message);
  }
};

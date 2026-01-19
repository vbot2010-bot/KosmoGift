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

  const winModal = document.getElementById("winModal");
  const closeWin = document.getElementById("closeWin");
  const winTitle = document.getElementById("winTitle");
  const winDesc = document.getElementById("winDesc");
  const getTonBtn = document.getElementById("getTonBtn");
  const toInventoryBtn = document.getElementById("toInventoryBtn");

  const inventoryModal = document.getElementById("inventoryModal");
  const closeInventory = document.getElementById("closeInventory");
  const inventoryList = document.getElementById("inventoryList");

  const connectWallet = document.getElementById("connectWallet");
  const disconnectWallet = document.getElementById("disconnectWallet");
  const deposit = document.getElementById("deposit");

  const strip = document.getElementById("strip");

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
    const r = await fetch(`${API}/balance?user=${userId}`);
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
      await tonConnectUI.connectWallet();
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

  /* ================= PRIZES ================= */
  const prizes = [
    { name: "NFT #1", type: "nft", price: 3.27, chance: 10 },
    { name: "NFT #2", type: "nft", price: 3.27, chance: 5 },
    { name: "10 TON", type: "ton", amount: 10, chance: 20 },
    { name: "5 TON", type: "ton", amount: 5, chance: 25 },
    { name: "1 TON", type: "ton", amount: 1, chance: 40 },
  ];

  function getRandomPrize() {
    const total = prizes.reduce((a, b) => a + b.chance, 0);
    let r = Math.random() * total;
    for (const p of prizes) {
      r -= p.chance;
      if (r <= 0) return p;
    }
    return prizes[0];
  }

  /* ================= DAILY CASE ================= */
  openDaily.onclick = async () => {
    if (needSubscribe()) {
      subscribeModal.style.display = "flex";
      return;
    }

    const r = await fetch(`${API}/daily?user=${userId}`);
    const d = await r.json();

    if (d.error === "already") {
      alert("Кейс доступен раз в 24 часа");
      return;
    }

    caseModal.style.display = "flex";
    resultText.innerText = "Нажми «Открыть кейс»";

    // Build roulette strip
    strip.innerHTML = "";
    for (let i = 0; i < 12; i++) {
      const prize = prizes[i % prizes.length];
      const div = document.createElement("div");
      div.className = "drop";
      div.innerText = prize.name;
      strip.appendChild(div);
    }
  };

  closeCase.onclick = () => caseModal.style.display = "none";

  let prize = null;

  openCaseBtn.onclick = async () => {
    // animation
    prize = getRandomPrize();

    const distance = 3000 + Math.random() * 2000; // smooth spin
    strip.style.transition = "transform 4s cubic-bezier(.1,.9,.2,1)";
    strip.style.transform = `translateX(-${distance}px)`;

    setTimeout(() => {
      strip.style.transition = "";
      strip.style.transform = "translateX(0)";
      caseModal.style.display = "none";

      // show win modal
      winModal.style.display = "flex";
      winTitle.innerText = prize.name;

      if (prize.type === "ton") {
        winDesc.innerText = `Вы выиграли ${prize.amount} TON`;
        getTonBtn.style.display = "block";
        toInventoryBtn.style.display = "none";
      } else {
        winDesc.innerText = `NFT стоимостью ${prize.price} TON`;
        getTonBtn.style.display = "none";
        toInventoryBtn.style.display = "block";
      }
    }, 4200);
  };

  closeWin.onclick = () => winModal.style.display = "none";

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

  toInventoryBtn.onclick = async () => {
    await fetch(`${API}/add-nft`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, name: prize.name, price: prize.price })
    });

    loadBalance();
    winModal.style.display = "none";
  };

  /* ================= INVENTORY ================= */
  openInventory.onclick = async () => {
    inventoryModal.style.display = "flex";
    inventoryList.innerHTML = "";

    const r = await fetch(`${API}/inventory?user=${userId}`);
    const inv = await r.json();

    inv.forEach((item, i) => {
      const div = document.createElement("div");
      div.className = "itemCard";
      div.innerHTML = `
        <div>${item.name}</div>
        <button>Продать</button>
      `;

      div.querySelector("button").onclick = async () => {
        await fetch(`${API}/sell-nft`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, index: i })
        });
        loadBalance();
        openInventory.click();
      };

      inventoryList.appendChild(div);
    });
  };

  closeInventory.onclick = () => inventoryModal.style.display = "none";
});

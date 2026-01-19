document.addEventListener("DOMContentLoaded", () => {

  if (!window.Telegram || !window.Telegram.WebApp) {
    alert("Mini App должен запускаться через Telegram!");
    return;
  }

  const tg = window.Telegram.WebApp;
  tg.expand();

  const user = tg.initDataUnsafe.user || {};
  const userId = user.id;

  const balance = document.getElementById("balance");
  const balanceProfile = document.getElementById("balanceProfile");
  const deposit = document.getElementById("deposit");
  const openDaily = document.getElementById("openDaily");
  const connectWallet = document.getElementById("connectWallet");
  const openInventory = document.getElementById("openInventory");

  const btnHome = document.getElementById("btnHome");
  const btnProfile = document.getElementById("btnProfile");

  const subscribeModal = document.getElementById("subscribeModal");
  const subscribeBtn = document.getElementById("subscribeBtn");

  const caseModal = document.getElementById("caseModal");
  const closeCase = document.getElementById("closeCase");
  const openCaseBtn = document.getElementById("openCaseBtn");
  const resultText = document.getElementById("resultText");

  const inventoryModal = document.getElementById("inventoryModal");
  const closeInventory = document.getElementById("closeInventory");
  const inventoryList = document.getElementById("inventoryList");

  const API_URL = "https://kosmogift-worker.v-bot-2010.workers.dev";

  let balanceValue = 0;
  let walletAddress = null;
  let subscribed = false;

  // =======================
  // 1) ЗАГРУЗКА БАЛАНСА
  // =======================
  async function loadBalance() {
    try {
      const res = await fetch(API_URL + "/balance?user_id=" + userId);
      const data = await res.json();
      balanceValue = parseFloat(data.balance || 0);
      balance.innerText = balanceValue.toFixed(2) + " TON";
      balanceProfile.innerText = balanceValue.toFixed(2) + " TON";
    } catch (e) {
      console.log("Ошибка баланса", e);
    }
  }
  loadBalance();

  // =======================
  // 2) NAVIGATION
  // =======================
  btnHome.onclick = () => {
    document.getElementById("home").classList.add("active");
    document.getElementById("profile").classList.remove("active");
  };

  btnProfile.onclick = () => {
    document.getElementById("profile").classList.add("active");
    document.getElementById("home").classList.remove("active");
  };

  // =======================
  // 3) DEPOSIT
  // =======================
  deposit.addEventListener("click", async () => {
    const amount = parseFloat(prompt("Сколько TON пополнить? (мин. 0.1)"));

    if (!amount || isNaN(amount) || amount < 0.1) {
      return alert("Минимум 0.1 TON");
    }

    const paymentId = "pay_" + Date.now();

    const tonLink = `https://tonkeeper.com/transfer/UQAFXBXzBzau6ZCWzruiVrlTg3HAc8MF6gKIntqTLDifuWOi?amount=${amount}&text=${paymentId}`;

    tg.openUrl(tonLink);
    alert("Оплатите в Tonkeeper.");

    const interval = setInterval(async () => {
      const res = await fetch(API_URL + "/check-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_id: paymentId, amount })
      });

      const d = await res.json();

      if (d.ok) {
        clearInterval(interval);
        await loadBalance();
        alert("Пополнение успешно!");
      }
    }, 3000);
  });

  // =======================
  // 4) TONCONNECT
  // =======================
  connectWallet.addEventListener("click", async () => {
    const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
      manifestUrl: "https://kosmogift.pages.dev/tonconnect-manifest.json"
    });

    try {
      const wallet = await tonConnectUI.connect();
      walletAddress = wallet.account.address;
      alert("Кошелёк подключён: " + walletAddress);
      connectWallet.style.display = "none";
      document.getElementById("disconnectWallet").style.display = "block";
    } catch (e) {
      alert("Подключение кошелька отменено");
    }
  });

  // =======================
  // 5) SUBSCRIBE (1 раз)
  // =======================
  function showSubscribe() {
    if (subscribed) return;
    subscribeModal.style.display = "flex";
  }

  subscribeBtn.addEventListener("click", () => {
    tg.openUrl("https://t.me/KosmoGiftOfficial");
    subscribed = true;
    subscribeModal.style.display = "none";
  });

  // =======================
  // 6) DAILY CASE
  // =======================
  closeCase.addEventListener("click", () => {
    caseModal.style.display = "none";
  });

  openDaily.addEventListener("click", async () => {

    showSubscribe();

    const res = await fetch(API_URL + "/daily?user_id=" + userId);
    const d = await res.json();

    if (d.error === "already") {
      alert("Кейс можно открыть раз в 24 часа");
      return;
    }

    caseModal.style.display = "flex";
    resultText.innerText = "Нажми \"Открыть кейс\"";
  });

  openCaseBtn.addEventListener("click", async () => {

    const rnd = Math.random() * 100;

    let prize = null;

    if (rnd < 90) prize = { type: "ton", amount: 0.01 };
    else if (rnd < 95) prize = { type: "ton", amount: 0.02 };
    else if (rnd < 97.5) prize = { type: "ton", amount: 0.03 };
    else if (rnd < 98.5) prize = { type: "ton", amount: 0.04 };
    else if (rnd < 99.25) prize = { type: "ton", amount: 0.05 };
    else if (rnd < 99.75) prize = { type: "ton", amount: 0.06 };
    else if (rnd < 99.99) prize = { type: "ton", amount: 0.07 };
    else prize = { type: "nft", name: "lol pop" };

    if (prize.type === "ton") {
      await fetch(API_URL + "/add-ton", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, amount: prize.amount })
      });

      await loadBalance();
      resultText.innerText = `Вы выиграли ${prize.amount} TON`;
    }

    if (prize.type === "nft") {
      await fetch(API_URL + "/add-nft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, nft: { name: prize.name } })
      });

      resultText.innerText = `Вы выиграли NFT: ${prize.name}`;
    }
  });

  // =======================
  // 7) INVENTORY
  // =======================
  closeInventory.addEventListener("click", () => {
    inventoryModal.style.display = "none";
  });

  openInventory.addEventListener("click", async () => {
    inventoryModal.style.display = "flex";

    const res = await fetch(API_URL + "/inventory?user_id=" + userId);
    const d = await res.json();

    inventoryList.innerHTML = "";

    d.inventory.forEach((item, idx) => {
      const el = document.createElement("div");
      el.className = "inventoryItem";

      el.innerHTML = `
        <div>${item.name || item.type}</div>
        <button data-idx="${idx}" class="sellBtn">Продать</button>
      `;

      inventoryList.appendChild(el);
    });

    document.querySelectorAll(".sellBtn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const idx = btn.getAttribute("data-idx");
        const item = d.inventory[idx];
        const price = item.name === "lol pop" ? 3.26 : 0;

        await fetch(API_URL + "/sell-nft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, nft_name: item.name, price })
        });

        await loadBalance();
        alert("Продано!");
        openInventory.click();
      });
    });
  });

});

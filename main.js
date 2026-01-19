document.addEventListener("DOMContentLoaded", () => {
  // Проверка на Telegram
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

  const API_URL = "https://kosmogift-worker.v-bot-2010.workers.dev";

  let balanceValue = 0;

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

  // ---------------- DEPOSIT ----------------
  deposit.addEventListener("click", async () => {
    const amount = parseFloat(prompt("Сколько TON пополнить? (мин. 0.1)"));

    if (!amount || isNaN(amount) || amount < 0.1) {
      return alert("Минимум 0.1 TON");
    }

    const paymentId = "pay_" + Date.now();

    // Переводим TON в nanotons (тонкрипт)
    const nanotons = Math.floor(amount * 1e9);

    // Открываем Tonkeeper (правильный формат)
    const tonLink = `ton://transfer/UQAFXBXzBzau6ZCWzruiVrlTg3HAc8MF6gKIntqTLDifuWOi?amount=${nanotons}&text=${paymentId}`;

    tg.openUrl(tonLink);

    alert("Оплатите в Tonkeeper, затем дождитесь подтверждения.");

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

  // ---------------- CONNECT WALLET ----------------
  connectWallet.addEventListener("click", async () => {
    const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
      manifestUrl: "https://kosmogift.pages.dev/tonconnect-manifest.json"
    });

    try {
      const wallet = await tonConnectUI.connect();
      alert("Кошелёк подключён: " + wallet.account.address);
    } catch (e) {
      alert("Подключение кошелька отменено");
    }
  });

  // ---------------- OPEN DAILY ----------------
  openDaily.addEventListener("click", async () => {
    alert("Открытие кейса пока не подключено");
  });

  // ---------------- OPEN INVENTORY ----------------
  openInventory.addEventListener("click", async () => {
    alert("Инвентарь пока не подключен");
  });
});

document.addEventListener("DOMContentLoaded", () => {

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

  // ---------------- TONKEEPER (пополнение) ----------------
  deposit.addEventListener("click", async () => {
    const amount = parseFloat(prompt("Сколько TON пополнить? (мин. 0.1)"));

    if (!amount || isNaN(amount) || amount < 0.1) {
      return alert("Минимум 0.1 TON");
    }

    // создаём ID оплаты
    const paymentId = "pay_" + Date.now();

    // Открываем Tonkeeper с переводом
    const tonLink = `ton://transfer/UQAFXBXzBzau6ZCWzruiVrlTg3HAc8MF6gKIntqTLDifuWOi?amount=${amount}&text=${paymentId}`;

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

  // ---------------- CONNECT WALLET (TonConnect) ----------------
  connectWallet.addEventListener("click", async () => {
    try {
      const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
        manifestUrl: "https://kosmogift.pages.dev/tonconnect-manifest.json"
      });

      const wallet = await tonConnectUI.connect();
      const address = wallet.account.address;

      localStorage.setItem("ton_address", address);
      alert("Кошелёк подключён: " + address);

    } catch (e) {
      alert("Подключение кошелька отменено или ошибка");
      console.log("TonConnect error:", e);
    }
  });

  // ---------------- DAILY CASE ----------------
  openDaily.addEventListener("click", async () => {

    // проверка подписки (только показываем кнопку 1 раз)
    const subscribed = localStorage.getItem("subscribed");
    if (!subscribed) {
      if (confirm("Для открытия кейса нужно подписаться. Подписаться?")) {
        tg.openUrl("https://t.me/твой_канал"); // <-- Вставь сюда ссылку на канал
        localStorage.setItem("subscribed", "true");
      }
      return;
    }

    // запускаем кейс
    const prizes = [
      { name: "0.01 TON", chance: 90, type: "ton", amount: 0.01 },
      { name: "0.02 TON", chance: 5, type: "ton", amount: 0.02 },
      { name: "0.03 TON", chance: 2.5, type: "ton", amount: 0.03 },
      { name: "0.04 TON", chance: 1, type: "ton", amount: 0.04 },
      { name: "0.05 TON", chance: 0.75, type: "ton", amount: 0.05 },
      { name: "0.06 TON", chance: 0.5, type: "ton", amount: 0.06 },
      { name: "0.07 TON", chance: 0.24, type: "ton", amount: 0.07 },
      { name: "NFT lol pop", chance: 0.01, type: "nft", name2: "lol pop" }
    ];

    const random = Math.random() * 100;
    let sum = 0;
    let prize = null;

    for (let i = 0; i < prizes.length; i++) {
      sum += prizes[i].chance;
      if (random <= sum) {
        prize = prizes[i];
        break;
      }
    }

    if (!prize) prize = prizes[0];

    // Добавляем выигрыш
    if (prize.type === "ton") {
      await fetch(API_URL + "/add-ton", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, amount: prize.amount })
      });
      await loadBalance();
      alert("Вы выиграли: " + prize.name);
    } else {
      await fetch(API_URL + "/add-nft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, nft: { name: prize.name2, price: 3.26 } })
      });
      alert("Вы выиграли NFT: " + prize.name);
    }
  });

  // ---------------- INVENTORY ----------------
  openInventory.addEventListener("click", async () => {
    const res = await fetch(API_URL + "/inventory?user_id=" + userId);
    const data = await res.json();

    let list = "Инвентарь:\n";
    data.inventory.forEach((x, i) => {
      list += `${i+1}) ${x.name}\n`;
    });

    alert(list || "Инвентарь пуст");
  });

});

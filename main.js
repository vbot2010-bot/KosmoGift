document.addEventListener("DOMContentLoaded", () => {

  const tg = window.Telegram.WebApp;
  tg.expand();

  const user = tg.initDataUnsafe.user || {};

  // элементы
  const avatar = document.getElementById("avatar");
  const profileAvatar = document.getElementById("profileAvatar");
  const username = document.getElementById("username");

  const btnHome = document.getElementById("btnHome");
  const btnProfile = document.getElementById("btnProfile");

  const connectWallet = document.getElementById("connectWallet");
  const disconnectWallet = document.getElementById("disconnectWallet");

  const deposit = document.getElementById("deposit");
  const openDaily = document.getElementById("openDaily");
  const openInventory = document.getElementById("openInventory");

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

  // аватар и ник
  avatar.src = user.photo_url || "";
  profileAvatar.src = user.photo_url || "";
  username.innerText = user.username || "Telegram User";

  // nav
  btnHome.onclick = () => switchPage("home");
  btnProfile.onclick = () => switchPage("profile");

  function switchPage(id) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById(id).classList.add("active");
  }

  // TONCONNECT
  const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
    manifestUrl: "https://kosmogift.pages.dev/tonconnect-manifest.json"
  });

  connectWallet.onclick = async () => {
    try {
      const wallet = await tonConnectUI.connect();
      walletAddress = wallet.account.address;
      connectWallet.style.display = "none";
      disconnectWallet.style.display = "block";
      alert("Кошелёк подключён: " + walletAddress);
    } catch (e) {
      alert("Подключение кошелька отменено");
    }
  };

  disconnectWallet.onclick = async () => {
    await tonConnectUI.disconnect();
    walletAddress = null;
    connectWallet.style.display = "block";
    disconnectWallet.style.display = "none";
  };

  tonConnectUI.onStatusChange(wallet => {
    if (wallet) {
      walletAddress = wallet.account.address;
      connectWallet.style.display = "none";
      disconnectWallet.style.display = "block";
    } else {
      walletAddress = null;
      connectWallet.style.display = "block";
      disconnectWallet.style.display = "none";
    }
  });

  // баланс
  async function loadBalance() {
    try {
      const res = await fetch(API_URL + "/balance?user_id=" + user.id);
      const data = await res.json();
      balanceValue = parseFloat(data.balance || 0);
      document.getElementById("balance").innerText = balanceValue.toFixed(2) + " TON";
      document.getElementById("balanceProfile").innerText = balanceValue.toFixed(2) + " TON";
    } catch (e) {
      console.log("Ошибка баланса", e);
    }
  }
  loadBalance();

  // ---------- DEPOSIT (через TONCONNECT) ----------
  deposit.onclick = async () => {
    const amount = parseFloat(prompt("Сколько TON пополнить? (мин. 0.1)"));
    if (!amount || isNaN(amount) || amount < 0.1) {
      return alert("Минимум 0.1 TON");
    }

    if (!walletAddress) {
      return alert("Сначала подключите кошелёк");
    }

    try {
      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [{
          address: "UQAFXBXzBzau6ZCWzruiVrlTg3HAc8MF6gKIntqTLDifuWOi",
          amount: (amount * 1e9).toString()
        }]
      });

      // просто обновляем баланс (т.к. пополнение через твой кошелек)
      await loadBalance();
      alert("Пополнение прошло успешно!");
    } catch (e) {
      alert("Оплата отменена или ошибка");
    }
  };

  // ---------- SUBSCRIBE (1 раз) ----------
  let subscribed = localStorage.getItem("subscribed") === "true";

  function showSubscribe() {
    if (subscribed) return;
    subscribeModal.style.display = "flex";
  }

  subscribeBtn.addEventListener("click", () => {
    tg.openUrl("https://t.me/KosmoGiftOfficial");
    subscribed = true;
    localStorage.setItem("subscribed", "true");
    subscribeModal.style.display = "none";
  });

  // ---------- DAILY CASE ----------
  closeCase.addEventListener("click", () => {
    caseModal.style.display = "none";
  });

  openDaily.addEventListener("click", async () => {
    showSubscribe();

    const res = await fetch(API_URL + "/daily?user_id=" + user.id);
    const d = await res.json();

    if (d.error === "already") {
      return alert("Кейс можно открыть раз в 24 часа");
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
        body: JSON.stringify({ user_id: user.id, amount: prize.amount })
      });
      await loadBalance();
      resultText.innerText = `Вы выиграли ${prize.amount} TON`;
    } else {
      await fetch(API_URL + "/add-nft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, nft: { name: prize.name } })
      });
      resultText.innerText = `Вы выиграли NFT: ${prize.name}`;
    }
  });

  // ---------- INVENTORY ----------
  closeInventory.addEventListener("click", () => {
    inventoryModal.style.display = "none";
  });

  openInventory.addEventListener("click", async () => {
    inventoryModal.style.display = "flex";

    const res = await fetch(API_URL + "/inventory?user_id=" + user.id);
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
          body: JSON.stringify({ user_id: user.id, nft_name: item.name, price })
        });

        await loadBalance();
        alert("Продано!");
        openInventory.click();
      });
    });
  });

});

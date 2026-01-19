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
  const openCaseBtn = document.getElementById("openCaseBtn");
  const strip = document.getElementById("strip");
  const resultText = document.getElementById("resultText");
  const closeCase = document.getElementById("closeCase");

  const inventoryModal = document.getElementById("inventoryModal");
  const closeInventory = document.getElementById("closeInventory");
  const inventoryList = document.getElementById("inventoryList");

  const API_URL = "https://kosmogift-worker.v-bot-2010.workers.dev";

  let balanceValue = 0;
  let inventory = [];

  const prizes = [
    { name: "0.01 TON", value: 0.01 },
    { name: "0.02 TON", value: 0.02 },
    { name: "0.03 TON", value: 0.03 },
    { name: "0.04 TON", value: 0.04 },
    { name: "0.05 TON", value: 0.05 },
    { name: "0.06 TON", value: 0.06 },
    { name: "0.07 TON", value: 0.07 },
    { name: "NFT lol pop", nft: true, price: 3.26 }
  ];

  const walletAddress = "UQAFXBXzBzau6ZCWzruiVrlTg3HAc8MF6gKIntqTLDifuWOi";

  // ---------------- BALANCE ----------------
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

  async function loadInventory() {
    const res = await fetch(API_URL + "/inventory?user_id=" + userId);
    const data = await res.json();
    inventory = data.inventory || [];
  }

  loadBalance();
  loadInventory();

  // ---------------- NAV ----------------
  btnHome.onclick = () => {
    document.getElementById("home").classList.add("active");
    document.getElementById("profile").classList.remove("active");
  };

  btnProfile.onclick = () => {
    document.getElementById("profile").classList.add("active");
    document.getElementById("home").classList.remove("active");
  };

  // ---------------- SUBSCRIBE ----------------
  const subscribed = localStorage.getItem("subscribed") === "true";

  function showSubscribe() {
    if (localStorage.getItem("subscribed") === "true") return;
    subscribeModal.style.display = "flex";
  }

  subscribeBtn.onclick = () => {
    tg.openUrl("https://t.me/KosmoGiftOfficial");
    localStorage.setItem("subscribed", "true");
    subscribeModal.style.display = "none";
    openCaseModal();
  };

  subscribeModal.onclick = (e) => {
    if (e.target === subscribeModal) subscribeModal.style.display = "none";
  };

  // ---------------- CASE ----------------
  function buildStrip() {
    strip.innerHTML = "";
    for (let i = 0; i < 8; i++) {
      for (let p of prizes) {
        const div = document.createElement("div");
        div.className = "drop";
        div.innerText = p.name;
        strip.appendChild(div);
      }
    }
  }

  function choosePrize() {
    const rnd = Math.random() * 100;
    if (rnd < 90) return prizes[0];
    if (rnd < 95) return prizes[1];
    if (rnd < 97.5) return prizes[2];
    if (rnd < 98.5) return prizes[3];
    if (rnd < 99.25) return prizes[4];
    if (rnd < 99.75) return prizes[5];
    if (rnd < 99.99) return prizes[6];
    return prizes[7];
  }

  function openCaseModal() {
    caseModal.style.display = "flex";
    buildStrip();
    resultText.innerText = "Нажми \"Открыть кейс\"";
  }

  openDaily.addEventListener("click", async () => {
    // 1 раз подписка
    if (localStorage.getItem("subscribed") !== "true") {
      showSubscribe();
      return;
    }
    openCaseModal();
  });

  caseModal.onclick = (e) => {
    if (e.target === caseModal) caseModal.style.display = "none";
  };

  closeCase.onclick = () => caseModal.style.display = "none";

  openCaseBtn.onclick = async () => {
    openCaseBtn.disabled = true;

    const prize = choosePrize();

    const targetIndex = prizes.findIndex(p => p.name === prize.name);
    const itemWidth = 200 + 18;
    const totalItems = prizes.length * 8;
    const targetPos = (totalItems / 2 + targetIndex) * itemWidth;
    const end = -targetPos;

    strip.style.transition = "transform 5s cubic-bezier(0.2, 0.8, 0.2, 1)";
    strip.style.transform = `translateX(${end}px)`;

    strip.addEventListener("transitionend", async () => {
      strip.style.transition = "none";
      resultText.innerText = "Выпало: " + prize.name;

      if (prize.nft) {
        await fetch(API_URL + "/add-nft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, nft: prize })
        });
      } else {
        await fetch(API_URL + "/add-ton", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, amount: prize.value })
        });
        await loadBalance();
      }

      openCaseBtn.disabled = false;
    }, { once: true });
  };

  // ---------------- INVENTORY ----------------
  openInventory.addEventListener("click", async () => {
    await loadInventory();
    inventoryModal.style.display = "flex";
    renderInventory();
  });

  inventoryModal.onclick = (e) => {
    if (e.target === inventoryModal) inventoryModal.style.display = "none";
  };

  closeInventory.onclick = () => inventoryModal.style.display = "none";

  function renderInventory() {
    inventoryList.innerHTML = "";
    if (inventory.length === 0) {
      inventoryList.innerHTML = "<div>Инвентарь пуст</div>";
      return;
    }

    inventory.forEach(i => {
      const div = document.createElement("div");
      div.className = "itemCard";
      div.innerHTML = `
        <div>${i.name}</div>
        <div>Цена: ${i.price} TON</div>
        <button class="sellBtn">Продать</button>
      `;
      inventoryList.appendChild(div);

      div.querySelector(".sellBtn").onclick = async () => {
        const res = await fetch(API_URL + "/sell-nft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, nft_name: i.name, price: i.price })
        });
        const data = await res.json();
        if (!data.error) {
          inventory = data.inventory;
          await loadBalance();
          renderInventory();
        }
      };
    });
  }

  // ---------------- DEPOSIT ----------------
  deposit.addEventListener("click", async () => {
    const amount = parseFloat(prompt("Сколько TON пополнить? (мин. 0.1)"));

    if (!amount || isNaN(amount) || amount < 0.1) {
      return alert("Минимум 0.1 TON");
    }

    const paymentId = "pay_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);

    const nanotons = Math.floor(amount * 1e9);
    const tonLink = `ton://transfer/${walletAddress}?amount=${nanotons}&text=${paymentId}`;

    tg.openUrl(tonLink);

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

});

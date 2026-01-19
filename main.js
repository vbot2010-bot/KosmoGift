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
  const CHANNEL_URL = "https://t.me/KosmoGiftOfficial";
  const WALLET_ADDRESS = "UQAFXBXzBzau6ZCWzruiVrlTg3HAc8MF6gKIntqTLDifuWOi";

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

  async function loadBalance() {
    try {
      const res = await fetch(`${API_URL}/balance?user_id=${userId}`);
      const data = await res.json();
      balanceValue = parseFloat(data.balance || 0);
      balance.innerText = balanceValue.toFixed(2) + " TON";
      balanceProfile.innerText = balanceValue.toFixed(2) + "TON";
    } catch (e) {
      console.error("Ошибка баланса:", e);
    }
  }
  loadBalance();

  async function loadInventory() {
    const res = await fetch(`${API_URL}/inventory?user_id=${userId}`);
    const data = await res.json();
    inventory = data.inventory || [];
  }
  loadInventory();

  // ========== Navigation ==========
  btnHome.onclick = () => {
    document.getElementById("home").classList.add("active");
    document.getElementById("profile").classList.remove("active");
  };
  btnProfile.onclick = () => {
    document.getElementById("profile").classList.add("active");
    document.getElementById("home").classList.remove("active");
  };

  // ========== Subscribe Modal ==========
  function showSubscribe() {
    if (localStorage.getItem("subscribed") === "true") return;
    subscribeModal.style.display = "flex";
  }

  subscribeBtn.onclick = () => {
    tg.openUrl(CHANNEL_URL);
    localStorage.setItem("subscribed", "true");
    subscribeModal.style.display = "none";
    openCaseModal();
  };

  subscribeModal.onclick = (e) => {
    if (e.target === subscribeModal) {
      subscribeModal.style.display = "none";
    }
  };

  // ========== Case Modal ==========
  function buildStrip() {
    strip.innerHTML = "";
    for (let i = 0; i < 10; i++) {
      for (let p of prizes) {
        const div = document.createElement("div");
        div.className = "drop";
        div.innerText = p.name;
        strip.appendChild(div);
      }
    }
  }

  function openCaseModal() {
    buildStrip();
    resultText.innerText = "Нажми \"Открыть кейс\"";
    caseModal.style.display = "flex";
  }

  openDaily.onclick = async () => {
    showSubscribe();

    const res = await fetch(`${API_URL}/daily?user_id=${userId}`);
    const d = await res.json();
    if (d.error === "already") {
      alert("Кейс можно открыть только раз в 24 часа");
      return;
    }

    openCaseModal();
  };

  caseModal.onclick = (e) => {
    if (e.target === caseModal) caseModal.style.display = "none";
  };

  closeCase.onclick = () => caseModal.style.display = "none";

  openCaseBtn.onclick = async () => {
    openCaseBtn.disabled = true;

    const rnd = Math.random() * 100;
    let prize = null;
    if (rnd < 90) prize = prizes[0];
    else if (rnd < 95) prize = prizes[1];
    else if (rnd < 97.5) prize = prizes[2];
    else if (rnd < 98.5) prize = prizes[3];
    else if (rnd < 99.25) prize = prizes[4];
    else if (rnd < 99.75) prize = prizes[5];
    else if (rnd < 99.99) prize = prizes[6];
    else prize = prizes[7];

    const idx = prizes.findIndex(p => p.name === prize.name);
    const itemWidth = 200 + 18;
    const totalItems = prizes.length * 10;
    const targetPos = (totalItems / 2 + idx) * itemWidth;
    const end = -targetPos;

    strip.style.transition = "transform 4s ease-out";
    strip.style.transform = `translateX(${end}px)`;

    strip.addEventListener("transitionend", async () => {
      if (prize.nft) {
        await fetch(`${API_URL}/add-nft`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, nft: prize })
        });
        alert(`Вы выиграли NFT: ${prize.name}`);
      } else {
        await fetch(`${API_URL}/add-ton`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, amount: prize.value })
        });
        await loadBalance();
        alert(`Вы выиграли ${prize.value} TON`);
      }
      openCaseBtn.disabled = false;
    }, { once: true });
  };

  // ========== Inventory ==========
  openInventory.onclick = async () => {
    await loadInventory();
    inventoryModal.style.display = "flex";
    inventoryList.innerHTML = "";

    if (inventory.length === 0) {
      inventoryList.innerHTML = "<div>Инвентарь пуст</div>";
      return;
    }

    inventory.forEach((item, index) => {
      const div = document.createElement("div");
      div.className = "inventoryItem";
      div.innerHTML = `
        <span>${item.name}</span>
        <button class="sellBtn" data-idx="${index}">Продать</button>
      `;
      inventoryList.appendChild(div);
    });

    inventoryList.querySelectorAll(".sellBtn").forEach(btn => {
      btn.onclick = async () => {
        const idx = btn.getAttribute("data-idx");
        const item = inventory[idx];
        const price = item.price ?? 0;

        await fetch(`${API_URL}/sell-nft`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, nft_name: item.name, price })
        });

        await loadBalance();
        openInventory.click(); // обновить
      };
    });
  };

  inventoryModal.onclick = (e) => {
    if (e.target === inventoryModal) inventoryModal.style.display = "none";
  };
  closeInventory.onclick = () => inventoryModal.style.display = "none";

  // ========== Deposit (Tonkeeper) ==========
  deposit.onclick = async () => {
    const amount = parseFloat(prompt("Сколько TON пополнить? (мин. 0.1)"));
    if (!amount || isNaN(amount) || amount < 0.1) return alert("Минимум 0.1 TON");

    const paymentId = "pay_" + Date.now() + "_" + Math.random().toString(36).substr(2,5);

    const tonLink = `ton://transfer/${WALLET_ADDRESS}?amount=${amount}&text=${paymentId}`;
    tg.openUrl(tonLink);

    const interval = setInterval(async () => {
      const res = await fetch(`${API_URL}/check-payment`, {
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
  };

  // ========== TonConnect Wallet ========== 
  connectWallet.onclick = async () => {
    const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
      manifestUrl: "https://kosmogift.pages.dev/tonconnect-manifest.json"
    });

    try {
      const wallet = await tonConnectUI.connect();
      alert("Кошелёк подключён: " + wallet.account.address);
    } catch (e) {
      alert("Подключение кошелька отменено");
    }
  };

});

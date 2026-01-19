document.addEventListener("DOMContentLoaded", () => {
  const tg = window.Telegram.WebApp;
  tg.expand();

  const user = tg.initDataUnsafe.user || {};
  const userId = user.id;

  const avatar = document.getElementById("avatar");
  const profileAvatar = document.getElementById("profileAvatar");
  const username = document.getElementById("username");

  const balance = document.getElementById("balance");
  const balanceProfile = document.getElementById("balanceProfile");

  const deposit = document.getElementById("deposit");
  const openDaily = document.getElementById("openDaily");
  const openInventory = document.getElementById("openInventory");
  const connectWallet = document.getElementById("connectWallet");
  const disconnectWallet = document.getElementById("disconnectWallet");

  const btnHome = document.getElementById("btnHome");
  const btnProfile = document.getElementById("btnProfile");

  const caseModal = document.getElementById("caseModal");
  const strip = document.getElementById("strip");
  const openCaseBtn = document.getElementById("openCaseBtn");
  const resultText = document.getElementById("resultText");
  const closeCase = document.getElementById("closeCase");

  const inventoryModal = document.getElementById("inventoryModal");
  const inventoryList = document.getElementById("inventoryList");
  const closeInventory = document.getElementById("closeInventory");

  const subscribeModal = document.getElementById("subscribeModal");
  const subscribeBtn = document.getElementById("subscribeBtn");

  const API_URL = "https://kosmogift-worker.v-bot-2010.workers.dev";

  let balanceValue = 0;
  let inventory = [];
  let subscribed = localStorage.getItem("subscribed") === "true";

  avatar.src = user.photo_url || "";
  profileAvatar.src = user.photo_url || "";
  username.innerText = user.username || "Telegram User";

  const prizes = [
    { name: "0.01 TON", type: "ton", value: 0.01 },
    { name: "0.02 TON", type: "ton", value: 0.02 },
    { name: "0.03 TON", type: "ton", value: 0.03 },
    { name: "0.04 TON", type: "ton", value: 0.04 },
    { name: "0.05 TON", type: "ton", value: 0.05 },
    { name: "0.06 TON", type: "ton", value: 0.06 },
    { name: "NFT lol pop", type: "nft", price: 3.26 },
  ];

  async function loadBalance() {
    const res = await fetch(API_URL + "/balance?user_id=" + userId);
    const data = await res.json();
    balanceValue = parseFloat(data.balance || 0);
    balance.innerText = balanceValue.toFixed(2) + " TON";
    balanceProfile.innerText = balanceValue.toFixed(2) + " TON";
  }

  async function loadInventory() {
    const res = await fetch(API_URL + "/inventory?user_id=" + userId);
    const data = await res.json();
    inventory = data.inventory || [];
  }

  async function renderInventory() {
    inventoryList.innerHTML = "";

    if (inventory.length === 0) {
      inventoryList.innerHTML = "<div>Инвентарь пуст</div>";
      return;
    }

    inventory.forEach(item => {
      const div = document.createElement("div");
      div.className = "itemCard";
      div.innerHTML = `
        <div>${item.name}</div>
        <div>Цена: ${item.price} TON</div>
        <button class="sellBtn">Продать</button>
      `;
      inventoryList.appendChild(div);

      div.querySelector(".sellBtn").onclick = async () => {
        const res = await fetch(API_URL + "/sell-nft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            nft_name: item.name,
            price: item.price
          })
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

  function switchPage(id) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById(id).classList.add("active");
  }

  btnHome.onclick = () => switchPage("home");
  btnProfile.onclick = () => switchPage("profile");

  loadBalance();
  loadInventory();

  // ---------------- DEPOSIT ----------------
  deposit.onclick = async () => {
    const amount = parseFloat(prompt("Сколько TON пополнить? (мин. 0.1)"));
    if (!amount || isNaN(amount) || amount < 0.1) return alert("Минимум 0.1 TON");

    const paymentId = "pay_" + Date.now();

    const tonLink = `ton://transfer/UQAFXBXzBzau6ZCWzruiVrlTg3HAc8MF6gKIntqTLDifuWOi?amount=${amount}&text=${paymentId}`;

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
  };

  // ---------------- CONNECT WALLET ----------------
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

  disconnectWallet.onclick = () => {
    alert("Отключение пока не реализовано");
  };

  // ---------------- DAILY CASE ----------------
  openDaily.onclick = async () => {
    if (!subscribed) {
      subscribeModal.style.display = "flex";
      return;
    }

    caseModal.style.display = "flex";
    buildStrip();
  };

  subscribeBtn.onclick = () => {
    tg.openLink("https://t.me/KosmoGiftOfficial");
    subscribed = true;
    localStorage.setItem("subscribed", "true");
    subscribeModal.style.display = "none";
    caseModal.style.display = "flex";
    buildStrip();
  };

  subscribeModal.onclick = (e) => {
    if (e.target === subscribeModal) subscribeModal.style.display = "none";
  };

  caseModal.onclick = (e) => {
    if (e.target === caseModal) caseModal.style.display = "none";
  };

  closeCase.onclick = () => caseModal.style.display = "none";

  function buildStrip() {
    strip.innerHTML = "";
    for (let i = 0; i < 8; i++) {
      prizes.forEach(p => {
        const div = document.createElement("div");
        div.className = "drop";
        div.innerText = p.name;
        strip.appendChild(div);
      });
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
    return prizes[6];
  }

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

      if (prize.type === "nft") {
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
  openInventory.onclick = async () => {
    await loadInventory();
    inventoryModal.style.display = "flex";
    renderInventory();
  };

  closeInventory.onclick = () => inventoryModal.style.display = "none";

});

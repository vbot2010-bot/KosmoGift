document.addEventListener("DOMContentLoaded", () => {
  const tg = window.Telegram.WebApp;
  tg.expand();

  const user = tg.initDataUnsafe.user || {};
  const userId = String(user.id);

  const API = "https://kosmogift-worker.v-bot-2010.workers.dev";

  const avatar = document.getElementById("avatar");
  const profileAvatar = document.getElementById("profileAvatar");
  const username = document.getElementById("username");

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
  const closeCase = document.getElementById("closeCase");
  const openCaseBtn = document.getElementById("openCaseBtn");
  const strip = document.getElementById("strip");

  const rewardModal = document.getElementById("rewardModal");
  const rewardText = document.getElementById("rewardText");
  const rewardBtnOk = document.getElementById("rewardBtnOk");

  const inventoryModal = document.getElementById("inventoryModal");
  const inventoryList = document.getElementById("inventoryList");
  const closeInventory = document.getElementById("closeInventory");

  const balanceEl = document.getElementById("balance");
  const balanceProfile = document.getElementById("balanceProfile");

  const subscribeModal = document.getElementById("subscribeModal");
  const subscribeBtn = document.getElementById("subscribeBtn");

  const timerBlock = document.getElementById("timerBlock");
  const timerText = document.getElementById("timerText");

  let subscribeShown = false;
  let isSpinning = false;
  let currentCase = "daily";
  let currentBalance = 0;

  avatar.src = user.photo_url || "";
  profileAvatar.src = user.photo_url || "";
  username.innerText = user.username || "Telegram User";

  btnHome.onclick = () => switchPage("home");
  btnProfile.onclick = () => switchPage("profile");

  function switchPage(id) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById(id).classList.add("active");
  }

  // TON CONNECT
  const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
    manifestUrl: "https://kosmogift.pages.dev/tonconnect-manifest.json"
  });

  connectWallet.onclick = async () => {
    await tonConnectUI.connectWallet();
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

  // пополнение
  deposit.onclick = () => {
    modal.style.display = "flex";
  };

  closeModal.onclick = () => {
    modal.style.display = "none";
  };

  window.onclick = (event) => {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  };

  pay.onclick = async () => {
    const amount = parseFloat(amountInput.value);

    if (!amount || amount < 0.1) {
      return alert("Минимум 0.1 TON");
    }

    await tonConnectUI.sendTransaction({
      validUntil: Math.floor(Date.now() / 1000) + 600,
      messages: [{
        address: "UQAFXBXzBzau6ZCWzruiVrlTg3HAc8MF6gKIntqTLDifuWOi",
        amount: (amount * 1e9).toString()
      }]
    });

    modal.style.display = "none";
  };

  // BALANCE
  async function updateBalance() {
    const res = await fetch(`${API}/balance?user=${userId}`);
    const data = await res.json();
    currentBalance = data.balance;

    balanceEl.innerText = data.balance.toFixed(2) + " TON";
    balanceProfile.innerText = data.balance.toFixed(2) + " TON";
  }

  updateBalance();
  setInterval(updateBalance, 5000);

  // ====== ПРИЗЫ DAILY ======
  const dailyPrizes = [
    { type: "ton", value: 0.01, chance: 90 },
    { type: "ton", value: 0.02, chance: 5 },
    { type: "ton", value: 0.03, chance: 2.5 },
    { type: "ton", value: 0.04, chance: 1 },
    { type: "ton", value: 0.05, chance: 0.75 },
    { type: "ton", value: 0.06, chance: 0.5 },
    { type: "ton", value: 0.07, chance: 0.24 },
    { type: "nft", value: "lol pop", chance: 0.01 }
  ];

  // ====== ПРИЗЫ UNLUCKY ======
  const unluckyPrizes = [
    { type: "ton", value: 0.2, chance: 70 },
    { type: "ton", value: 0.35, chance: 19 },
    { type: "ton", value: 0.6, chance: 7 },
    { type: "ton", value: 1, chance: 2.5 },
    { type: "nft", value: "Desk calendar", chance: 0.5 },
    { type: "nft", value: "Top hat", chance: 0.25 },
    { type: "nft", value: "Signet ring", chance: 0.15 },
    { type: "nft", value: "durov's cap", chance: 0.001 }
  ];

  function randomPrize(prizeArray) {
    const r = Math.random() * 100;
    let sum = 0;
    for (const p of prizeArray) {
      sum += p.chance;
      if (r <= sum) return p;
    }
    return prizeArray[0];
  }

  // ТАЙМЕР DAILY
  const TIMER_KEY = "case_timer_end";
  const ONE_DAY = 24 * 60 * 60 * 1000;

  function setTimer() {
    const endTime = Date.now() + ONE_DAY;
    localStorage.setItem(TIMER_KEY, endTime);
    updateTimer();
  }

  function updateTimer() {
    const endTime = localStorage.getItem(TIMER_KEY);

    if (!endTime) {
      timerBlock.style.display = "none";
      openDaily.style.display = "block";
      return;
    }

    const remaining = endTime - Date.now();

    if (remaining <= 0) {
      localStorage.removeItem(TIMER_KEY);
      timerBlock.style.display = "none";
      openDaily.style.display = "block";
      return;
    }

    openDaily.style.display = "none";
    timerBlock.style.display = "flex";

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

    timerText.innerText =
      String(hours).padStart(2, "0") + ":" +
      String(minutes).padStart(2, "0") + ":" +
      String(seconds).padStart(2, "0");
  }

  setInterval(updateTimer, 1000);
  updateTimer();

  // OPEN CASE
  openDaily.onclick = async () => {
    currentCase = "daily";
    if (!subscribeShown) {
      subscribeModal.style.display = "flex";
      subscribeShown = true;
      return;
    }
    openCase("Daily Case");
  };

  openUnlucky.onclick = async () => {
    currentCase = "unlucky";

    if (currentBalance < 0.25) {
      alert("Недостаточно средств");
      return;
    }

    openCase("Unlucky Case");
  };

  function openCase(title) {
    document.querySelector(".caseTitle").innerText = title;
    caseModal.style.display = "flex";
  }

  closeCase.onclick = () => caseModal.style.display = "none";

  subscribeBtn.onclick = () => {
    window.open("https://t.me/KosmoGiftOfficial", "_blank");
    subscribeModal.style.display = "none";
    caseModal.style.display = "flex";
  };

  // OPEN CASE SPIN
  openCaseBtn.onclick = async () => {
    if (isSpinning) return;
    isSpinning = true;

    // Списание баланса
    if (currentCase === "unlucky") {
      await fetch(`${API}/add-balance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: userId, amount: -0.25 })
      });
      await updateBalance();
    }

    // заранее выбираем приз
    const prize = currentCase === "daily"
      ? randomPrize(dailyPrizes)
      : randomPrize(unluckyPrizes);

    strip.innerHTML = "";

    // Рандомные ячейки
    const itemsCount = 80;
    const stripItems = [];

    for (let i = 0; i < itemsCount; i++) {
      const item = (currentCase === "daily")
        ? dailyPrizes[Math.floor(Math.random() * dailyPrizes.length)]
        : unluckyPrizes[Math.floor(Math.random() * unluckyPrizes.length)];
      stripItems.push(item);
    }

    // вставляем приз в конце
    stripItems.push(prize);

    stripItems.forEach(item => {
      const div = document.createElement("div");
      div.className = "drop";
      div.innerText = item.type === "ton" ? `${item.value} TON` : item.value;
      strip.appendChild(div);
    });

    const itemWidth = 218;
    const targetIndex = stripItems.length - 1;
    const stripWrapWidth = document.querySelector(".stripWrap").clientWidth;
    const targetX = targetIndex * itemWidth - (stripWrapWidth / 2 - itemWidth / 2);

    strip.style.transition = "none";
    strip.style.transform = "translateX(0px)";

    setTimeout(() => {
      strip.style.transition = "transform 7s cubic-bezier(.17,.67,.3,1)";
      strip.style.transform = `translateX(-${targetX}px)`;
    }, 20);

    setTimeout(async () => {
      isSpinning = false;

      if (currentCase === "daily") setTimer();

      // автомат начисление
      if (prize.type === "ton") {
        await fetch(`${API}/add-balance`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user: userId, amount: prize.value })
        });
        await updateBalance();
      }

      if (prize.type === "nft") {
        await fetch(`${API}/add-nft`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user: userId, nft: { name: prize.value, price: 3.27 } })
        });
      }

      rewardModal.style.display = "flex";
      rewardText.innerText = prize.type === "ton"
        ? `Вы выиграли ${prize.value} TON`
        : `Вы выиграли NFT "${prize.value}"`;

      rewardBtnOk.innerText = prize.type === "ton" ? "OK" : "В инвентарь";

      rewardBtnOk.onclick = () => {
        rewardModal.style.display = "none";
      };

    }, 7200);
  };

  // INVENTORY
  document.getElementById("openInventory").onclick = async () => {
    const res = await fetch(`${API}/inventory?user=${userId}`);
    const inv = await res.json();

    inventoryList.innerHTML = "";
    inv.forEach((item, index) => {
      const card = document.createElement("div");
      card.className = "itemCard";
      card.innerHTML = `
        <div>${item.name}</div>
        <div>Цена: ${item.price} TON</div>
        <button data-index="${index}" class="sellBtn">Продать</button>
      `;
      inventoryList.appendChild(card);
    });

    document.querySelectorAll(".sellBtn").forEach(btn => {
      btn.onclick = async () => {
        const idx = btn.dataset.index;
        await fetch(`${API}/sell-nft`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user: userId, index: idx })
        });
        updateBalance();
        document.getElementById("openInventory").click();
      };
    });

    inventoryModal.style.display = "flex";
  };

  closeInventory.onclick = () => inventoryModal.style.display = "none";
});

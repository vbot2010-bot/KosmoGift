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

  const caseModal = document.getElementById("caseModal");
  const closeCase = document.getElementById("closeCase");
  const openCaseBtn = document.getElementById("openCaseBtn");
  const strip = document.getElementById("strip");

  const rewardModal = document.getElementById("rewardModal");
  const rewardText = document.getElementById("rewardText");
  const rewardBtnTon = document.getElementById("rewardBtnTon");
  const rewardBtnSell = document.getElementById("rewardBtnSell");
  const rewardBtnInv = document.getElementById("rewardBtnInv");

  const inventoryModal = document.getElementById("inventoryModal");
  const inventoryList = document.getElementById("inventoryList");
  const closeInventory = document.getElementById("closeInventory");

  const balanceEl = document.getElementById("balance");
  const balanceProfile = document.getElementById("balanceProfile");

  const subscribeModal = document.getElementById("subscribeModal");
  const subscribeBtn = document.getElementById("subscribeBtn");

  let subscribeShown = false;

  // аватар и ник
  avatar.src = user.photo_url || "";
  profileAvatar.src = user.photo_url || "";
  username.innerText = user.username || "Telegram User";

  // навигация
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

  // ================= BALANCE =================
  async function updateBalance() {
    const res = await fetch(`${API}/balance?user=${userId}`);
    const data = await res.json();
    balanceEl.innerText = data.balance.toFixed(2) + " TON";
    balanceProfile.innerText = data.balance.toFixed(2) + " TON";
  }

  updateBalance();
  setInterval(updateBalance, 5000);

  // ================= DAILY CASE =================
  const prizes = [
    { type: "ton", value: 0.01, chance: 90 },
    { type: "ton", value: 0.02, chance: 5 },
    { type: "ton", value: 0.03, chance: 2.5 },
    { type: "ton", value: 0.04, chance: 1 },
    { type: "ton", value: 0.05, chance: 0.75 },
    { type: "ton", value: 0.06, chance: 0.5 },
    { type: "ton", value: 0.07, chance: 0.24 },
    { type: "nft", value: "lol pop", chance: 0.01 }
  ];

  function randomPrizeByChance() {
    const r = Math.random() * 100;
    let sum = 0;
    for (const p of prizes) {
      sum += p.chance;
      if (r <= sum) return p;
    }
    return prizes[0];
  }

  openDaily.onclick = async () => {
    if (!subscribeShown) {
      subscribeModal.style.display = "flex";
      subscribeShown = true;
      return;
    }
    caseModal.style.display = "flex";
  };

  closeCase.onclick = () => caseModal.style.display = "none";

  subscribeBtn.onclick = () => {
    window.open("https://t.me/KosmoGiftOfficial", "_blank");
    subscribeModal.style.display = "none";
    caseModal.style.display = "flex";
  };

  openCaseBtn.onclick = async () => {
    const prize = randomPrizeByChance();

    // Создаем рулетку из всего списка
    strip.innerHTML = "";
    const stripItems = [];
    for (let i = 0; i < 30; i++) {
      for (const p of prizes) {
        stripItems.push(p);
        const div = document.createElement("div");
        div.className = "drop";
        div.innerText = p.type === "ton" ? `${p.value} TON` : p.value;
        strip.appendChild(div);
      }
    }

    // находим случайную позицию в stripItems где такой приз есть
    const positions = stripItems
      .map((p, idx) => ({ p, idx }))
      .filter(x => x.p.type === prize.type && x.p.value === prize.value);

    const stopIndex = positions[Math.floor(Math.random() * positions.length)].idx;

    const offset = stopIndex * 220;

    strip.style.transition = "transform 5s cubic-bezier(.17,.67,.3,1)";
    strip.style.transform = `translateX(-${offset}px)`;

    setTimeout(async () => {
      const finalPrize = stripItems[stopIndex];

      rewardModal.style.display = "flex";
      rewardText.innerText = finalPrize.type === "ton"
        ? `Вы выиграли ${finalPrize.value} TON`
        : `Вы выиграли NFT "${finalPrize.value}"`;

      rewardBtnTon.style.display = finalPrize.type === "ton" ? "block" : "none";
      rewardBtnSell.style.display = finalPrize.type === "nft" ? "block" : "none";
      rewardBtnInv.style.display = finalPrize.type === "nft" ? "block" : "none";

      rewardBtnTon.onclick = async () => {
        await fetch(`${API}/add-balance`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user: userId, amount: finalPrize.value })
        });
        rewardModal.style.display = "none";
        caseModal.style.display = "none";
        updateBalance();
      };

      rewardBtnInv.onclick = async () => {
        await fetch(`${API}/add-nft`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user: userId, nft: { name: finalPrize.value, price: 3.27 } })
        });
        rewardModal.style.display = "none";
        caseModal.style.display = "none";
      };

      rewardBtnSell.onclick = async () => {
        await fetch(`${API}/add-balance`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user: userId, amount: 3.27 })
        });
        rewardModal.style.display = "none";
        caseModal.style.display = "none";
        updateBalance();
      };

    }, 5200);
  };

  // ================= INVENTORY =================
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

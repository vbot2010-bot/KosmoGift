document.addEventListener("DOMContentLoaded", () => {

  const tg = window.Telegram.WebApp;
  tg.expand();

  const user = tg.initDataUnsafe.user || {};
  const userId = String(user.id);

  const API = "https://kosmogift-worker.v-bot-2010.workers.dev";

  // элементы
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

  const subscribeModal = document.getElementById("subscribeModal");
  const subscribeBtn = document.getElementById("subscribeBtn");

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

  // ================== PRIZES ==================
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

  function randomPrize() {
    const r = Math.random() * 100;
    let sum = 0;
    for (const p of prizes) {
      sum += p.chance;
      if (r <= sum) return p;
    }
    return prizes[0];
  }

  // ================= DAILY CASE =================
  let subscribed = false;

  openDaily.onclick = async () => {
    if (!subscribed) {
      subscribeModal.style.display = "flex";
      return;
    }
    caseModal.style.display = "flex";
    caseModal.classList.add("showCase");
  };

  subscribeBtn.onclick = () => {
    window.open("https://t.me/KosmoGiftOfficial", "_blank");
    subscribed = true;
    subscribeModal.style.display = "none";
    caseModal.style.display = "flex";
    caseModal.classList.add("showCase");
  };

  closeCase.onclick = () => {
    caseModal.classList.remove("showCase");
    caseModal.style.display = "none";
  };

  openCaseBtn.onclick = async () => {
    const prize = randomPrize();

    strip.innerHTML = "";

    for (let i = 0; i < 30; i++) {
      const div = document.createElement("div");
      div.className = "drop";

      const p = (i === 14) ? prize : prizes[Math.floor(Math.random() * prizes.length)];
      div.innerText = p.type === "ton" ? `${p.value} TON` : p.value;
      strip.appendChild(div);
    }

    strip.style.transition = "none";
    strip.style.transform = "translateX(0)";
    strip.offsetWidth;

    strip.style.transition = "transform 5s cubic-bezier(.17,.67,.3,1)";
    const stopPosition = -((160 + 18) * 14);
    strip.style.transform = `translateX(${stopPosition}px)`;

    setTimeout(() => {
      rewardModal.style.display = "flex";
      rewardText.innerText = prize.type === "ton"
        ? `Вы выиграли ${prize.value} TON`
        : `Вы выиграли NFT "${prize.value}"`;

      rewardBtnTon.style.display = prize.type === "ton" ? "block" : "none";
      rewardBtnSell.style.display = prize.type === "nft" ? "block" : "none";
      rewardBtnInv.style.display = prize.type === "nft" ? "block" : "none";

      rewardBtnTon.onclick = async () => {
        await fetch(`${API}/add-balance`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user: userId, amount: prize.value })
        });
        rewardModal.style.display = "none";
        caseModal.classList.remove("showCase");
        caseModal.style.display = "none";
        updateBalance();
      };

      rewardBtnSell.onclick = async () => {
        await fetch(`${API}/add-nft`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user: userId, nft: prize })
        });
        rewardModal.style.display = "none";
        caseModal.classList.remove("showCase");
        caseModal.style.display = "none";
        updateBalance();
      };

      rewardBtnInv.onclick = async () => {
        await fetch(`${API}/add-nft`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user: userId, nft: prize })
        });
        rewardModal.style.display = "none";
        caseModal.classList.remove("showCase");
        caseModal.style.display = "none";
      };

    }, 5000);
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
        <div>${item.type === "ton" ? item.value + " TON" : item.value}</div>
        <div>Цена: ${item.price || 0} TON</div>
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

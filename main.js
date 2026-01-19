document.addEventListener("DOMContentLoaded", async () => {
  const tg = window.Telegram.WebApp;
  tg.expand();

  const user = tg.initDataUnsafe.user;
  if (!user) return alert("Открой через Telegram");

  const userId = String(user.id);
  const API = "https://kosmogift-worker.v-bot-2010.workers.dev";

  // Elements
  const balanceEl = document.getElementById("balance");
  const balanceProfile = document.getElementById("balanceProfile");

  const btnHome = document.getElementById("btnHome");
  const btnProfile = document.getElementById("btnProfile");

  const connectWallet = document.getElementById("connectWallet");
  const disconnectWallet = document.getElementById("disconnectWallet");
  const deposit = document.getElementById("deposit");

  const openInventory = document.getElementById("openInventory");
  const inventoryModal = document.getElementById("inventoryModal");
  const inventoryList = document.getElementById("inventoryList");
  const closeInventory = document.getElementById("closeInventory");

  const openDaily = document.getElementById("openDaily");
  const subscribeModal = document.getElementById("subscribeModal");
  const subscribeBtn = document.getElementById("subscribeBtn");

  const caseModal = document.getElementById("caseModal");
  const closeCase = document.getElementById("closeCase");
  const openCaseBtn = document.getElementById("openCaseBtn");
  const strip = document.getElementById("strip");

  const rewardModal = document.getElementById("rewardModal");
  const rewardText = document.getElementById("rewardText");
  const rewardBtnTon = document.getElementById("rewardBtnTon");
  const rewardBtnSell = document.getElementById("rewardBtnSell");
  const rewardBtnInv = document.getElementById("rewardBtnInv");

  // Avatar
  document.getElementById("avatar").src = user.photo_url || "";
  document.getElementById("profileAvatar").src = user.photo_url || "";
  document.getElementById("username").innerText = user.username || "User";

  // Navigation
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
    connectWallet.style.display = wallet ? "none" : "block";
    disconnectWallet.style.display = wallet ? "block" : "none";
  });

  // Balance update
  async function updateBalance() {
    const res = await fetch(`${API}/balance?user=${userId}`);
    const data = await res.json();
    balanceEl.innerText = data.balance.toFixed(2) + " TON";
    balanceProfile.innerText = data.balance.toFixed(2) + " TON";
  }
  await updateBalance();

  // Deposit modal
  const modal = document.getElementById("modal");
  const closeModal = document.getElementById("closeModal");
  const pay = document.getElementById("pay");
  const amountInput = document.getElementById("amount");

  deposit.onclick = () => modal.style.display = "flex";
  closeModal.onclick = () => modal.style.display = "none";

  pay.onclick = async () => {
    const amount = parseFloat(amountInput.value);
    if (!amount || amount < 0.1) return alert("Минимум 0.1 TON");

    await tonConnectUI.sendTransaction({
      validUntil: Math.floor(Date.now() / 1000) + 600,
      messages: [{
        address: "UQAFXBXzBzau6ZCWzruiVrlTg3HAc8MF6gKIntqTLDifuWOi",
        amount: (amount * 1e9).toString()
      }]
    });

    modal.style.display = "none";
  };

  // Inventory
  openInventory.onclick = async () => {
    const r = await fetch(`${API}/inventory?user=${userId}`);
    const inv = await r.json();

    inventoryList.innerHTML = "";
    inv.forEach((item, idx) => {
      const card = document.createElement("div");
      card.className = "itemCard";
      card.innerHTML = `
        <div>${item.name}</div>
        <div>Цена: ${item.price} TON</div>
        <button data-index="${idx}" class="sellBtn">Продать</button>
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
        await updateBalance();
        openInventory.click();
      };
    });

    inventoryModal.style.display = "flex";
  };

  closeInventory.onclick = () => inventoryModal.style.display = "none";

  // Subscribe modal (only once)
  openDaily.onclick = () => {
    const already = localStorage.getItem("subscribed");
    if (already === "true") {
      caseModal.style.display = "flex";
      return;
    }
    subscribeModal.style.display = "flex";
  };

  subscribeBtn.onclick = () => {
    window.open("https://t.me/KosmoGiftOfficial", "_blank");
    localStorage.setItem("subscribed", "true");
    subscribeModal.style.display = "none";
    caseModal.style.display = "flex";
  };

  subscribeModal.onclick = (e) => {
    if (e.target === subscribeModal) subscribeModal.style.display = "none";
  };

  // Case
  const prizes = [
    { type: "ton", value: 0.01, chance: 85 },
    { type: "ton", value: 0.02, chance: 10 },
    { type: "ton", value: 0.05, chance: 4 },
    { type: "nft", value: "LOL POP", price: 0.5, chance: 1 }
  ];

  function rollPrize() {
    let r = Math.random() * 100;
    let sum = 0;
    for (const p of prizes) {
      sum += p.chance;
      if (r <= sum) return p;
    }
    return prizes[0];
  }

  closeCase.onclick = () => caseModal.style.display = "none";

  openCaseBtn.onclick = () => {
    const prize = rollPrize();
    strip.innerHTML = "";

    for (let i = 0; i < 35; i++) {
      const d = document.createElement("div");
      d.className = "drop";
      d.innerText = prize.type === "ton" ? `${prize.value} TON` : prize.value;
      strip.appendChild(d);
    }

    strip.style.transition = "transform 6s cubic-bezier(.17,.67,.3,1)";
    strip.style.transform = "translateX(-2200px)";

    setTimeout(() => {
      rewardModal.style.display = "flex";
      rewardText.innerText =
        prize.type === "ton"
          ? `Вы выиграли ${prize.value} TON`
          : `Вы выиграли NFT ${prize.value}`;

      rewardBtnTon.style.display = prize.type === "ton" ? "block" : "none";
      rewardBtnInv.style.display = prize.type === "nft" ? "block" : "none";
      rewardBtnSell.style.display = prize.type === "nft" ? "block" : "none";

      rewardBtnTon.onclick = async () => {
        await fetch(`${API}/add-balance`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user: userId, amount: prize.value })
        });
        rewardModal.style.display = "none";
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
        caseModal.style.display = "none";
      };

      rewardBtnSell.onclick = async () => {
        await fetch(`${API}/add-balance`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user: userId, amount: prize.price })
        });
        rewardModal.style.display = "none";
        caseModal.style.display = "none";
        updateBalance();
      };
    }, 6200);
  };
});

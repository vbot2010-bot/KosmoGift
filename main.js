document.addEventListener("DOMContentLoaded", () => {

  const tg = window.Telegram.WebApp;
  tg.expand();

  const user = tg.initDataUnsafe.user || {};
  const userId = String(user.id);

  const API = "https://kosmogift-worker.v-bot-2010.workers.dev";

  // элементы
  const balanceEl = document.getElementById("balance");
  const balanceProfile = document.getElementById("balanceProfile");

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
  const rewardBtnInv = document.getElementById("rewardBtnInv");
  const rewardBtnSell = document.getElementById("rewardBtnSell");

  const inventoryModal = document.getElementById("inventoryModal");
  const inventoryList = document.getElementById("inventoryList");
  const closeInventory = document.getElementById("closeInventory");

  const subscribeModal = document.getElementById("subscribeModal");
  const subscribeBtn = document.getElementById("subscribeBtn");

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
  deposit.onclick = () => modal.style.display = "flex";
  closeModal.onclick = () => modal.style.display = "none";

  window.onclick = (event) => {
    if (event.target == modal) modal.style.display = "none";
    if (event.target == caseModal) caseModal.style.display = "none";
    if (event.target == rewardModal) rewardModal.style.display = "none";
    if (event.target == inventoryModal) inventoryModal.style.display = "none";
    if (event.target == subscribeModal) subscribeModal.style.display = "none";
  };

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

  // BALANCE
  async function updateBalance() {
    const res = await fetch(`${API}/balance?user=${userId}`);
    const data = await res.json();
    balanceEl.innerText = data.balance.toFixed(2) + " TON";
    balanceProfile.innerText = data.balance.toFixed(2) + " TON";
  }
  updateBalance();
  setInterval(updateBalance, 5000);

  // DAILY CASE
  const prizes = [
    { type: "ton", value: 0.01, chance: 90 },
    { type: "ton", value: 0.02, chance: 5 },
    { type: "ton", value: 0.03, chance: 2.5 },
    { type: "ton", value: 0.04, chance: 1 },
    { type: "ton", value: 0.05, chance: 0.75 },
    { type: "ton", value: 0.06, chance: 0.5 },
    { type: "ton", value: 0.07, chance: 0.24 },
    { type: "nft", value: { name: "lol pop", price: 0.12 }, chance: 0.01 }
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

  openDaily.onclick = async () => {
    caseModal.style.display = "flex";
  };

  closeCase.onclick = () => caseModal.style.display = "none";

  openCaseBtn.onclick = async () => {
    const prize = randomPrize();

    strip.innerHTML = "";
    for (let i = 0; i < 25; i++) {
      const div = document.createElement("div");
      div.className = "drop";
      div.innerText = prize.type === "ton" ? `${prize.value} TON` : prize.value.name;
      strip.appendChild(div);
    }

    // МЕДЛЕННАЯ рулетка
    strip.style.transition = "transform 6s cubic-bezier(.17,.67,.3,1)";
    strip.style.transform = "translateX(-1400px)";

    setTimeout(() => {
      rewardModal.style.display = "flex";
      rewardText.innerText = prize.type === "ton"
        ? `Вы выиграли ${prize.value} TON`
        : `Вы выиграли NFT "${prize.value.name}"`;

      rewardBtnTon.style.display = prize.type === "ton" ? "block" : "none";
      rewardBtnInv.style.display = prize.type === "nft" ? "block" : "none";
      rewardBtnSell.style.display = "none";

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
          body: JSON.stringify({ user: userId, nft: prize.value })
        });
        rewardModal.style.display = "none";
        caseModal.style.display = "none";
        alert("NFT добавлен в инвентарь");
      };

    }, 6000);
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

  // ПОДПИСКА
  subscribeBtn.onclick = () => {
    tg.openLink("https://t.me/KosmoGiftOfficial");
  };

  document.getElementById("showSubscribe").onclick = () => {
    subscribeModal.style.display = "flex";
  };

});

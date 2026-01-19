document.addEventListener("DOMContentLoaded", () => {

  const tg = window.Telegram.WebApp;
  tg.expand();

  const user = tg.initDataUnsafe.user;
  const userId = String(user.id);

  const API = "https://kosmogift-worker.v-bot-2010.workers.dev";

  const avatar = document.getElementById("avatar");
  const profileAvatar = document.getElementById("profileAvatar");
  const username = document.getElementById("username");

  const balance = document.getElementById("balance");
  const balanceProfile = document.getElementById("balanceProfile");

  const btnHome = document.getElementById("btnHome");
  const btnProfile = document.getElementById("btnProfile");

  const openDaily = document.getElementById("openDaily");
  const openInventory = document.getElementById("openInventory");

  const subscribeModal = document.getElementById("subscribeModal");
  const subscribeBtn = document.getElementById("subscribeBtn");

  const caseModal = document.getElementById("caseModal");
  const closeCase = document.getElementById("closeCase");
  const openCaseBtn = document.getElementById("openCaseBtn");
  const resultText = document.getElementById("resultText");

  const strip = document.getElementById("strip");

  const prizeModal = document.getElementById("prizeModal");
  const prizeTitle = document.getElementById("prizeTitle");
  const prizeText = document.getElementById("prizeText");
  const prizeImage = document.getElementById("prizeImage");
  const getTonBtn = document.getElementById("getTonBtn");
  const sellBtn = document.getElementById("sellBtn");
  const toInventoryBtn = document.getElementById("toInventoryBtn");
  const prizeButtons = document.getElementById("prizeButtons");

  const inventoryModal = document.getElementById("inventoryModal");
  const closeInventory = document.getElementById("closeInventory");
  const inventoryList = document.getElementById("inventoryList");

  const connectWallet = document.getElementById("connectWallet");
  const disconnectWallet = document.getElementById("disconnectWallet");
  const deposit = document.getElementById("deposit");

  avatar.src = user.photo_url || "";
  profileAvatar.src = user.photo_url || "";
  username.innerText = user.username || "Telegram User";

  function showPage(id) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById(id).classList.add("active");
  }

  btnHome.onclick = () => showPage("home");
  btnProfile.onclick = () => showPage("profile");

  async function loadBalance() {
    const r = await fetch(`${API}/balance?user=${userId}`);
    const d = await r.json();
    balance.innerText = `${Number(d.balance).toFixed(2)} TON`;
    balanceProfile.innerText = `${Number(d.balance).toFixed(2)} TON`;
  }

  loadBalance();

  const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
    manifestUrl: "https://kosmogift.pages.dev/tonconnect-manifest.json"
  });

  connectWallet.onclick = async () => {
    try { await tonConnectUI.connectWallet(); } catch (e) { alert("Ошибка подключения"); }
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

  deposit.onclick = async () => {
    const amount = parseFloat(prompt("Сколько TON пополнить?"));
    if (!amount || amount < 0.1) return alert("Минимум 0.1 TON");

    await tonConnectUI.sendTransaction({
      validUntil: Math.floor(Date.now() / 1000) + 600,
      messages: [{
        address: "UQAFXBXzBzau6ZCWzruiVrlTg3HAc8MF6gKIntqTLDifuWOi",
        amount: String(amount * 1e9)
      }]
    });

    alert("Оплата отправлена");
  };

  function needSubscribe() {
    return !localStorage.getItem("subscribed");
  }

  subscribeBtn.onclick = () => {
    tg.openUrl("https://t.me/KosmoGiftOfficial");
    localStorage.setItem("subscribed", "1");
    subscribeModal.style.display = "none";
  };

  const prizes = [
    { name: "TON 0.01", chance: 90, type: "ton", amount: 0.01 },
    { name: "TON 0.02", chance: 5, type: "ton", amount: 0.02 },
    { name: "TON 0.03", chance: 2.5, type: "ton", amount: 0.03 },
    { name: "TON 0.04", chance: 1, type: "ton", amount: 0.04 },
    { name: "TON 0.05", chance: 0.75, type: "ton", amount: 0.05 },
    { name: "TON 0.06", chance: 0.5, type: "ton", amount: 0.06 },
    { name: "TON 0.07", chance: 0.24, type: "ton", amount: 0.07 },
    { name: "NFT lol pop", chance: 0.01, type: "nft", amount: 3.27 }
  ];

  function pickPrize() {
    const rnd = Math.random() * 100;
    let sum = 0;
    for (let i = 0; i < prizes.length; i++) {
      sum += prizes[i].chance;
      if (rnd <= sum) return i;
    }
    return prizes.length - 1;
  }

  openDaily.onclick = async () => {
    if (needSubscribe()) {
      subscribeModal.style.display = "flex";
      return;
    }

    const r = await fetch(`${API}/daily?user=${userId}`);
    const d = await r.json();

    if (d.error === "already") {
      alert("Кейс доступен раз в 24 часа");
      return;
    }

    caseModal.style.display = "flex";
    resultText.innerText = "Нажми «Открыть кейс»";

    buildStrip();
  };

  closeCase.onclick = () => caseModal.style.display = "none";

  function buildStrip() {
    strip.innerHTML = "";
    const list = [...prizes, ...prizes, ...prizes];
    list.forEach(p => {
      const div = document.createElement("div");
      div.className = "drop";
      div.innerText = p.name;
      strip.appendChild(div);
    });
    strip.style.transform = "translateX(0)";
    strip.style.transition = "none";
  }

  openCaseBtn.onclick = async () => {
    openCaseBtn.disabled = true;

    const winIndex = pickPrize();
    const prize = prizes[winIndex];

    animateStrip(winIndex, prizes.length, () => {
      showPrize(prize);
      openCaseBtn.disabled = false;
    });
  };

  function animateStrip(winIndex, total, cb) {
    const drops = strip.querySelectorAll(".drop");
    const dropWidth = drops[0].offsetWidth + 18;
    const visibleCenter = strip.parentElement.offsetWidth / 2;

    const targetX = -((total * 2 + winIndex) * dropWidth) + visibleCenter - dropWidth / 2;

    strip.style.transition = "transform 4s cubic-bezier(.25,.8,.25,1)";
    strip.style.transform = `translateX(${targetX}px)`;

    setTimeout(cb, 4100);
  }

  function showPrize(prize) {
    caseModal.style.display = "none";
    prizeModal.style.display = "flex";

    prizeTitle.innerText = "Вы выиграли!";
    prizeText.innerText = prize.name;
    prizeImage.innerText = prize.name;

    if (prize.type === "ton") {
      prizeButtons.style.display = "block";
      getTonBtn.style.display = "block";
      sellBtn.style.display = "none";
      toInventoryBtn.style.display = "none";

      getTonBtn.onclick = async () => {
        await fetch(`${API}/get-ton`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user: userId, amount: prize.amount })
        });
        loadBalance();
        prizeModal.style.display = "none";
      };

    } else {
      prizeButtons.style.display = "block";
      getTonBtn.style.display = "none";
      sellBtn.style.display = "block";
      toInventoryBtn.style.display = "block";

      sellBtn.onclick = async () => {
        await fetch(`${API}/sell-nft`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user: userId, item: prize.name })
        });
        loadBalance();
        prizeModal.style.display = "none";
      };

      toInventoryBtn.onclick = async () => {
        await fetch(`${API}/add-inventory`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user: userId, item: prize.name })
        });
        prizeModal.style.display = "none";
      };
    }
  }

  openInventory.onclick = async () => {
    inventoryModal.style.display = "flex";
    inventoryList.innerHTML = "";

    const r = await fetch(`${API}/inventory?user=${userId}`);
    const inv = await r.json();

    inv.forEach((item, i) => {
      const div = document.createElement("div");
      div.className = "itemCard";
      div.innerHTML = `
        <div>${item.name}</div>
        <button>Продать</button>
      `;
      div.querySelector("button").onclick = async () => {
        await fetch(`${API}/sell-nft`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user: userId, index: i })
        });
        loadBalance();
        openInventory.click();
      };
      inventoryList.appendChild(div);
    });
  };

  closeInventory.onclick = () => inventoryModal.style.display = "none";
});

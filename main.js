document.addEventListener("DOMContentLoaded", () => {
  if (!window.Telegram?.WebApp) {
    alert("Запускай Mini App через Telegram");
    return;
  }

  const tg = window.Telegram.WebApp;
  tg.expand();

  const user = tg.initDataUnsafe.user;
  const userId = String(user.id);

  const API = "https://kosmogift-worker.v-bot-2010.workers.dev";

  /* ================= ELEMENTS ================= */
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
  const strip = document.getElementById("strip");
  const resultBlock = document.getElementById("resultBlock");
  const resultText = document.getElementById("resultText");

  const rewardModal = document.getElementById("rewardModal");
  const rewardImg = document.getElementById("rewardImg");
  const rewardText = document.getElementById("rewardText");
  const rewardBtnTon = document.getElementById("rewardBtnTon");
  const rewardBtnSell = document.getElementById("rewardBtnSell");
  const rewardBtnInv = document.getElementById("rewardBtnInv");

  const inventoryModal = document.getElementById("inventoryModal");
  const closeInventory = document.getElementById("closeInventory");
  const inventoryList = document.getElementById("inventoryList");

  const connectWallet = document.getElementById("connectWallet");
  const disconnectWallet = document.getElementById("disconnectWallet");
  const deposit = document.getElementById("deposit");

  const timerBlock = document.getElementById("timerBlock");
  const timerText = document.getElementById("timerText");

  /* ================= USER ================= */
  avatar.src = user.photo_url || "";
  profileAvatar.src = user.photo_url || "";
  username.innerText = user.username || "Telegram User";

  /* ================= NAV ================= */
  function showPage(id) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById(id).classList.add("active");
  }

  btnHome.onclick = () => showPage("home");
  btnProfile.onclick = () => showPage("profile");

  /* ================= BALANCE ================= */
  async function loadBalance() {
    const r = await fetch(`${API}/balance?user=${userId}`);
    const d = await r.json();
    balance.innerText = `${Number(d.balance).toFixed(2)} TON`;
    balanceProfile.innerText = `${Number(d.balance).toFixed(2)} TON`;
  }

  loadBalance();

  /* ================= TON CONNECT ================= */
  const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
    manifestUrl: "https://kosmogift.pages.dev/tonconnect-manifest.json"
  });

  connectWallet.onclick = async () => {
    try {
      await tonConnectUI.connectWallet();
    } catch {}
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

  /* ================= DEPOSIT ================= */
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

  /* ================= SUBSCRIBE (1 TIME) ================= */
  function needSubscribe() {
    return !localStorage.getItem("subscribed");
  }

  subscribeBtn.onclick = () => {
    tg.openUrl("https://t.me/KosmoGiftOfficial");
    localStorage.setItem("subscribed", "1");
    subscribeModal.style.display = "none";
  };

  /* ================= TIMER ================= */
  function startTimer() {
    timerBlock.style.display = "block";

    const now = new Date();
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const tick = () => {
      const diff = end - new Date();
      if (diff <= 0) {
        timerText.innerText = "00:00:00";
        timerBlock.style.display = "none";
        openDaily.style.display = "block";
        return;
      }

      const h = String(Math.floor(diff / 3600000)).padStart(2, "0");
      const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
      timerText.innerText = `${h}:${m}:${s}`;
    };

    tick();
    setInterval(tick, 1000);
  }

  /* ================= DAILY CASE ================= */
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
    resultBlock.style.display = "none";
    resultText.innerText = "Нажми «Открыть кейс»";
  };

  closeCase.onclick = () => caseModal.style.display = "none";

  /* ================= ROULETTE ================= */
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
    const rand = Math.random() * 100;
    let sum = 0;

    for (const p of prizes) {
      sum += p.chance;
      if (rand <= sum) return p;
    }

    return prizes[0];
  }

  function buildStrip() {
    strip.innerHTML = "";
    for (let i = 0; i < 20; i++) {
      const p = prizes[Math.floor(Math.random() * prizes.length)];
      const div = document.createElement("div");
      div.className = "drop";
      div.innerText = p.type === "ton" ? `${p.value} TON` : p.value;
      strip.appendChild(div);
    }
  }

  async function openCase() {
    openCaseBtn.disabled = true;

    const prize = randomPrize();
    buildStrip();

    // анимация
    const totalWidth = strip.scrollWidth;
    const randomShift = Math.floor(Math.random() * (totalWidth - 300)) + 150;

    strip.style.transition = "transform 3.5s cubic-bezier(.17,.67,.3,1)";
    strip.style.transform = `translateX(-${randomShift}px)`;

    setTimeout(async () => {
      openCaseBtn.disabled = false;

      resultBlock.style.display = "block";
      resultText.innerText = prize.type === "ton"
        ? `Вы выиграли ${prize.value} TON`
        : `Вы выиграли NFT "${prize.value}"`;

      // reward modal
      rewardModal.style.display = "flex";
      rewardImg.src = prize.type === "ton"
        ? "https://i.imgur.com/TON.png"
        : "https://i.imgur.com/NFT.png";

      rewardText.innerText = prize.type === "ton"
        ? `Вы выиграли ${prize.value} TON`
        : `Вы выиграли NFT "${prize.value}" (Цена 3.27 TON)`;

      if (prize.type === "ton") {
        rewardBtnTon.style.display = "block";
        rewardBtnSell.style.display = "none";
        rewardBtnInv.style.display = "none";

        rewardBtnTon.onclick = async () => {
          await fetch(`${API}/daily?user=${userId}`);
          loadBalance();
          rewardModal.style.display = "none";
          caseModal.style.display = "none";
          openDaily.style.display = "none";
          startTimer();
        };

      } else {
        rewardBtnTon.style.display = "none";
        rewardBtnSell.style.display = "block";
        rewardBtnInv.style.display = "block";

        const nft = { name: prize.value, price: 3.27 };

        rewardBtnInv.onclick = async () => {
          await fetch(`${API}/add-nft`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user: userId, nft })
          });
          rewardModal.style.display = "none";
          caseModal.style.display = "none";
          openDaily.style.display = "none";
          startTimer();
        };

        rewardBtnSell.onclick = async () => {
          await fetch(`${API}/add-nft`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user: userId, nft })
          });

          await fetch(`${API}/sell-nft`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user: userId, index: 0 })
          });

          loadBalance();
          rewardModal.style.display = "none";
          caseModal.style.display = "none";
          openDaily.style.display = "none";
          startTimer();
        };
      }

    }, 3600);
  }

  openCaseBtn.onclick = openCase;

  /* ================= INVENTORY ================= */
  openInventory.onclick = async () => {
    inventoryModal.style.display = "flex";
    inventoryList.innerHTML = "";

    const r = await fetch(`${API}/inventory?user=${userId}`);
    const inv = await r.json();

    inv.forEach((item, i) => {
      const div = document.createElement("div");
      div.className = "itemCard";
      div.innerHTML = `
        <div>${item.name} — ${item.price} TON</div>
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

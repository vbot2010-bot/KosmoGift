document.addEventListener("DOMContentLoaded", async () => {

  if (!window.Telegram?.WebApp) {
    alert("Запускай Mini App через Telegram");
    return;
  }

  const tg = window.Telegram.WebApp;
  tg.expand();

  const user = tg.initDataUnsafe.user;
  const userId = String(user.id);

  const API = "https://kosmogift-worker.v-bot-2010.workers.dev";

  // элементы
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

  // user info
  avatar.src = user.photo_url || "";
  profileAvatar.src = user.photo_url || "";
  username.innerText = user.username || "Telegram User";

  // nav
  function showPage(id) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById(id).classList.add("active");
  }
  btnHome.onclick = () => showPage("home");
  btnProfile.onclick = () => showPage("profile");

  // balance
  async function loadBalance() {
    const r = await fetch(`${API}/balance?user=${userId}`);
    const d = await r.json();
    balance.innerText = `${Number(d.balance).toFixed(2)} TON`;
    balanceProfile.innerText = `${Number(d.balance).toFixed(2)} TON`;
  }
  loadBalance();

  // subscribe
  function needSubscribe() {
    return !localStorage.getItem("subscribed");
  }
  subscribeBtn.onclick = () => {
    tg.openUrl("https://t.me/KosmoGiftOfficial");
    localStorage.setItem("subscribed", "1");
    subscribeModal.style.display = "none";
  };

  // timer
  function startTimer(ms) {
    timerBlock.style.display = "block";
    const end = Date.now() + ms;

    const tick = () => {
      const diff = end - Date.now();
      if (diff <= 0) {
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

  // prizes
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

  // open daily
  openDaily.onclick = async () => {
    if (needSubscribe()) {
      subscribeModal.style.display = "flex";
      return;
    }

    const r = await fetch(`${API}/daily-status?user=${userId}`);
    const d = await r.json();

    if (d.remaining > 0) {
      startTimer(d.remaining);
      openDaily.style.display = "none";
      return;
    }

    const r2 = await fetch(`${API}/daily?user=${userId}`);
    const d2 = await r2.json();

    if (d2.error) {
      alert("Кейс доступен раз в 24 часа");
      return;
    }

    caseModal.style.display = "flex";
  };

  // roulette
  openCaseBtn.onclick = async () => {
    const prize = randomPrize();

    strip.innerHTML = "";
    for (let i = 0; i < 20; i++) {
      const div = document.createElement("div");
      div.className = "drop";
      div.innerText = prize.type === "ton" ? `${prize.value} TON` : prize.value;
      strip.appendChild(div);
    }

    strip.style.transition = "transform 3s cubic-bezier(.17,.67,.3,1)";
    strip.style.transform = "translateX(-600px)";

    setTimeout(async () => {
      rewardModal.style.display = "flex";
      rewardText.innerText =
        prize.type === "ton"
          ? `Вы выиграли ${prize.value} TON`
          : `Вы выиграли NFT "${prize.value}" (3.27 TON)`;

      if (prize.type === "ton") {
        rewardBtnTon.style.display = "block";
        rewardBtnSell.style.display = "none";
        rewardBtnInv.style.display = "none";

        rewardBtnTon.onclick = async () => {
          await fetch(`${API}/add-balance`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user: userId, amount: prize.value })
          });
          loadBalance();
          rewardModal.style.display = "none";
          caseModal.style.display = "none";
          openDaily.style.display = "none";
          startTimer(86400000);
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
          startTimer(86400000);
        };

        rewardBtnSell.onclick = async () => {
          await fetch(`${API}/add-balance`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user: userId, amount: 3.27 })
          });
          loadBalance();
          rewardModal.style.display = "none";
          caseModal.style.display = "none";
          openDaily.style.display = "none";
          startTimer(86400000);
        };
      }
    }, 3200);
  };

  closeCase.onclick = () => caseModal.style.display = "none";
  rewardModal.onclick = () => rewardModal.style.display = "none";
});

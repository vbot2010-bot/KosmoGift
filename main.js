document.addEventListener("DOMContentLoaded", () => {
  const tg = window.Telegram.WebApp;
  tg.expand();

  const user = tg.initDataUnsafe.user || {};
  const userId = String(user.id);

  const API = "https://kosmogift-worker.v-bot-2010.workers.dev";

  const openDaily = document.getElementById("openDaily");
  const openUnlucky = document.getElementById("openUnlucky");
  const timerBlock = document.getElementById("timerBlock");
  const timerText = document.getElementById("timerText");

  const caseModal = document.getElementById("caseModal");
  const openCaseBtn = document.getElementById("openCaseBtn");
  const closeCase = document.getElementById("closeCase");
  const strip = document.getElementById("strip");

  const rewardModal = document.getElementById("rewardModal");
  const rewardText = document.getElementById("rewardText");
  const rewardBtnOk = document.getElementById("rewardBtnOk");
  const rewardBtnInv = document.getElementById("rewardBtnInv");

  let isSpinning = false;
  let currentCase = null;

  // ================== DAILY TIMER ==================
  const TIMER_KEY = "daily_case_timer";
  const ONE_DAY = 24 * 60 * 60 * 1000;

  function hasDailyTimer() {
    const end = localStorage.getItem(TIMER_KEY);
    return end && Date.now() < Number(end);
  }

  function startDailyTimer() {
    localStorage.setItem(TIMER_KEY, Date.now() + ONE_DAY);
    updateDailyTimer();
  }

  function updateDailyTimer() {
    const end = localStorage.getItem(TIMER_KEY);

    if (!end || Date.now() >= end) {
      localStorage.removeItem(TIMER_KEY);
      timerBlock.style.display = "none";
      openDaily.style.display = "block";
      return;
    }

    const left = end - Date.now();
    const h = Math.floor(left / 3600000);
    const m = Math.floor((left % 3600000) / 60000);
    const s = Math.floor((left % 60000) / 1000);

    timerText.innerText =
      `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;

    openDaily.style.display = "none";
    timerBlock.style.display = "flex";
  }

  setInterval(updateDailyTimer, 1000);
  updateDailyTimer();

  // ================== PRIZES ==================
  const dailyPrizes = [
    { type: "ton", value: 0.01, chance: 90 },
    { type: "ton", value: 0.03, chance: 8 },
    { type: "nft", value: "lol pop", chance: 2 }
  ];

  function randomPrize(list) {
    const r = Math.random() * 100;
    let sum = 0;
    for (const p of list) {
      sum += p.chance;
      if (r <= sum) return p;
    }
    return list[0];
  }

  // ================== OPEN DAILY ==================
  openDaily.onclick = () => {
    if (hasDailyTimer()) return; // ❌ запрещаем повтор
    currentCase = "daily";
    openCase();
  };

  // ================== OPEN UNLUCKY ==================
  openUnlucky.onclick = () => {
    currentCase = "unlucky";
    openCase();
  };

  function openCase() {
    caseModal.style.display = "flex";
  }

  closeCase.onclick = () => {
    caseModal.style.display = "none";
  };

  // ================== SPIN ==================
  openCaseBtn.onclick = async () => {
    if (isSpinning) return;
    if (currentCase === "daily" && hasDailyTimer()) return;

    isSpinning = true;
    openCaseBtn.disabled = true;

    const prize = randomPrize(dailyPrizes);

    strip.innerHTML = "";

    const items = [];
    for (let i = 0; i < 50; i++) {
      items.push(dailyPrizes[Math.floor(Math.random() * dailyPrizes.length)]);
    }
    items.push(prize);

    items.forEach(p => {
      const d = document.createElement("div");
      d.className = "drop";
      d.innerText = p.type === "ton" ? `${p.value} TON` : p.value;
      strip.appendChild(d);
    });

    strip.style.transition = "none";
    strip.style.transform = "translateX(0)";
    strip.offsetHeight;

    const targetX = items.length * 218 - 400;

    strip.style.transition = "transform 6s cubic-bezier(.17,.67,.3,1)";
    strip.style.transform = `translateX(-${targetX}px)`;

    setTimeout(async () => {
      isSpinning = false;
      openCaseBtn.disabled = false;

      // ✅ СРАЗУ ставим таймер
      if (currentCase === "daily") {
        startDailyTimer();
      }

      // авто начисление
      if (prize.type === "ton") {
        await fetch(`${API}/add-balance`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user: userId, amount: prize.value })
        });
      } else {
        await fetch(`${API}/add-nft`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user: userId,
            nft: { name: prize.value, price: 3.27 }
          })
        });
      }

      rewardModal.style.display = "flex";
      rewardText.innerText =
        prize.type === "ton"
          ? `Вы выиграли ${prize.value} TON`
          : `Вы выиграли NFT "${prize.value}"`;

      rewardBtnOk.style.display = prize.type === "ton" ? "block" : "none";
      rewardBtnInv.style.display = prize.type === "nft" ? "block" : "none";

    }, 6500);
  };

  rewardBtnOk.onclick = () => rewardModal.style.display = "none";
  rewardBtnInv.onclick = () => rewardModal.style.display = "none";
});

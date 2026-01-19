document.addEventListener("DOMContentLoaded", () => {
  const tg = window.Telegram.WebApp;
  tg.expand();

  const user = tg.initDataUnsafe.user || {};
  const userId = String(user.id);

  const API = "https://kosmogift-worker.v-bot-2010.workers.dev";

  /* ================= ELEMENTS ================= */
  const avatar = document.getElementById("avatar");
  const profileAvatar = document.getElementById("profileAvatar");
  const username = document.getElementById("username");

  const balanceEl = document.getElementById("balance");
  const balanceProfile = document.getElementById("balanceProfile");

  const btnHome = document.getElementById("btnHome");
  const btnProfile = document.getElementById("btnProfile");

  const openDaily = document.getElementById("openDaily");
  const openUnlucky = document.getElementById("openUnlucky");

  const timerBlock = document.getElementById("timerBlock");
  const timerText = document.getElementById("timerText");

  const caseModal = document.getElementById("caseModal");
  const openCaseBtn = document.getElementById("openCaseBtn");
  const closeCase = document.getElementById("closeCase");
  const strip = document.getElementById("strip");
  const caseTitle = document.querySelector(".caseHeader .caseTitle");

  const rewardModal = document.getElementById("rewardModal");
  const rewardText = document.getElementById("rewardText");
  const rewardBtnTon = document.getElementById("rewardBtnTon");

  let currentCase = "daily"; // daily | unlucky
  let isSpinning = false;

  /* ================= USER ================= */
  avatar.src = user.photo_url || "";
  profileAvatar.src = user.photo_url || "";
  username.innerText = user.username || "Telegram User";

  /* ================= NAVIGATION ================= */
  btnHome.onclick = () => switchPage("home");
  btnProfile.onclick = () => switchPage("profile");

  function switchPage(id) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById(id).classList.add("active");
  }

  /* ================= BALANCE ================= */
  async function updateBalance() {
    const res = await fetch(`${API}/balance?user=${userId}`);
    const data = await res.json();
    balanceEl.innerText = data.balance.toFixed(2) + " TON";
    balanceProfile.innerText = data.balance.toFixed(2) + " TON";
  }

  updateBalance();
  setInterval(updateBalance, 5000);

  /* ================= DAILY TIMER ================= */
  const TIMER_KEY = "daily_case_end";
  const DAY = 24 * 60 * 60 * 1000;

  function startTimer() {
    localStorage.setItem(TIMER_KEY, Date.now() + DAY);
    updateTimer();
  }

  function updateTimer() {
    const end = localStorage.getItem(TIMER_KEY);

    if (!end) {
      openDaily.style.display = "block";
      timerBlock.style.display = "none";
      return;
    }

    const diff = end - Date.now();

    if (diff <= 0) {
      localStorage.removeItem(TIMER_KEY);
      openDaily.style.display = "block";
      timerBlock.style.display = "none";
      return;
    }

    openDaily.style.display = "none";
    timerBlock.style.display = "flex";

    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    timerText.innerText =
      String(h).padStart(2, "0") + ":" +
      String(m).padStart(2, "0") + ":" +
      String(s).padStart(2, "0");
  }

  setInterval(updateTimer, 1000);
  updateTimer();

  /* ================= PRIZES ================= */
  const dailyPrizes = [
    { value: 0.01, chance: 70 },
    { value: 0.02, chance: 15 },
    { value: 0.03, chance: 8 },
    { value: 0.05, chance: 5 },
    { value: 0.1, chance: 2 }
  ];

  const unluckyPrizes = [
    { type: "ton", value: 0.2, chance: 70 },
    { type: "ton", value: 0.35, chance: 19 },
    { type: "ton", value: 0.6, chance: 7 },
    { type: "ton", value: 1.0, chance: 2.5 },
    { type: "nft", value: "Desk calendar", chance: 0.5 },
    { type: "nft", value: "Top hat", chance: 0.25 },
    { type: "nft", value: "Signet ring", chance: 0.15 },
    { type: "nft", value: "durov's cap", chance: 0.001 }
  ];

  function getPrize(prizes) {
    const r = Math.random() * 100;
    let sum = 0;
    for (const p of prizes) {
      sum += p.chance;
      if (r <= sum) return p;
    }
    return prizes[0];
  }

  /* ================= OPEN CASES ================= */
  openDaily.onclick = () => {
    currentCase = "daily";
    caseTitle.innerText = "Daily Case";
    caseModal.style.display = "flex";
  };

  openUnlucky.onclick = () => {
    currentCase = "unlucky";
    caseTitle.innerText = "Unlucky Case";
    caseModal.style.display = "flex";
  };

  closeCase.onclick = () => {
    caseModal.style.display = "none";
  };

  /* ================= OPEN CASE BUTTON ================= */
  openCaseBtn.onclick = async () => {
    if (isSpinning) return;
    isSpinning = true;

    strip.innerHTML = "";

    let prize;
    let casePrice = 0;

    if (currentCase === "daily") {
      prize = getPrize(dailyPrizes);
      casePrice = 0;
    } else {
      prize = getPrize(unluckyPrizes);
      casePrice = 0.25;
    }

    // Generate many drops
    for (let i = 0; i < 40; i++) {
      const p = currentCase === "daily"
        ? dailyPrizes[Math.floor(Math.random() * dailyPrizes.length)]
        : unluckyPrizes[Math.floor(Math.random() * unluckyPrizes.length)];

      const d = document.createElement("div");
      d.className = "drop";
      d.innerText = currentCase === "daily"
        ? `${p.value} TON`
        : (p.type === "ton" ? `${p.value} TON` : p.value);
      strip.appendChild(d);
    }

    // Winning drop
    const win = document.createElement("div");
    win.className = "drop";
    win.innerText = currentCase === "daily"
      ? `${prize.value} TON`
      : (prize.type === "ton" ? `${prize.value} TON` : prize.value);
    strip.appendChild(win);

    const itemWidth = 218;
    const targetIndex = strip.children.length - 1;
    const stripWrapWidth = document.querySelector(".stripWrap").clientWidth;
    const targetX = targetIndex * itemWidth - (stripWrapWidth / 2 - itemWidth / 2);

    strip.style.transition = "transform 5s cubic-bezier(.17,.67,.3,1)";
    strip.style.transform = `translateX(-${targetX}px)`;

    setTimeout(async () => {
      isSpinning = false;

      // If unlucky case - remove balance
      if (currentCase === "unlucky") {
        const res = await fetch(`${API}/remove-balance`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user: userId, amount: casePrice })
        });
        const data = await res.json();
        if (!data.ok) {
          alert("Недостаточно баланса");
          caseModal.style.display = "none";
          return;
        }
        updateBalance();
      }

      // Daily starts timer
      if (currentCase === "daily") startTimer();

      rewardText.innerText = currentCase === "daily"
        ? `Вы выиграли ${prize.value} TON`
        : (prize.type === "ton"
            ? `Вы выиграли ${prize.value} TON`
            : `Вы выиграли NFT "${prize.value}"`);

      rewardModal.style.display = "flex";

      rewardBtnTon.style.display = (currentCase === "daily" || prize.type === "ton") ? "block" : "none";

      rewardBtnTon.onclick = async () => {
        const amount = currentCase === "daily" ? prize.value : prize.value;
        await fetch(`${API}/add-balance`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user: userId, amount })
        });
        rewardModal.style.display = "none";
        updateBalance();
      };
    }, 5200);
  };
});

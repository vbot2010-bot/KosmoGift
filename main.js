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

  const timerBlock = document.getElementById("timerBlock");
  const timerText = document.getElementById("timerText");

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
    balanceProfile.innerText = `${Number(d.balance).toFixed(2)} TON`;
  }
  loadBalance();

  /* ================= SUBSCRIBE ================= */
  function needSubscribe() {
    return !localStorage.getItem("subscribed");
  }
  subscribeBtn.onclick = () => {
    tg.openUrl("https://t.me/KosmoGiftOfficial");
    localStorage.setItem("subscribed", "1");
    subscribeModal.style.display = "none";
  };

  /* ================= TIMER ================= */
  let timerInterval = null;
  function startTimer(ms) {
    timerBlock.style.display = "block";
    openDaily.style.display = "none";

    if (timerInterval) clearInterval(timerInterval);

    const end = Date.now() + ms;
    timerInterval = setInterval(() => {
      const diff = end - Date.now();
      if (diff <= 0) {
        clearInterval(timerInterval);
        timerBlock.style.display = "none";
        openDaily.style.display = "block";
        return;
      }
      const h = String(Math.floor(diff / 3600000)).padStart(2, "0");
      const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
      timerText.innerText = `${h}:${m}:${s}`;
    }, 1000);
  }

  async function checkDailyStatus() {
    const st = await (await fetch(`${API}/daily-status?user=${userId}`)).json();
    if (st.remaining > 0) startTimer(st.remaining);
  }
  checkDailyStatus();

  /* ================= DAILY CASE ================= */
  openDaily.onclick = async () => {
    if (needSubscribe()) {
      subscribeModal.style.display = "flex";
      return;
    }

    const st = await (await fetch(`${API}/daily-status?user=${userId}`)).json();
    if (st.remaining > 0) {
      startTimer(st.remaining);
      return;
    }

    caseModal.style.display = "flex";
    resultBlock.style.display = "none";
    resultText.innerText = "Нажми «Открыть кейс»";
  };

  closeCase.onclick = () => caseModal.style.display = "none";

  /* ================= ROULETTE ================= */
  function buildStrip(prizeName) {
    strip.innerHTML = "";
    for (let i = 0; i < 20; i++) {
      const div = document.createElement("div");
      div.className = "drop";
      div.innerText = prizeName;
      strip.appendChild(div);
    }
  }

  async function openCase() {
    openCaseBtn.disabled = true;

    // честный выбор на сервере
    const r = await fetch(`${API}/daily?user=${userId}`);
    const d = await r.json();

    if (d.error) {
      alert("Кейс доступен раз в 24 часа");
      openCaseBtn.disabled = false;
      caseModal.style.display = "none";
      startTimer(d.remaining || 86400000);
      return;
    }

    const prize = d.prize;
    buildStrip(prize.type === "ton" ? `${prize.value} TON` : prize.value);

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
          loadBalance();
          rewardModal.style.display = "none";
          caseModal.style.display = "none";
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
          startTimer(86400000);
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
          startTimer(86400000);
        };
      }
    }, 3600);
  }

  openCaseBtn.onclick = openCase;

  /* ================= INVENTORY ================= */
  openInventory.onclick = async () => {
    inventoryModal.style.display = "flex";
    inventoryList.innerHTML = "";

    const inv = await (await fetch(`${API}/inventory?user=${userId}`)).json();

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

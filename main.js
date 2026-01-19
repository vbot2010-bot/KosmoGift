document.addEventListener("DOMContentLoaded", () => {

  const API = "https://kosmogift-worker.v-bot-2010.workers.dev";

  const user = window.Telegram.WebApp.initDataUnsafe.user || {};
  const userId = String(user.id);

  const caseModal = document.getElementById("caseModal");
  const closeCase = document.getElementById("closeCase");
  const openCaseBtn = document.getElementById("openCaseBtn");
  const strip = document.getElementById("strip");

  const rewardModal = document.getElementById("rewardModal");
  const rewardText = document.getElementById("rewardText");
  const rewardBtnTon = document.getElementById("rewardBtnTon");
  const rewardBtnSell = document.getElementById("rewardBtnSell");
  const rewardBtnInv = document.getElementById("rewardBtnInv");

  const balanceEl = document.getElementById("balance");
  const balanceProfile = document.getElementById("balanceProfile");

  const openUnlucky = document.getElementById("openUnlucky");

  let isSpinning = false;

  // ====== Unlucky Case ======
  const CASE_PRICE = 0.25;

  const prizes = [
    { type: "ton", value: 0.2, chance: 70 },
    { type: "ton", value: 0.35, chance: 19 },
    { type: "ton", value: 0.6, chance: 7 },
    { type: "ton", value: 1.0, chance: 2.5 },
    { type: "nft", value: "Desk calendar", chance: 0.5 },
    { type: "nft", value: "Top hat", chance: 0.25 },
    { type: "nft", value: "Signet ring", chance: 0.15 },
    { type: "nft", value: "durov's cap", chance: 0.001 }
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

  async function getBalance() {
    const res = await fetch(`${API}/balance?user=${userId}`);
    const data = await res.json();
    return data.balance;
  }

  async function updateBalance() {
    const bal = await getBalance();
    balanceEl.innerText = bal.toFixed(2) + " TON";
    balanceProfile.innerText = bal.toFixed(2) + " TON";
  }

  updateBalance();
  setInterval(updateBalance, 5000);

  // Открытие Unlucky Case
  openUnlucky.onclick = async () => {
    const balance = await getBalance();
    if (balance < CASE_PRICE) {
      return alert("Недостаточно баланса");
    }

    caseModal.style.display = "flex";
    document.querySelector(".caseTitle").innerText = "Unlucky Case";
  };

  closeCase.onclick = () => caseModal.style.display = "none";

  openCaseBtn.onclick = async () => {
    if (isSpinning) return;
    isSpinning = true;

    const balance = await getBalance();
    if (balance < CASE_PRICE) {
      isSpinning = false;
      return alert("Недостаточно баланса");
    }

    const prize = randomPrize();

    strip.innerHTML = "";
    const itemsCount = 60;
    const stripItems = [];

    for (let i = 0; i < itemsCount; i++) {
      const item = prizes[Math.floor(Math.random() * prizes.length)];
      stripItems.push(item);
    }

    stripItems.push(prize);

    stripItems.forEach(item => {
      const div = document.createElement("div");
      div.className = "drop";
      div.innerText = item.type === "ton" ? `${item.value} TON` : item.value;
      strip.appendChild(div);
    });

    const itemWidth = 218;
    const targetIndex = stripItems.length - 1;
    const stripWrapWidth = document.querySelector(".stripWrap").clientWidth;

    const targetX = targetIndex * itemWidth - (stripWrapWidth / 2 - itemWidth / 2);

    strip.style.transition = "transform 5s cubic-bezier(.17,.67,.3,1)";
    strip.style.transform = `translateX(-${targetX}px)`;

    setTimeout(async () => {
      isSpinning = false;

      // списываем баланс
      await fetch(`${API}/remove-balance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: userId, amount: CASE_PRICE })
      });

      updateBalance();

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
        updateBalance();
      };

      rewardBtnInv.onclick = async () => {
        await fetch(`${API}/add-nft`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user: userId, nft: { name: prize.value, price: 3.27 } })
        });
        rewardModal.style.display = "none";
      };

      rewardBtnSell.onclick = async () => {
        await fetch(`${API}/add-balance`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user: userId, amount: 3.27 })
        });
        rewardModal.style.display = "none";
        updateBalance();
      };

    }, 5200);
  };
});.style.display = "flex";
  };

  closeInventory.onclick = () => inventoryModal.style.display = "none";
});

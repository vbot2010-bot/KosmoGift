document.addEventListener("DOMContentLoaded", () => {
  const API = "https://kosmogift-worker.v-bot-2010.workers.dev";
  const user = window.Telegram.WebApp.initDataUnsafe.user || {};
  const userId = String(user.id);

  const openUnlucky = document.getElementById("openUnlucky");

  const caseModal = document.getElementById("caseModal");
  const closeCase = document.getElementById("closeCase");
  const openCaseBtn = document.getElementById("openCaseBtn");
  const strip = document.getElementById("strip");

  const rewardModal = document.getElementById("rewardModal");
  const rewardText = document.getElementById("rewardText");
  const rewardBtnTon = document.getElementById("rewardBtnTon");
  const rewardBtnSell = document.getElementById("rewardBtnSell");
  const rewardBtnInv = document.getElementById("rewardBtnInv");

  let isSpinning = false;
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

  openUnlucky.onclick = async () => {
    const bal = await getBalance();
    if (bal < CASE_PRICE) {
      alert("Недостаточно баланса");
      return;
    }

    caseModal.style.display = "flex";
    document.querySelector(".caseHeader .caseTitle").innerText = "Unlucky Case";
  };

  closeCase.onclick = () => {
    caseModal.style.display = "none";
  };

  openCaseBtn.onclick = async () => {
    if (isSpinning) return;
    isSpinning = true;

    const bal = await getBalance();
    if (bal < CASE_PRICE) {
      isSpinning = false;
      return alert("Недостаточно баланса");
    }

    // списываем баланс
    await fetch(`${API}/remove-balance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user: userId,
        amount: CASE_PRICE
      })
    });

    const prize = randomPrize();
    strip.innerHTML = "";

    for (let i = 0; i < 50; i++) {
      const p = prizes[Math.floor(Math.random() * prizes.length)];
      const d = document.createElement("div");
      d.className = "drop";
      d.innerText = p.type === "ton" ? `${p.value} TON` : p.value;
      strip.appendChild(d);
    }

    const win = document.createElement("div");
    win.className = "drop";
    win.innerText = prize.type === "ton" ? `${prize.value} TON` : prize.value;
    strip.appendChild(win);

    strip.style.transition = "transform 5s cubic-bezier(.17,.67,.3,1)";
    strip.style.transform = `translateX(-${(strip.children.length - 1) * 218}px)`;

    setTimeout(() => {
      isSpinning = false;

      rewardModal.style.display = "flex";
      rewardText.innerText =
        prize.type === "ton"
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
      };

      rewardBtnInv.onclick = async () => {
        await fetch(`${API}/add-nft`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user: userId,
            nft: { name: prize.value, price: 3.27 }
          })
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
      };
    }, 5200);
  };
});

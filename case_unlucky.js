document.addEventListener("DOMContentLoaded", () => {
  const openUnlucky = document.getElementById("openUnlucky");
  const caseModal = document.getElementById("caseModal");
  const caseModalTitle = document.getElementById("caseModalTitle");
  const openCaseBtn = document.getElementById("openCaseBtn");
  const strip = document.getElementById("strip");
  const rewardModal = document.getElementById("rewardModal");
  const rewardText = document.getElementById("rewardText");
  const rewardBtnTon = document.getElementById("rewardBtnTon");

  const API = "https://kosmogift-worker.v-bot-2010.workers.dev";
  const COST = 0.25;

  let spinning = false;
  let currentPrize = null;

  const prizes = [
    { value: 0.2, chance: 70 },
    { value: 0.35, chance: 19 },
    { value: 0.6, chance: 7 },
    { value: 1, chance: 2.5 }
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

  function buildStrip(winValue) {
    strip.innerHTML = "";
    strip.style.transition = "none";
    strip.style.transform = "translateX(0)";

    // мусор
    for (let i = 0; i < 40; i++) {
      const d = document.createElement("div");
      d.className = "drop";
      d.innerText =
        prizes[Math.floor(Math.random() * prizes.length)].value + " TON";
      strip.appendChild(d);
    }

    // выигрыш
    const win = document.createElement("div");
    win.className = "drop";
    win.innerText = winValue + " TON";
    strip.appendChild(win);
  }

  openUnlucky.onclick = () => {
    caseModalTitle.innerText = "Unlucky Case";
    caseModal.style.display = "flex";
  };

  openCaseBtn.onclick = async () => {
    if (spinning) return;
    spinning = true;

    currentPrize = rollPrize();
    buildStrip(currentPrize.value);

    requestAnimationFrame(() => {
      strip.style.transition = "transform 4.5s cubic-bezier(.12,.8,.25,1)";
      strip.style.transform = "translateX(-4200px)";
    });

    setTimeout(async () => {
      await fetch(`${API}/add-balance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: Telegram.WebApp.initDataUnsafe.user.id,
          amount: -COST
        })
      });

      rewardText.innerText = `Вы выиграли ${currentPrize.value} TON`;
      rewardModal.style.display = "flex";
      spinning = false;
    }, 4600);
  };

  rewardBtnTon.onclick = async () => {
    await fetch(`${API}/add-balance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user: Telegram.WebApp.initDataUnsafe.user.id,
        amount: currentPrize.value
      })
    });

    rewardModal.style.display = "none";
  };
});

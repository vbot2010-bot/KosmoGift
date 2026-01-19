document.addEventListener("DOMContentLoaded", async () => {
  const tg = window.Telegram.WebApp;
  tg.expand();

  const user = tg.initDataUnsafe.user;
  if (!user) {
    alert("Открой через Telegram");
    return;
  }

  const userId = String(user.id);
  const API = "https://kosmogift-worker.v-bot-2010.workers.dev";

  /* ========= ELEMENTS ========= */
  const balanceEl = document.getElementById("balance");
  const balanceProfile = document.getElementById("balanceProfile");
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

  const openInventory = document.getElementById("openInventory");
  const inventoryModal = document.getElementById("inventoryModal");
  const inventoryList = document.getElementById("inventoryList");
  const closeInventory = document.getElementById("closeInventory");

  /* ========= AVATAR ========= */
  document.getElementById("avatar").src = user.photo_url || "";
  document.getElementById("profileAvatar").src = user.photo_url || "";
  document.getElementById("username").innerText = user.username || "User";

  /* ========= BALANCE ========= */
  async function updateBalance() {
    const r = await fetch(`${API}/balance?user=${userId}`);
    const d = await r.json();
    balanceEl.innerText = d.balance.toFixed(2) + " TON";
    balanceProfile.innerText = d.balance.toFixed(2) + " TON";
  }
  await updateBalance();

  /* ========= CASE LOGIC ========= */
  const prizes = [
    { type: "ton", value: 0.01, chance: 85 },
    { type: "ton", value: 0.02, chance: 10 },
    { type: "ton", value: 0.05, chance: 4 },
    { type: "nft", value: "LOL POP", price: 0.5, chance: 1 }
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

  /* ========= OPEN CASE ========= */
  openDaily.onclick = () => {
    caseModal.style.display = "flex";
  };

  closeCase.onclick = () => {
    caseModal.style.display = "none";
  };

  openCaseBtn.onclick = () => {
    const prize = rollPrize();
    strip.innerHTML = "";

    for (let i = 0; i < 30; i++) {
      const d = document.createElement("div");
      d.className = "drop";
      d.innerText = prize.type === "ton"
        ? `${prize.value} TON`
        : prize.value;
      strip.appendChild(d);
    }

    strip.style.transition = "transform 5s cubic-bezier(.17,.67,.3,1)";
    strip.style.transform = "translateX(-1800px)";

    setTimeout(() => {
      rewardModal.style.display = "flex";
      rewardText.innerText =
        prize.type === "ton"
          ? `Вы выиграли ${prize.value} TON`
          : `Вы выиграли NFT ${prize.value}`;

      rewardBtnTon.style.display = prize.type === "ton" ? "block" : "none";
      rewardBtnInv.style.display = prize.type === "nft" ? "block" : "none";
      rewardBtnSell.style.display = prize.type === "nft" ? "block" : "none";

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
          body: JSON.stringify({ user: userId, nft: prize })
        });
        rewardModal.style.display = "none";
        caseModal.style.display = "none";
      };

      rewardBtnSell.onclick = async () => {
        await fetch(`${API}/add-balance`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user: userId, amount: prize.price })
        });
        rewardModal.style.display = "none";
        caseModal.style.display = "none";
        updateBalance();
      };

    }, 5200);
  };

  /* ========= INVENTORY ========= */
  openInventory.onclick = async () => {
    const r = await fetch(`${API}/inventory?user=${userId}`);
    const inv = await r.json();

    inventoryList.innerHTML = "";
    inv.forEach(item => {
      const div = document.createElement("div");
      div.className = "itemCard";
      div.innerText = item.name;
      inventoryList.appendChild(div);
    });

    inventoryModal.style.display = "flex";
  };

  closeInventory.onclick = () => {
    inventoryModal.style.display = "none";
  };
});

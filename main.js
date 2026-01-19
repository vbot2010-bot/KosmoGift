document.addEventListener("DOMContentLoaded", async () => {
  const tg = window.Telegram.WebApp;
  tg.expand();

  const user = tg.initDataUnsafe.user;
  const userId = String(user.id);
  const API = "https://kosmogift-worker.v-bot-2010.workers.dev";

  const balanceEl = document.getElementById("balance");
  const balanceProfile = document.getElementById("balanceProfile");

  document.getElementById("avatar").src = user.photo_url;
  document.getElementById("profileAvatar").src = user.photo_url;
  document.getElementById("username").innerText = user.username;

  document.getElementById("btnHome").onclick = () => switchPage("home");
  document.getElementById("btnProfile").onclick = () => switchPage("profile");

  function switchPage(id) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById(id).classList.add("active");
  }

  async function updateBalance() {
    const r = await fetch(`${API}/balance?user=${userId}`);
    const d = await r.json();
    balanceEl.innerText = d.balance.toFixed(2) + " TON";
    balanceProfile.innerText = d.balance.toFixed(2) + " TON";
  }

  await updateBalance();

  const prizes = [
    { type: "ton", value: 0.01, chance: 85 },
    { type: "ton", value: 0.02, chance: 10 },
    { type: "ton", value: 0.05, chance: 4 },
    { type: "nft", value: "LOL POP", price: 0.5, chance: 1 }
  ];

  function rollPrize() {
    let r = Math.random() * 100;
    let s = 0;
    for (const p of prizes) {
      s += p.chance;
      if (r <= s) return p;
    }
  }

  document.getElementById("openDaily").onclick = async () => {
    const r = await fetch(`${API}/daily?user=${userId}`);
    const d = await r.json();
    if (d.error) return alert("Кейс уже открывался");
    document.getElementById("caseModal").style.display = "flex";
  };

  document.getElementById("openCaseBtn").onclick = async () => {
    const prize = rollPrize();
    const strip = document.getElementById("strip");
    strip.innerHTML = "";

    for (let i = 0; i < 30; i++) {
      const div = document.createElement("div");
      div.className = "drop";
      div.innerText = prize.type === "ton" ? `${prize.value} TON` : prize.value;
      strip.appendChild(div);
    }

    strip.style.transition = "transform 5s cubic-bezier(.17,.67,.3,1)";
    strip.style.transform = "translateX(-1800px)";

    setTimeout(() => {
      document.getElementById("rewardModal").style.display = "flex";
      document.getElementById("rewardText").innerText =
        prize.type === "ton"
          ? `Вы выиграли ${prize.value} TON`
          : `Вы выиграли NFT ${prize.value}`;

      document.getElementById("rewardBtnTon").onclick = async () => {
        await fetch(`${API}/add-balance`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user: userId, amount: prize.value })
        });
        await updateBalance();
      };

      document.getElementById("rewardBtnInv").onclick = async () => {
        await fetch(`${API}/add-nft`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user: userId, nft: prize })
        });
      };
    }, 5200);
  };
});

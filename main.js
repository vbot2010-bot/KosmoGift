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
  const resultText = document.getElementById("resultText");

  const inventoryModal = document.getElementById("inventoryModal");
  const closeInventory = document.getElementById("closeInventory");
  const inventoryList = document.getElementById("inventoryList");

  const connectWallet = document.getElementById("connectWallet");
  const disconnectWallet = document.getElementById("disconnectWallet");
  const deposit = document.getElementById("deposit");

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
    resultText.innerText = "Нажми «Открыть кейс»";
  };

  closeCase.onclick = () => caseModal.style.display = "none";

  openCaseBtn.onclick = async () => {
    const r = await fetch(`${API}/daily?user=${userId}`);
    const d = await r.json();

    if (!d.ok) return;

    resultText.innerText = `Вы выиграли ${d.reward} TON + предмет`;
    loadBalance();
  };

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
        <div>${item.name}</div>
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

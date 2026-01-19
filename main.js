document.addEventListener("DOMContentLoaded", () => {

  const tg = window.Telegram.WebApp;
  tg.expand();

  const user = tg.initDataUnsafe.user || {};
  const userId = user.id;

  const avatar = document.getElementById("avatar");
  const profileAvatar = document.getElementById("profileAvatar");
  const username = document.getElementById("username");

  const btnHome = document.getElementById("btnHome");
  const btnProfile = document.getElementById("btnProfile");

  const connectWallet = document.getElementById("connectWallet");
  const disconnectWallet = document.getElementById("disconnectWallet");

  const deposit = document.getElementById("deposit");
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

  const API_URL = "https://kosmogift-worker.v-bot-2010.workers.dev";

  let subscribed = false;

  // avatar
  avatar.src = user.photo_url || "";
  profileAvatar.src = user.photo_url || "";
  username.innerText = user.username || "User";

  // NAV
  btnHome.onclick = () => switchPage("home");
  btnProfile.onclick = () => switchPage("profile");

  function switchPage(id) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById(id).classList.add("active");
  }

  // TON CONNECT
  const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
    manifestUrl: "https://kosmogift.pages.dev/tonconnect-manifest.json"
  });

  connectWallet.onclick = async () => {
    try {
      await tonConnectUI.connect();
    } catch (e) {
      alert("Подключение кошелька отменено");
    }
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

  // DAILY CASE
  openDaily.onclick = async () => {

    if (!subscribed) {
      subscribeModal.style.display = "flex";
      return;
    }

    const res = await fetch(API_URL + "/daily?user_id=" + userId);
    const d = await res.json();

    if (d.error === "already") {
      alert("Кейс можно открыть раз в 24 часа");
      return;
    }

    caseModal.style.display = "flex";
    resultText.innerText = "Нажми \"Открыть кейс\"";
  };

  subscribeBtn.onclick = () => {
    tg.openUrl("https://t.me/KosmoGiftOfficial");
    subscribed = true;
    subscribeModal.style.display = "none";
  };

  closeCase.onclick = () => caseModal.style.display = "none";

  openCaseBtn.onclick = async () => {
    const rnd = Math.random() * 100;
    let prize;

    if (rnd < 90) prize = { type: "ton", amount: 0.01 };
    else if (rnd < 95) prize = { type: "ton", amount: 0.02 };
    else if (rnd < 97.5) prize = { type: "ton", amount: 0.03 };
    else if (rnd < 98.5) prize = { type: "ton", amount: 0.04 };
    else if (rnd < 99.25) prize = { type: "ton", amount: 0.05 };
    else if (rnd < 99.75) prize = { type: "ton", amount: 0.06 };
    else if (rnd < 99.99) prize = { type: "ton", amount: 0.07 };
    else prize = { type: "nft", name: "lol pop" };

    if (prize.type === "ton") {
      await fetch(API_URL + "/add-ton", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, amount: prize.amount })
      });

      resultText.innerText = `Вы выиграли ${prize.amount} TON`;
    } else {
      await fetch(API_URL + "/add-nft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, nft: { name: prize.name } })
      });

      resultText.innerText = `Вы выиграли NFT: ${prize.name}`;
    }
  };

  // INVENTORY
  closeInventory.onclick = () => inventoryModal.style.display = "none";

  openInventory.onclick = async () => {
    inventoryModal.style.display = "flex";

    const res = await fetch(API_URL + "/inventory?user_id=" + userId);
    const d = await res.json();

    inventoryList.innerHTML = "";

    d.inventory.forEach((item, idx) => {
      const el = document.createElement("div");
      el.className = "inventoryItem";
      el.innerHTML = `
        <div>${item.name || item.type}</div>
        <button data-idx="${idx}" class="sellBtn">Продать</button>
      `;
      inventoryList.appendChild(el);
    });

    document.querySelectorAll(".sellBtn").forEach(btn => {
      btn.onclick = async () => {
        const idx = btn.getAttribute("data-idx");
        const item = d.inventory[idx];
        const price = item.name === "lol pop" ? 3.26 : 0;

        await fetch(API_URL + "/sell-nft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, nft_name: item.name, price })
        });

        alert("Продано!");
        openInventory.click();
      };
    });
  };
});

const tg = window.Telegram.WebApp;
tg.expand();

const user = tg.initDataUnsafe.user || {};
const userId = user.id;

const API_URL = "https://kosmogift-worker.v-bot-2010.workers.dev";
const TON_WALLET_ADDRESS = "UQAFXBXzBzau6ZCWzruiVrlTg3HAc8MF6gKIntqTLDifuWOi"; // <-- сюда вставь адрес

// UI
const balance = document.getElementById("balance");
const balanceProfile = document.getElementById("balanceProfile");

const btnHome = document.getElementById("btnHome");
const btnProfile = document.getElementById("btnProfile");

const openDaily = document.getElementById("openDaily");
const openCaseBtn = document.getElementById("openCaseBtn");
const caseModal = document.getElementById("caseModal");
const resultText = document.getElementById("resultText");
const closeCase = document.getElementById("closeCase");

const deposit = document.getElementById("deposit");

const openInventory = document.getElementById("openInventory");
const inventoryModal = document.getElementById("inventoryModal");
const closeInventory = document.getElementById("closeInventory");
const inventoryList = document.getElementById("inventoryList");

const subscribeModal = document.getElementById("subscribeModal");
const subscribeBtn = document.getElementById("subscribeBtn");

const avatar = document.getElementById("avatar");
const profileAvatar = document.getElementById("profileAvatar");
const username = document.getElementById("username");

let balanceValue = 0;
let inventory = [];
let subscribed = localStorage.getItem("subscribed") === "true";

// TONCONNECT
const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
  manifestUrl: "https://kocmogift-v22.vercel.app/tonconnect-manifest.json"
});
let wallet = null;

async function loadBalance() {
  const res = await fetch(API_URL + "/balance?user_id=" + userId);
  const data = await res.json();
  balanceValue = parseFloat(data.balance || 0);
  balance.innerText = balanceValue.toFixed(2) + " TON";
  balanceProfile.innerText = balanceValue.toFixed(2) + " TON";
}
loadBalance();

async function loadInventory() {
  const res = await fetch(API_URL + "/inventory?user_id=" + userId);
  const data = await res.json();
  inventory = data.inventory || [];
}

// NAV
btnHome.onclick = () => switchPage("home");
btnProfile.onclick = () => switchPage("profile");

function switchPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

// USER INFO
avatar.src = user.photo_url || "";
profileAvatar.src = user.photo_url || "";
username.innerText = user.username || "Telegram User";

// TONCONNECT BUTTONS
document.getElementById("connectWallet").onclick = async () => {
  const result = await tonConnectUI.connect();
  wallet = result.account;

  document.getElementById("connectWallet").style.display = "none";
  document.getElementById("disconnectWallet").style.display = "block";
};

document.getElementById("disconnectWallet").onclick = async () => {
  await tonConnectUI.disconnect();
  wallet = null;

  document.getElementById("connectWallet").style.display = "block";
  document.getElementById("disconnectWallet").style.display = "none";
};

// SUBSCRIBE
openDaily.onclick = async () => {
  if (!subscribed) {
    subscribeModal.style.display = "flex";
    return;
  }

  caseModal.style.display = "flex";
  resultText.innerText = "Нажми \"Открыть кейс\"";
};

subscribeBtn.onclick = () => {
  tg.openLink("https://t.me/KosmoGiftOfficial");
  subscribed = true;
  localStorage.setItem("subscribed", "true");
  subscribeModal.style.display = "none";
  caseModal.style.display = "flex";
  resultText.innerText = "Нажми \"Открыть кейс\"";
};

subscribeModal.onclick = (e) => {
  if (e.target === subscribeModal) subscribeModal.style.display = "none";
};

caseModal.onclick = (e) => {
  if (e.target === caseModal) caseModal.style.display = "none";
};

closeCase.onclick = () => caseModal.style.display = "none";

// OPEN CASE
openCaseBtn.onclick = async () => {
  openCaseBtn.disabled = true;

  const res = await fetch(API_URL + "/open-daily", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId })
  });

  const data = await res.json();

  if (data.error) {
    alert(data.error);
    openCaseBtn.disabled = false;
    return;
  }

  const prize = data.prize;

  if (prize.type === "ton") {
    resultText.innerText = `Выпало: ${prize.value} TON`;
    // добавляем TON на баланс
    await fetch(API_URL + "/add-ton", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, amount: prize.value })
    });
    await loadBalance();
  } else {
    resultText.innerText = `Выпало: ${prize.name}`;
    // добавляем NFT в инвентарь
    await fetch(API_URL + "/add-nft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, nft: prize })
    });
  }

  openCaseBtn.disabled = false;
};

// INVENTORY
openInventory.onclick = async () => {
  await loadInventory();
  inventoryModal.style.display = "flex";
  renderInventory();
};

closeInventory.onclick = () => inventoryModal.style.display = "none";

function renderInventory() {
  inventoryList.innerHTML = "";
  if (inventory.length === 0) {
    inventoryList.innerHTML = "<div>Инвентарь пуст</div>";
    return;
  }

  inventory.forEach(i => {
    const div = document.createElement("div");
    div.className = "itemCard";
    div.innerHTML = `
      <div>${i.name}</div>
      <div>Цена: ${i.price} TON</div>
      <button class="sellBtn">Продать</button>
    `;
    inventoryList.appendChild(div);

    div.querySelector(".sellBtn").onclick = async () => {
      const res = await fetch(API_URL + "/sell-nft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, nft_name: i.name, price: i.price })
      });
      const data = await res.json();
      if (!data.error) {
        inventory = data.inventory;
        await loadBalance();
        renderInventory();
      }
    };
  });
}

// DEPOSIT (пополнение)
deposit.onclick = async () => {
  const amount = parseFloat(prompt("Сколько TON пополнить? (минимум 0.1)"));

  if (!amount || isNaN(amount) || amount < 0.1) {
    alert("Минимальная сумма пополнения 0.1 TON");
    return;
  }

  if (!wallet) {
    alert("Сначала подключите кошелёк");
    return;
  }

  // создаём платеж в worker
  const res = await fetch(API_URL + "/create-payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, amount })
  });
  const data = await res.json();
  const paymentId = data.paymentId;

  // проверка платежа каждые 3 секунды
  const interval = setInterval(async () => {
    const res2 = await fetch(API_URL + "/check-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payment_id: paymentId })
    });

    const d = await res2.json();

    if (d.status === "paid" || d.ok) {
      clearInterval(interval);
      await loadBalance();
      alert("Пополнение успешно!");
    }
  }, 3000);

  alert("Платёж создан. Подтвердите оплату в TONConnect.");
};

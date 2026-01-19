
const tg = window.Telegram.WebApp;
tg.expand();

const user = tg.initDataUnsafe.user || {};
const userId = user.id;

const avatar = document.getElementById("avatar");
const profileAvatar = document.getElementById("profileAvatar");
const username = document.getElementById("username");
const balance = document.getElementById("balance");
const balanceProfile = document.getElementById("balanceProfile");

const btnHome = document.getElementById("btnHome");
const btnProfile = document.getElementById("btnProfile");

const connectWallet = document.getElementById("connectWallet");
const disconnectWallet = document.getElementById("disconnectWallet");
const deposit = document.getElementById("deposit");

const modal = document.getElementById("modal");
const amountInput = document.getElementById("amount");
const pay = document.getElementById("pay");
const closeModal = document.getElementById("closeModal");

const subscribeModal = document.getElementById("subscribeModal");
const subscribeBtn = document.getElementById("subscribeBtn");

const caseModal = document.getElementById("caseModal");
const openDaily = document.getElementById("openDaily");
const openCaseBtn = document.getElementById("openCaseBtn");
const strip = document.getElementById("strip");
const resultText = document.getElementById("resultText");
const closeCase = document.getElementById("closeCase");

const inventoryModal = document.getElementById("inventoryModal");
const openInventory = document.getElementById("openInventory");
const closeInventory = document.getElementById("closeInventory");
const inventoryList = document.getElementById("inventoryList");

const API_URL = "https://kosmogift-worker.v-bot-2010.workers.dev";

avatar.src = user.photo_url || "";
profileAvatar.src = user.photo_url || "";
username.innerText = user.username || "Telegram User";

let balanceValue = 0;
let inventory = [];
let subscribed = localStorage.getItem("subscribed") === "true";

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

loadInventory();

btnHome.onclick = () => switchPage("home");
btnProfile.onclick = () => switchPage("profile");

function switchPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

openDaily.onclick = async () => {
  const res = await fetch(API_URL + "/daily?user_id=" + userId);
  const data = await res.json();

  if (!subscribed) {
    subscribeModal.style.display = "flex";
    return;
  }

  caseModal.style.display = "flex";
  buildStrip();
};

subscribeBtn.onclick = () => {
  tg.openLink("https://t.me/KosmoGiftOfficial");
  subscribed = true;
  localStorage.setItem("subscribed", "true");
  subscribeModal.style.display = "none";
  caseModal.style.display = "flex";
  buildStrip();
};

subscribeModal.onclick = (e) => {
  if (e.target === subscribeModal) subscribeModal.style.display = "none";
};

caseModal.onclick = (e) => {
  if (e.target === caseModal) caseModal.style.display = "none";
};

closeCase.onclick = () => caseModal.style.display = "none";

const prizes = [
  { name: "0.01 TON", value: 0.01 },
  { name: "0.02 TON", value: 0.02 },
  { name: "0.03 TON", value: 0.03 },
  { name: "0.04 TON", value: 0.04 },
  { name: "0.05 TON", value: 0.05 },
  { name: "0.06 TON", value: 0.06 },
  { name: "0.07 TON", value: 0.07 },
  { name: "NFT lol pop", nft: true, price: 3.26 }
];

function buildStrip() {
  strip.innerHTML = "";
  for (let i = 0; i < 8; i++) {
    for (let p of prizes) {
      const div = document.createElement("div");
      div.className = "drop";
      div.innerText = p.name;
      strip.appendChild(div);
    }
  }
}

function choosePrize() {
  const rnd = Math.random() * 100;
  if (rnd < 90) return prizes[0];
  if (rnd < 95) return prizes[1];
  if (rnd < 97.5) return prizes[2];
  if (rnd < 98.5) return prizes[3];
  if (rnd < 99.25) return prizes[4];
  if (rnd < 99.75) return prizes[5];
  if (rnd < 99.99) return prizes[6];
  return prizes[7];
}

openCaseBtn.onclick = async () => {
  openCaseBtn.disabled = true;

  const prize = choosePrize();

  // Полоса
  const targetIndex = prizes.findIndex(p => p.name === prize.name);
  const itemWidth = 200 + 18;
  const totalItems = prizes.length * 8;
  const targetPos = (totalItems / 2 + targetIndex) * itemWidth;
  const end = -targetPos;

  strip.style.transition = "transform 5s cubic-bezier(0.2, 0.8, 0.2, 1)";
  strip.style.transform = `translateX(${end}px)`;

  strip.addEventListener("transitionend", async () => {
    strip.style.transition = "none";

    resultText.innerText = "Выпало: " + prize.name;

    if (prize.nft) {
      await fetch(API_URL + "/add-nft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, nft: prize })
      });
    } else {
      await fetch(API_URL + "/add-ton", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, amount: prize.value })
      });
      await loadBalance();
    }

    openCaseBtn.disabled = false;
  }, { once: true });
};

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

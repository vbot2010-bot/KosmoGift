const apiUrl = "https://kosmogift-worker.v-bot-2010.workers.dev";

let userId = "user_" + Math.floor(Math.random() * 1000000);
let walletAddress = null;
let isSubscribed = false;
let subscribeShown = false;

const drops = [
  { name: "0.01 TON", value: 0.01, chance: 50 },
  { name: "0.02 TON", value: 0.02, chance: 25 },
  { name: "0.05 TON", value: 0.05, chance: 15 },
  { name: "0.1 TON", value: 0.1, chance: 8 },
  { name: "0.2 TON", value: 0.2, chance: 2 }
];

function getRandomDrop() {
  const totalChance = drops.reduce((a, b) => a + b.chance, 0);
  let random = Math.random() * totalChance;
  for (const drop of drops) {
    random -= drop.chance;
    if (random <= 0) return drop;
  }
  return drops[0];
}

async function getBalance() {
  const res = await fetch(`${apiUrl}/balance?user=${userId}`);
  const data = await res.json();
  return data.balance;
}

async function updateBalanceUI() {
  const bal = await getBalance();
  document.getElementById("balance").innerText = bal.toFixed(2) + " TON";
  document.getElementById("balanceProfile").innerText = bal.toFixed(2) + " TON";
}

async function addBalance(amount) {
  await fetch(`${apiUrl}/add-balance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user: userId, amount })
  });
  updateBalanceUI();
}

async function openInventory() {
  const res = await fetch(`${apiUrl}/inventory?user=${userId}`);
  const inv = await res.json();

  const list = document.getElementById("inventoryList");
  list.innerHTML = "";
  if (inv.length === 0) {
    list.innerHTML = "<div class='itemCard'>Инвентарь пуст</div>";
  } else {
    inv.forEach((nft, idx) => {
      const card = document.createElement("div");
      card.className = "itemCard";
      card.innerHTML = `
        <div>${nft.name} (${nft.price} TON)</div>
        <button onclick="sellNft(${idx})" class="caseBtn">Продать</button>
      `;
      list.appendChild(card);
    });
  }

  showModal("inventoryModal");
}

async function sellNft(index) {
  const res = await fetch(`${apiUrl}/sell-nft`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user: userId, index })
  });
  const data = await res.json();
  updateBalanceUI();
  openInventory();
}

function showModal(id) {
  document.getElementById(id).style.display = "flex";
}

function hideModal(id) {
  document.getElementById(id).style.display = "none";
}

/* NAVIGATION */
document.getElementById("btnHome").onclick = () => {
  document.getElementById("home").classList.add("active");
  document.getElementById("profile").classList.remove("active");
};
document.getElementById("btnProfile").onclick = () => {
  document.getElementById("profile").classList.add("active");
  document.getElementById("home").classList.remove("active");
};

/* WALLET */
document.getElementById("connectWallet").onclick = async () => {
  const ui = new TON_CONNECT_UI.TonConnectUI({
    manifestUrl: "https://kocmogift-v22.vercel.app/tonconnect-manifest.json"
  });

  const wallet = await ui.connect();
  walletAddress = wallet.account.address;
  document.getElementById("connectWallet").style.display = "none";
  document.getElementById("disconnectWallet").style.display = "block";
};

document.getElementById("disconnectWallet").onclick = () => {
  walletAddress = null;
  document.getElementById("connectWallet").style.display = "block";
  document.getElementById("disconnectWallet").style.display = "none";
};

/* DEPOSIT */
document.getElementById("deposit").onclick = () => {
  showModal("modal");
};

document.getElementById("closeModal").onclick = () => {
  hideModal("modal");
};

document.getElementById("pay").onclick = async () => {
  const amount = Number(document.getElementById("amount").value);
  if (amount < 0.1) return alert("Минимум 0.1 TON");

  await addBalance(amount);
  hideModal("modal");
};

/* INVENTORY */
document.getElementById("openInventory").onclick = () => {
  openInventory();
};

document.getElementById("closeInventory").onclick = () => {
  hideModal("inventoryModal");
};

/* DAILY CASE */
document.getElementById("openDaily").onclick = () => {
  if (!isSubscribed && !subscribeShown) {
    showModal("subscribeModal");
    subscribeShown = true;
    return;
  }

  showModal("caseModal");
};

document.getElementById("closeCase").onclick = () => {
  hideModal("caseModal");
};

document.getElementById("subscribeBtn").onclick = () => {
  window.open("https://t.me/KosmoGiftOfficial", "_blank");
  isSubscribed = true;
  hideModal("subscribeModal");
  showModal("caseModal");
};

/* ROULETTE */
document.getElementById("openCaseBtn").onclick = async () => {
  const strip = document.getElementById("strip");
  strip.innerHTML = "";

  const result = getRandomDrop();

  // build long strip with multiple repeats to show all
  for (let i = 0; i < 30; i++) {
    drops.forEach((d) => {
      const div = document.createElement("div");
      div.className = "drop";
      div.innerText = d.name;
      strip.appendChild(div);
    });
  }

  // animate 5 seconds
  strip.style.transition = "transform 5s cubic-bezier(0.25, 0.1, 0.25, 1)";
  strip.style.transform = `translateX(-${(drops.indexOf(result) + 5) * 220}px)`;

  setTimeout(async () => {
    document.getElementById("resultText").innerText = "Вы выиграли: " + result.name;

    // reward TON
    await addBalance(result.value);

    showModal("rewardModal");
    document.getElementById("rewardText").innerText = "Вы получили: " + result.name;
  }, 5200);
};

/* REWARD */
document.getElementById("rewardBtnTon").onclick = () => {
  hideModal("rewardModal");
  hideModal("caseModal");
};

document.getElementById("rewardBtnSell").onclick = async () => {
  const nft = { name: "NFT", price: 0.05 };
  await fetch(`${apiUrl}/add-nft`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user: userId, nft })
  });
  hideModal("rewardModal");
};

document.getElementById("rewardBtnInv").onclick = async () => {
  const nft = { name: "NFT", price: 0.05 };
  await fetch(`${apiUrl}/add-nft`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user: userId, nft })
  });
  hideModal("rewardModal");
};

updateBalanceUI();

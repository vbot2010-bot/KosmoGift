const tg = window.Telegram.WebApp;
tg.expand();

const user = tg.initDataUnsafe.user || {};
const userId = user.id;

const balance = document.getElementById("balance");
const balanceProfile = document.getElementById("balanceProfile");
const deposit = document.getElementById("deposit");
const connectWallet = document.getElementById("connectWallet");
const disconnectWallet = document.getElementById("disconnectWallet");

const API_URL = "https://kosmogift-worker.v-bot-2010.workers.dev";

let balanceValue = 0;

const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
  manifestUrl: "https://kosmogift.pages.dev/tonconnect-manifest.json"
});

function updateWalletButtons(wallet) {
  if (wallet) {
    connectWallet.style.display = "none";
    disconnectWallet.style.display = "block";
  } else {
    connectWallet.style.display = "block";
    disconnectWallet.style.display = "none";
  }
}

tonConnectUI.onStatusChange(wallet => {
  updateWalletButtons(wallet);
});

connectWallet.onclick = async () => {
  await tonConnectUI.connectWallet();
};

disconnectWallet.onclick = async () => {
  await tonConnectUI.disconnect();
};

async function loadBalance() {
  const res = await fetch(API_URL + "/balance?user_id=" + userId);
  const data = await res.json();
  balanceValue = parseFloat(data.balance || 0);
  balance.innerText = balanceValue.toFixed(2) + " TON";
  balanceProfile.innerText = balanceValue.toFixed(2) + " TON";
}
loadBalance();

deposit.onclick = async () => {
  const amount = parseFloat(prompt("Сколько TON пополнить? (минимум 0.1)"));

  if (!amount || isNaN(amount) || amount < 0.1) {
    return alert("Минимум 0.1 TON");
  }

  // 1) создаём платеж на сервере
  const createRes = await fetch(API_URL + "/create-payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, amount })
  });
  const createData = await createRes.json();

  if (createData.error) {
    return alert(createData.error);
  }

  const paymentId = createData.payment_id;

  // 2) отправка TON через TonConnect
  let tx;
  try {
    tx = await tonConnectUI.sendTransaction({
      validUntil: Math.floor(Date.now() / 1000) + 600,
      messages: [{
        address: "UQAFXBXzBzau6ZCWzruiVrlTg3HAc8MF6gKIntqTLDifuWOi",
        amount: (amount * 1e9).toString()
      }]
    });
  } catch (e) {
    return alert("Оплата отменена или не прошла.");
  }

  const txId = tx.id;
  if (!txId) return alert("Не удалось получить txId");

  // 3) проверяем платеж каждые 3 секунды
  const interval = setInterval(async () => {
    const res2 = await fetch(API_URL + "/check-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payment_id: paymentId, tx_id: txId })
    });
    const d = await res2.json();

    if (d.ok) {
      clearInterval(interval);
      await loadBalance();
      alert("Пополнение успешно!");
    }
  }, 3000);
};

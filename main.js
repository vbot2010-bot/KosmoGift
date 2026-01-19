const tg = window.Telegram.WebApp;
tg.expand();

const user = tg.initDataUnsafe.user || {};
const userId = user.id;

const balance = document.getElementById("balance");
const balanceProfile = document.getElementById("balanceProfile");
const deposit = document.getElementById("deposit");

const API_URL = "https://kosmogift-worker.v-bot-2010.workers.dev";

let balanceValue = 0;

async function loadBalance() {
  const res = await fetch(API_URL + "/balance?user_id=" + userId);
  const data = await res.json();
  balanceValue = parseFloat(data.balance || 0);
  balance.innerText = balanceValue.toFixed(2) + " TON";
  balanceProfile.innerText = balanceValue.toFixed(2) + " TON";
}
loadBalance();

deposit.onclick = async () => {
  const amount = prompt("Сколько TON пополнить?");
  if (!amount || isNaN(amount)) return;

  const res = await fetch(API_URL + "/create-payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, amount })
  });
  const data = await res.json();
  const paymentId = data.payment_id;

  // Проверяем каждые 3 секунды
  const interval = setInterval(async () => {
    const res2 = await fetch(API_URL + "/check-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payment_id: paymentId })
    });
    const d = await res2.json();
    if (d.ok) {
      clearInterval(interval);
      await loadBalance();
      alert("Пополнение успешно!");
    }
  }, 3000);
}

document.addEventListener("DOMContentLoaded", async () => {

  if (!window.Telegram?.WebApp) {
    alert("Запускай Mini App через Telegram");
    return;
  }

  const tg = window.Telegram.WebApp
  tg.expand()

  const userId = String(tg.initDataUnsafe.user.id)
  const API = "https://kosmogift-worker.v-bot-2010.workers.dev"

  // Elements
  const btnHome = document.getElementById("btnHome")
  const btnProfile = document.getElementById("btnProfile")

  const avatar = document.getElementById("avatar")
  const profileAvatar = document.getElementById("profileAvatar")
  const username = document.getElementById("username")

  const balance = document.getElementById("balance")
  const balanceProfile = document.getElementById("balanceProfile")

  const openDaily = document.getElementById("openDaily")
  const timerBlock = document.getElementById("timerBlock")
  const timerText = document.getElementById("timerText")

  const subscribeModal = document.getElementById("subscribeModal")
  const subscribeBtn = document.getElementById("subscribeBtn")

  const caseModal = document.getElementById("caseModal")
  const closeCase = document.getElementById("closeCase")
  const openCaseBtn = document.getElementById("openCaseBtn")
  const strip = document.getElementById("strip")
  const resultText = document.getElementById("resultText")

  const rewardModal = document.getElementById("rewardModal")
  const rewardText = document.getElementById("rewardText")
  const rewardBtnTon = document.getElementById("rewardBtnTon")
  const rewardBtnSell = document.getElementById("rewardBtnSell")
  const rewardBtnInv = document.getElementById("rewardBtnInv")

  const openInventory = document.getElementById("openInventory")
  const inventoryModal = document.getElementById("inventoryModal")
  const closeInventory = document.getElementById("closeInventory")
  const inventoryList = document.getElementById("inventoryList")

  const connectWallet = document.getElementById("connectWallet")
  const disconnectWallet = document.getElementById("disconnectWallet")
  const deposit = document.getElementById("deposit")

  // user
  avatar.src = tg.initDataUnsafe.user.photo_url || ""
  profileAvatar.src = tg.initDataUnsafe.user.photo_url || ""
  username.innerText = tg.initDataUnsafe.user.username || "Telegram User"

  // NAV
  function showPage(id) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"))
    document.getElementById(id).classList.add("active")
  }

  btnHome.onclick = () => showPage("home")
  btnProfile.onclick = () => showPage("profile")

  // BALANCE
  async function loadBalance() {
    const r = await fetch(`${API}/balance?user=${userId}`)
    const d = await r.json()
    balance.innerText = `${Number(d.balance).toFixed(2)} TON`
    balanceProfile.innerText = `${Number(d.balance).toFixed(2)} TON`
  }
  loadBalance()

  // TON CONNECT
  const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
    manifestUrl: "https://kosmogift.pages.dev/tonconnect-manifest.json"
  })

  connectWallet.onclick = async () => {
    try { await tonConnectUI.connectWallet() } catch {}
  }

  disconnectWallet.onclick = async () => {
    await tonConnectUI.disconnect()
  }

  tonConnectUI.onStatusChange(wallet => {
    connectWallet.style.display = wallet ? "none" : "block"
    disconnectWallet.style.display = wallet ? "block" : "none"
  })

  // DEPOSIT
  deposit.onclick = async () => {
    const amount = parseFloat(prompt("Сколько TON пополнить?"))
    if (!amount || amount < 0.1) return alert("Минимум 0.1 TON")

    await tonConnectUI.sendTransaction({
      validUntil: Math.floor(Date.now() / 1000) + 600,
      messages: [{
        address: "UQAFXBXzBzau6ZCWzruiVrlTg3HAc8MF6gKIntqTLDifuWOi",
        amount: String(amount * 1e9)
      }]
    })

    alert("Оплата отправлена")
  }

  // SUBSCRIBE
  function needSubscribe() {
    return !localStorage.getItem("subscribed")
  }

  subscribeBtn.onclick = () => {
    tg.openLink("https://t.me/KosmoGiftOfficial")
    localStorage.setItem("subscribed", "1")
    subscribeModal.style.display = "none"
  }

  // TIMER
  let timerInterval = null
  function startTimer(ms) {
    openDaily.style.display = "none"
    timerBlock.style.display = "block"

    const end = Date.now() + ms

    clearInterval(timerInterval)
    timerInterval = setInterval(() => {
      const diff = end - Date.now()
      if (diff <= 0) {
        clearInterval(timerInterval)
        timerBlock.style.display = "none"
        openDaily.style.display = "block"
        return
      }
      const h = String(Math.floor(diff / 3600000)).padStart(2, "0")
      const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0")
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0")
      timerText.innerText = `${h}:${m}:${s}`
    }, 1000)
  }

  async function checkDailyStatus() {
    const r = await fetch(`${API}/daily-status?user=${userId}`)
    const d = await r.json()
    if (d.remaining > 0) startTimer(d.remaining)
  }
  checkDailyStatus()

  // PRIZES
  const prizes = [
    { type: "ton", value: 0.01, chance: 90 },
    { type: "ton", value: 0.02, chance: 5 },
    { type: "ton", value: 0.03, chance: 2.5 },
    { type: "ton", value: 0.04, chance: 1 },
    { type: "ton", value: 0.05, chance: 0.75 },
    { type: "ton", value: 0.06, chance: 0.5 },
    { type: "ton", value: 0.07, chance: 0.24 },
    { type: "nft", value: "lol pop", chance: 0.01 }
  ]

  function randomPrize() {
    const r = Math.random() * 100
    let sum = 0
    for (const p of prizes) {
      sum += p.chance
      if (r <= sum) return p
    }
    return prizes[0]
  }

  // OPEN DAILY
  openDaily.onclick = async () => {
    if (needSubscribe()) {
      subscribeModal.style.display = "flex"
      return
    }

    const r = await fetch(`${API}/daily?user=${userId}`)
    const d = await r.json()

    if (d.error) {
      const status = await fetch(`${API}/daily-status?user=${userId}`)
      const st = await status.json()
      startTimer(st.remaining)
      return
    }

    caseModal.style.display = "flex"
  }

  closeCase.onclick = () => caseModal.style.display = "none"

  // OPEN CASE
  openCaseBtn.onclick = async () => {
  const prize = randomPrize();

  strip.innerHTML = "";
  for (let i = 0; i < 20; i++) {
    const div = document.createElement("div");
    div.className = "drop";
    div.innerText =
      prize.type === "ton" ? `${prize.value} TON` : prize.value;
    strip.appendChild(div);
  }

  strip.style.transition = "transform 3s cubic-bezier(.17,.67,.3,1)";
  strip.style.transform = "translateX(-600px)";

  setTimeout(async () => {
    rewardModal.style.display = "flex";
    rewardText.innerText =
      prize.type === "ton"
        ? `Вы выиграли ${prize.value} TON`
        : `Вы выиграли NFT "${prize.value}"`;

    if (prize.type === "ton") {
      rewardBtnTon.style.display = "block";
      rewardBtnSell.style.display = "none";
      rewardBtnInv.style.display = "none";

      rewardBtnTon.onclick = async () => {
        await fetch(`${API}/add-balance`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user: userId, amount: prize.value })
        });

        // ⛔ Таймер НЕ запускаем здесь
        rewardModal.style.display = "none";
        caseModal.style.display = "none";

        // ✅ СЮДА добавляем запуск таймера
        startDailyCooldown();
      }
    } else {
      rewardBtnTon.style.display = "none";
      rewardBtnSell.style.display = "block";
      rewardBtnInv.style.display = "block";

      const nft = { name: prize.value, price: 3.27 };

      rewardBtnInv.onclick = async () => {
        await fetch(`${API}/add-nft`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user: userId, nft })
        });

        rewardModal.style.display = "none";
        caseModal.style.display = "none";

        // ✅ Запуск таймера
        startDailyCooldown();
      }

      rewardBtnSell.onclick = async () => {
        await fetch(`${API}/add-balance`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user: userId, amount: 3.27 })
        });

        rewardModal.style.display = "none";
        caseModal.style.display = "none";

        // ✅ Запуск таймера
        startDailyCooldown();
      }
    }
  }, 3200);
                    }
  // INVENTORY
  openInventory.onclick = async () => {
    inventoryModal.style.display = "flex"
    inventoryList.innerHTML = ""

    const r = await fetch(`${API}/inventory?user=${userId}`)
    const inv = await r.json()

    inv.forEach((item, i) => {
      const div = document.createElement("div")
      div.className = "itemCard"
      div.innerHTML = `
        <div>${item.name} — ${item.price} TON</div>
        <button>Продать</button>
      `
      div.querySelector("button").onclick = async () => {
        await fetch(`${API}/sell-nft`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user: userId, index: i })
        })
        await loadBalance()
        openInventory.click()
      }
      inventoryList.appendChild(div)
    })
  }

  closeInventory.onclick = () => inventoryModal.style.display = "none"

})

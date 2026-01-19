document.addEventListener("DOMContentLoaded", async () => {
  const tg = window.Telegram.WebApp
  tg.expand()

  const userId = String(tg.initDataUnsafe.user.id)
  const API = "https://kosmogift-worker.v-bot-2010.workers.dev"

  // ================== ЭЛЕМЕНТЫ ==================
  const homeTab = document.getElementById("home")
  const profileTab = document.getElementById("profile")

  const btnHome = document.getElementById("btnHome")
  const btnProfile = document.getElementById("btnProfile")

  const openDaily = document.getElementById("openDaily")
  const timerBlock = document.getElementById("timerBlock")
  const timerText = document.getElementById("timerText")

  const subscribeModal = document.getElementById("subscribeModal")
  const subscribeBtn = document.getElementById("subscribeBtn")

  const caseModal = document.getElementById("caseModal")
  const closeCase = document.getElementById("closeCase")
  const openCaseBtn = document.getElementById("openCaseBtn")
  const strip = document.getElementById("strip")

  const rewardModal = document.getElementById("rewardModal")
  const rewardText = document.getElementById("rewardText")
  const rewardBtnTon = document.getElementById("rewardBtnTon")

  const connectWallet = document.getElementById("connectWallet")
  const disconnectWallet = document.getElementById("disconnectWallet")
  const depositBtn = document.getElementById("deposit")

  const balanceSpan = document.getElementById("balance")
  const balanceProfile = document.getElementById("balanceProfile")

  // ================== ВКЛАДКИ ==================
  btnHome.onclick = () => {
    homeTab.classList.add("active")
    profileTab.classList.remove("active")
  }
  btnProfile.onclick = () => {
    profileTab.classList.add("active")
    homeTab.classList.remove("active")
  }

  // ================== ПОДПИСКА ==================
  subscribeBtn.onclick = () => {
    window.open("https://t.me/ТВОЙ_КАНАЛ", "_blank")
  }

  // ================== ПРИЗЫ ==================
  const prizes = [
    { type: "ton", value: 0.01, chance: 90 },
    { type: "ton", value: 0.02, chance: 5 },
    { type: "ton", value: 0.03, chance: 2.5 },
    { type: "ton", value: 0.04, chance: 1 },
    { type: "ton", value: 0.05, chance: 0.75 },
    { type: "ton", value: 0.06, chance: 0.5 },
    { type: "ton", value: 0.07, chance: 0.24 },
    { type: "nft", value: "Super NFT", chance: 0.01 }
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

  function formatTime(ms) {
    const total = Math.floor(ms / 1000)
    const h = String(Math.floor(total / 3600)).padStart(2, "0")
    const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0")
    const s = String(total % 60).padStart(2, "0")
    return `${h}:${m}:${s}`
  }

  // ================== БАЛАНС ==================
  async function refreshBalance() {
    const res = await fetch(`${API}/balance?user=${userId}`)
    const data = await res.json()
    const bal = Number(data.balance).toFixed(2)

    balanceSpan.innerText = `${bal} TON`
    balanceProfile.innerText = `${bal} TON`
  }

  refreshBalance()

  // ================== ТАЙМЕР ==================
  function startCooldown() {
    fetch(`${API}/daily-status?user=${userId}`)
      .then(r => r.json())
      .then(data => {
        if (!data.ok) return

        const remaining = data.remaining

        if (remaining <= 0) {
          timerBlock.style.display = "none"
          openDaily.style.display = "block"
          openDaily.disabled = false
          return
        }

        // скрываем кнопку
        openDaily.style.display = "none"
        timerBlock.style.display = "block"

        const interval = setInterval(() => {
          const now = Date.now()
          const diff = data.last + 86400000 - now

          if (diff <= 0) {
            clearInterval(interval)
            timerBlock.style.display = "none"
            openDaily.style.display = "block"
            openDaily.disabled = false
          } else {
            timerText.innerText = formatTime(diff)
          }
        }, 1000)
      })
  }

  startCooldown()

  // ================== ОТКРЫТЬ КЕЙС ==================
  openDaily.onclick = async () => {
    const res = await fetch(`${API}/daily?user=${userId}`)
    const data = await res.json()

    if (data.error) {
      startCooldown()
      return alert("Кейс доступен раз в 24 часа")
    }

    caseModal.style.display = "flex"
  }

  closeCase.onclick = () => {
    caseModal.style.display = "none"
  }

  // ================== РУЛЕТКА ==================
  openCaseBtn.onclick = () => {
    const prize = randomPrize()

    strip.innerHTML = ""
    for (let i = 0; i < 30; i++) {
      const div = document.createElement("div")
      div.className = "drop"
      div.innerText =
        prize.type === "ton" ? `${prize.value} TON` : prize.value
      strip.appendChild(div)
    }

    strip.style.transition = "transform 3s cubic-bezier(.17,.67,.3,1)"
    strip.style.transform = "translateX(-1600px)"

    setTimeout(() => {
      rewardModal.style.display = "flex"
      rewardText.innerText =
        prize.type === "ton"
          ? `Вы выиграли ${prize.value} TON`
          : `Вы выиграли NFT: ${prize.value}`

      if (prize.type === "ton") {
        rewardBtnTon.style.display = "block"
        rewardBtnTon.onclick = async () => {
          await fetch(`${API}/add-balance`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user: userId, amount: prize.value })
          })

          rewardModal.style.display = "none"
          caseModal.style.display = "none"
          refreshBalance()
          startCooldown()
        }
      }
    }, 3200)
  }

  // ================== КОШЕЛЁК ==================
  let tonConnectUI = null
  let wallet = null

  connectWallet.onclick = async () => {
    if (!tonConnectUI) {
      tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
        manifestUrl: "https://kocmogift-v22.vercel.app/tonconnect-manifest.json"
      })
    }

    const result = await tonConnectUI.connect()
    wallet = result.account
    disconnectWallet.style.display = "block"
    connectWallet.style.display = "none"
    alert("Кошелёк подключён: " + wallet.address)
  }

  disconnectWallet.onclick = () => {
    wallet = null
    disconnectWallet.style.display = "none"
    connectWallet.style.display = "block"
    alert("Кошелёк отключён")
  }

  // ================== ПОПОЛНИТЬ БАЛАНС ==================
  depositBtn.onclick = () => {
    alert("Пока пополнение не реализовано. Это можно сделать через TON transfer.")
  }
})

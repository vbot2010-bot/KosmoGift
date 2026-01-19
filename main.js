document.addEventListener("DOMContentLoaded", async () => {
  const tg = window.Telegram.WebApp
  tg.expand()

  const userId = String(tg.initDataUnsafe.user.id)
  const API = "https://kosmogift-worker.v-bot-2010.workers.dev"

  const home = document.getElementById("home")
  const profile = document.getElementById("profile")

  const btnHome = document.getElementById("btnHome")
  const btnProfile = document.getElementById("btnProfile")

  const openDaily = document.getElementById("openDaily")
  const timerBlock = document.getElementById("timerBlock")
  const timerText = document.getElementById("timerText")

  const caseModal = document.getElementById("caseModal")
  const openCaseBtn = document.getElementById("openCaseBtn")
  const closeCase = document.getElementById("closeCase")
  const strip = document.getElementById("strip")

  const rewardModal = document.getElementById("rewardModal")
  const rewardText = document.getElementById("rewardText")
  const rewardBtnTon = document.getElementById("rewardBtnTon")
  const rewardBtnSell = document.getElementById("rewardBtnSell")
  const rewardBtnInv = document.getElementById("rewardBtnInv")

  const inventoryModal = document.getElementById("inventoryModal")
  const inventoryList = document.getElementById("inventoryList")
  const closeInventory = document.getElementById("closeInventory")

  const deposit = document.getElementById("deposit")
  const openInventory = document.getElementById("openInventory")

  const balanceEl = document.getElementById("balance")
  const balanceProfile = document.getElementById("balanceProfile")

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

  function showPage(page) {
    home.classList.remove("active")
    profile.classList.remove("active")
    page.classList.add("active")
  }

  btnHome.onclick = () => showPage(home)
  btnProfile.onclick = () => showPage(profile)

  async function updateBalance() {
    const res = await fetch(`${API}/balance?user=${userId}`)
    const data = await res.json()
    balanceEl.innerText = data.balance.toFixed(2) + " TON"
    balanceProfile.innerText = data.balance.toFixed(2) + " TON"
  }

  async function updateDailyTimer() {
    const res = await fetch(`${API}/daily-status?user=${userId}`)
    const data = await res.json()

    if (data.remaining > 0) {
      timerBlock.style.display = "block"
      openDaily.style.display = "none"

      const seconds = Math.floor(data.remaining / 1000)
      const h = String(Math.floor(seconds / 3600)).padStart(2, "0")
      const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0")
      const s = String(seconds % 60).padStart(2, "0")

      timerText.innerText = `${h}:${m}:${s}`
    } else {
      timerBlock.style.display = "none"
      openDaily.style.display = "block"
    }
  }

  setInterval(updateDailyTimer, 1000)
  updateDailyTimer()
  updateBalance()

  openDaily.onclick = async () => {
    const r = await fetch(`${API}/daily?user=${userId}`)
    const d = await r.json()
    if (d.error) return alert("Кейс доступен раз в 24 часа")
    caseModal.style.display = "flex"
  }

  closeCase.onclick = () => caseModal.style.display = "none"

  openCaseBtn.onclick = async () => {
    const prize = randomPrize()

    strip.innerHTML = ""
    for (let i = 0; i < 25; i++) {
      const div = document.createElement("div")
      div.className = "drop"
      div.innerText = prize.type === "ton" ? `${prize.value} TON` : prize.value
      strip.appendChild(div)
    }

    strip.style.transition = "transform 3.5s cubic-bezier(.17,.67,.3,1)"
    strip.style.transform = "translateX(-1200px)"

    setTimeout(async () => {
      rewardModal.style.display = "flex"
      rewardText.innerText =
        prize.type === "ton"
          ? `Вы выиграли ${prize.value} TON`
          : `Вы выиграли NFT "${prize.value}"`

      if (prize.type === "ton") {
        rewardBtnTon.style.display = "block"
        rewardBtnSell.style.display = "none"
        rewardBtnInv.style.display = "none"

        rewardBtnTon.onclick = async () => {
          await fetch(`${API}/add-balance`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user: userId, amount: prize.value })
          })
          rewardModal.style.display = "none"
          caseModal.style.display = "none"
          updateBalance()
        }
      } else {
        rewardBtnTon.style.display = "none"
        rewardBtnSell.style.display = "block"
        rewardBtnInv.style.display = "block"

        const nft = { name: prize.value, price: 3.27 }

        rewardBtnInv.onclick = async () => {
          await fetch(`${API}/add-nft`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user: userId, nft })
          })
          rewardModal.style.display = "none"
          caseModal.style.display = "none"
        }

        rewardBtnSell.onclick = async () => {
          await fetch(`${API}/add-balance`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user: userId, amount: 3.27 })
          })
          rewardModal.style.display = "none"
          caseModal.style.display = "none"
          updateBalance()
        }
      }
    }, 3500)
  }

  openInventory.onclick = async () => {
    const res = await fetch(`${API}/inventory?user=${userId}`)
    const inv = await res.json()

    inventoryList.innerHTML = ""
    inv.forEach((item, index) => {
      const card = document.createElement("div")
      card.className = "itemCard"
      card.innerHTML = `
        <div>${item.name}</div>
        <div>Цена: ${item.price} TON</div>
        <button data-index="${index}" class="sellBtn">Продать</button>
      `
      inventoryList.appendChild(card)
    })

    document.querySelectorAll(".sellBtn").forEach(btn => {
      btn.onclick = async () => {
        const idx = btn.dataset.index
        await fetch(`${API}/sell-nft`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user: userId, index: idx })
        })
        updateBalance()
        openInventory.click()
      }
    })

    inventoryModal.style.display = "flex"
  }

  closeInventory.onclick = () => inventoryModal.style.display = "none")

  deposit.onclick = async () => {
    const amount = prompt("Введите сумму для пополнения (минимум 0.1 TON):")
    if (!amount) return
    if (Number(amount) < 0.1) return alert("Минимальная сумма 0.1 TON")

    await fetch(`${API}/deposit-request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user: userId, amount })
    })

    const url = `https://tonkeeper.com/transfer/UQAFXBXzBzau6ZCWzruiVrlTg3HAc8MF6gKIntqTLDifuWOi?amount=${amount}`
    window.open(url, "_blank")

    alert("Платёж отправлен. Баланс обновится автоматически.")
  }

  // автоматическая проверка каждые 10 секунд
  setInterval(async () => {
    await fetch(`${API}/check-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user: userId })
    })
    updateBalance()
  }, 10000)

  document.getElementById("subscribeBtn").onclick = () => {
    window.open("https://t.me/KosmoGiftOfficial", "_blank")
  }
})

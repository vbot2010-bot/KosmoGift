document.addEventListener("DOMContentLoaded", async () => {
  const tg = window.Telegram.WebApp
  tg.expand()

  const userId = String(tg.initDataUnsafe.user.id)
  const API = "https://kosmogift-worker.v-bot-2010.workers.dev"

  const openDaily = document.getElementById("openDaily")
  const caseModal = document.getElementById("caseModal")
  const openCaseBtn = document.getElementById("openCaseBtn")
  const strip = document.getElementById("strip")

  const rewardModal = document.getElementById("rewardModal")
  const rewardText = document.getElementById("rewardText")
  const rewardBtnTon = document.getElementById("rewardBtnTon")
  const rewardBtnSell = document.getElementById("rewardBtnSell")
  const rewardBtnInv = document.getElementById("rewardBtnInv")

  const profileTab = document.getElementById("profile")
  const homeTab = document.getElementById("home")
  const btnHome = document.getElementById("btn-home")
  const btnProfile = document.getElementById("btn-profile")

  const subscribeBtn = document.getElementById("subscribeBtn")

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

  function startDailyCooldown() {
    fetch(`${API}/daily-status?user=${userId}`)
      .then(r => r.json())
      .then(d => {
        if (!d.ok) return
        const remaining = d.remaining

        if (remaining <= 0) {
          openDaily.style.display = "block"
          openDaily.innerText = "Открыть кейс"
          return
        }

        openDaily.style.display = "block"
        openDaily.innerText = formatTime(remaining)
        openDaily.disabled = true

        const interval = setInterval(() => {
          const r2 = remaining - (Date.now() - d.last)
          if (r2 <= 0) {
            clearInterval(interval)
            openDaily.innerText = "Открыть кейс"
            openDaily.disabled = false
          } else {
            openDaily.innerText = formatTime(r2)
          }
        }, 1000)
      })
  }

  function formatTime(ms) {
    const total = Math.floor(ms / 1000)
    const h = String(Math.floor(total / 3600)).padStart(2, "0")
    const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0")
    const s = String(total % 60).padStart(2, "0")
    return `${h}:${m}:${s}`
  }

  // вкладки
  btnHome.onclick = () => {
    homeTab.classList.add("active")
    profileTab.classList.remove("active")
  }
  btnProfile.onclick = () => {
    profileTab.classList.add("active")
    homeTab.classList.remove("active")
  }

  // кнопка подписаться
  subscribeBtn.onclick = () => {
    window.open("https://t.me/ТВОЙ_КАНАЛ", "_blank")
  }

  // старт таймера
  startDailyCooldown()

  openDaily.onclick = async () => {
    const r = await fetch(`${API}/daily?user=${userId}`)
    const d = await r.json()

    if (d.error) {
      startDailyCooldown()
      return alert("Кейс доступен раз в 24 часа")
    }

    caseModal.style.display = "flex"
  }

  openCaseBtn.onclick = async () => {
    const prize = randomPrize()

    strip.innerHTML = ""
    for (let i = 0; i < 20; i++) {
      const div = document.createElement("div")
      div.className = "drop"
      div.innerText =
        prize.type === "ton" ? `${prize.value} TON` : prize.value
      strip.appendChild(div)
    }

    strip.style.transition = "transform 3s cubic-bezier(.17,.67,.3,1)"
    strip.style.transform = "translateX(-1500px)" // круче крутится

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
          const res = await fetch(`${API}/add-balance`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user: userId, amount: prize.value })
          })

          const data = await res.json()
          if (data.ok) {
            rewardModal.style.display = "none"
            caseModal.style.display = "none"
            startDailyCooldown()
          } else {
            alert("Ошибка начисления")
          }
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
          startDailyCooldown()
        }

        rewardBtnSell.onclick = async () => {
          await fetch(`${API}/add-balance`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user: userId, amount: 3.27 })
          })
          rewardModal.style.display = "none"
          caseModal.style.display = "none"
          startDailyCooldown()
        }
      }
    }, 3200)
  }
})

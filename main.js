'use strict'

const PLAYERS_KEY = 'playerDB'
const gPlayers = loadFromLocalStorage(PLAYERS_KEY) || []

// Game state
var gTopScore
var gGameScore
var gIsUserTurn
var gIsSlowTime
var gNoteSeq // string of note numbers - example: '1214'
var gUserCurrNoteIdx // index of note in gNoteSeq that user should click next
var gChallengeInterval
var gSkipIntervalId
var gTime = 0
var gLevel = 1
var gStars = 0
var gCountWinning = 0
var gAudioLength = 1200
var gBalloonsNums = 4

function onInit() {
  document.querySelector('.modal img').src = `img/go${getRandomIntInclusive(1, 6)}.gif`
}

function renderPowerups() {
  const powerups = getPowerups()
  const strHTML = powerups.map((powerup) =>
    `
        <li>
            <img src="${powerup.imgUrl}" alt="powerup img" title="${powerup.title}" onclick="onUsePowerup('${powerup.name}')" />
            <span class="powerup-count">${powerup.count}</span>
        </li>
    `).join('')
  document.querySelector('.powerups-list').innerHTML = strHTML
}

function renderLeaderboards() {
  let strHTML = `
        <tr>
            <th>Level Reached</th>
            <th>Player</th>
        </tr>`

  if (!gPlayers.length) {

    strHTML += `
    <tr>
      <td>!כרגע הטבלה ריקה, אבל אנחנו בטוחים שאתה הראשון שיכנס אליה</td>
    </tr>`
  } else {
    strHTML += gPlayers.map((player) =>
      `
            <tr>
                <td>${player.score}</td>
                <td>${player.name}</td>
                </tr>
                `
    ).join('')
  }

  document.querySelector('.leaderboards').innerHTML = strHTML
}

function renderBalloonsNums() {
  var strHTML = ''
  for (var i = 0; i < gBalloonsNums; i++) {
    strHTML += `<button style="background-color: ${getRandomColor()}" onclick="onUserPress(this)">${i + 1
      }</button>`
  }
  document.querySelector('.game-container').innerHTML = strHTML
}

function onStart() {
  gGameScore = 0
  gNoteSeq = ''
  gIsUserTurn = false
  gTopScore = loadFromLocalStorage('topScore') || 0
  setPowerups()

  document.querySelector('.score').innerText = gGameScore
  document.querySelector('.top-score').innerText = gTopScore
  document.querySelector('.modal img').src = `img/go${getRandomIntInclusive(1, 6)}.gif`
  document.querySelector('.modal').classList.remove('show')
  document.querySelector('.action-container').classList.remove('none')
  let elTimer = document.querySelector('.timer-modal')
  gChallengeInterval = setInterval(() => {
    elTimer.innerHTML = `<span>${getTime(gTime)}</span>`
    gTime += 1000
  }, 1000)

  if (gBalloonsNums) renderBalloonsNums()
  renderPowerups()
  renderLeaderboards()
  playComputer()
}

function playComputer() {
  flashMsg('נָא לְהַקְשִׁיב...')
  gNoteSeq += getRandomIntInclusive(1, gBalloonsNums)

  const audioLengthModifier = gIsSlowTime ? gAudioLength / 2 : 0
  gIsSlowTime = false

  for (let i = 0; i < gNoteSeq.length; i++) {
    setTimeout(() => {
      const note = gNoteSeq.charAt(i)
      const el = document.querySelector(`.game-container > button:nth-child(${note})`)
      playNote(el, note)
    }, (i + 1) * (gAudioLength + audioLengthModifier))
  }

  setTimeout(() => {
    setUserTurn()
  }, gNoteSeq.length * (gAudioLength + audioLengthModifier))
}

function setUserTurn() {
  gIsUserTurn = true
  gUserCurrNoteIdx = 0
  flashMsg('תּוֹרֵךְ')
}

function onUserPress(elBtn) {
  if (!gIsUserTurn) return
  const note = gNoteSeq[gUserCurrNoteIdx]

  // user lost:
  if (elBtn.innerText !== note) {
    gCountWinning = 0
    gAudioLength = 1200
    gBalloonsNums = 4
    clearInterval(gChallengeInterval)
    flashMsg('אוּפְּסִי...')
    breakScreen()
    setTimeout(() => {
      gAudioWrong.play()
      document.querySelector('.action-container').classList.add('none')
      document.querySelector('.modal').classList.add('show')
      document.querySelector('.diff-container select').value = 4
      if (gGameScore > gTopScore && gGameScore > 2) {
        const isConfirm = confirm('לא יודע מה סיימון אמר מה הוא לא אמר, אתה אלוף! תרצה להיכנס לטבלה שלנו?')
        if (isConfirm) {
          const userName = prompt('מה שמך בישראל?')
          addUserToLeaderboards(userName)
        }
      }
    }, 3000)
    return
  }

  // user got it right
  playNote(elBtn, note)

  // is it the last note in the sequence?
  if (gUserCurrNoteIdx === gNoteSeq.length - 1) {
    gCountWinning++
    let maxLevelsInARow = loadFromLocalStorage('maxLevelsInARow')

    clearInterval(gSkipIntervalId)

    if (gLevel % 3 === 0) {
      document.querySelector('.user-msg').classList.add('powerup')
      addRandomPowerup()
      renderPowerups()
      flashMsg('זכית בתמריץ חדש!')
      gAudioPowerupAchieved.play()
    }

    gIsUserTurn = false
    gLevel++

    setTimeout(() => {
      gGameScore++
      document.querySelector('.score').innerText = gGameScore

      if (gLevel === 3 && gTime < 1000 * 30) {
        goodJob('וואו!! הצלחת להגיע לשלב 3 בפחות משלושים שניות קיבלת כוכב')
      }

      // user broke his record
      if (gGameScore > gTopScore && gGameScore > 2) {
        saveToLocalStorage('topScore', gGameScore)
        gAudioCheer.play()
        flashMsg(getCheer())
      } else {
        gAudioRight.play()
        flashMsg(getCompliment())
      }

      if (maxLevelsInARow < gCountWinning) {
        goodJob('שברת שיא בכמות השלבים שניצחת רצוף ! עוד כוכבב')
        saveToLocalStorage('maxLevelsInARow', gCountWinning)
      }
      setTimeout(() => {
        playComputer()
      }, 2000)
    }, gAudioLength)
  } else {
    gUserCurrNoteIdx++
  }
}

function onUsePowerup(powerupName) {
  if (!gIsUserTurn) return
  if (!isAllowedToUse(powerupName)) return

  decrementPowerupCount(powerupName)
  renderPowerups()

  switch (powerupName) {
    case 'next-note': {
      onTapNextNote()
      break
    }
    case 'skip-level': {
      gSkipIntervalId = setInterval(onTapNextNote, 700)
      break
    }
    case 'slow-time': {
      gIsSlowTime = true
      break
    }
  }
  gAudioPowerupUsed.play()
}

function addUserToLeaderboards(name) {
  gPlayers.unshift({ name, score: gGameScore })
  saveToLocalStorage(PLAYERS_KEY, gPlayers)
}

function onTapNextNote() {
  const nextNote = gNoteSeq.charAt(gUserCurrNoteIdx)
  const elBtn = getElBtn(nextNote)

  onUserPress(elBtn)
}

function playNote(elBtn, note) {
  const audioNote = gAudioNotes[note - 1]
  audioNote.pause()
  audioNote.currentTime = 0
  audioNote.play()
  elBtn.classList.add('pressed')
  setTimeout(() => {
    elBtn.classList.remove('pressed')
  }, 500)
}

function breakScreen() {
  gAudioBreak.play()
  const el = document.querySelector('.broken')
  el.style.display = 'block'
  setTimeout(() => {
    el.style.display = 'none'
  }, 2500)
}

function flashMsg(msg) {
  const elMsg = document.querySelector('.user-msg')
  elMsg.innerText = msg
  elMsg.classList.add('show')
  setTimeout(() => {
    elMsg.classList.remove('show')
    elMsg.classList.remove('powerup')
  }, 1500)
}

function goodJob(txt) {
  gStars++
  let elModal = document.querySelector('.modal')
  let elHealine = document.querySelector('.good-job-headline')
  let elStars = document.querySelector('.stars')
  let strForStarImg = ''
  for (let i = 0; i < gStars; i++) {
    strForStarImg += '<img src="img/star.png" height="50" width="50" alt="" />'
  }
  elStars.innerHTML = strForStarImg
  elHealine.innerText = txt
  elModal.classList.add('show', 'small')
  setTimeout(() => {
    elModal.classList.remove('show', 'small')
    elHealine.innerText = 'יש לך זכרון טוב ?'
  }, 1700)
}

function onSelectLevel(val) {
  gBalloonsNums = val
  gAudioLength = 1200 / Math.pow(gBalloonsNums, 1 / 1.5)
  onStart()
}

function onToggleLeaderboards() {
  document.querySelector('.leaderboards-container').classList.toggle('show')
  document.querySelector('.backdrop').classList.toggle('show')
}

function getElBtn(note) {
  return document.querySelector(`.game-container > button:nth-child(${note})`)
}

function getTime(time) {
  if (time < 10 * 1000) {
    return `0${time / 1000}`
  } else if (time >= 10) {
    return `${time / 1000}`
  }
}
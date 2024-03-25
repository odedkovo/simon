'use strict'

const PLAYERS_KEY = 'playerDB'
const gPlayers = loadFromLocalStorage(PLAYERS_KEY) || []

const gAudioPowerup = new Audio('sound/powerup.mp3')
const gAudioRight = new Audio('sound/right.mp3')
const gAudioWrong = new Audio('sound/wrong.mp3')
const gAudioCheer = new Audio('sound/cheer.mp3')
const gAudioBreak = new Audio('sound/broken.mp3')
const gAudioNotes = [
    new Audio('sound/note/1.mp3'),
    new Audio('sound/note/2.mp3'),
    new Audio('sound/note/3.mp3'),
    new Audio('sound/note/4.mp3'),
]

// Don't scare that kid
gAudioBreak.volume = 0.05
gAudioRight.volume = 0.05
gAudioWrong.volume = 0.05
gAudioCheer.volume = 0.1

// Game state:
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
var gPowerups
let gCountWinning = 0
var gAudioLength = 1200
var gBalloonsNums

gAudioPowerup.volume = 0.05
gAudioBreak.volume = 0.05
gAudioRight.volume = 0.05
gAudioWrong.volume = 0.05
gAudioCheer.volume = 0.1

function onInit() {
    document.querySelector('.modal img').src = `img/go${getRandomIntInclusive(1, 6)}.gif`
}

function renderPowerups() {
    const strHTML = gPowerups.map(powerup => `
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
        strHTML += 'כרגע הטבלה ריקה, אבל אנחנו בטוחים שאתה הראשון שיכנס אליה!'
    } else {
        strHTML += gPlayers.map(player => `
            <tr>
                <td>${player.record}</td>
                <td>${player.name}</td>
            </tr>
        `).join('')
    }

    document.querySelector('.leaderboards').innerHTML = strHTML
}

function onStart() {
    gGameScore = 0
    gNoteSeq = ''
    gIsUserTurn = false
    gTopScore = loadFromLocalStorage('topScore') || 0
    gPowerups = _createPowerups()

    document.querySelector('.score').innerText = gGameScore
    document.querySelector('.top-score').innerText = gTopScore
    document.querySelector('.modal img').src = `img/go${getRandomIntInclusive(1, 6)}.gif`
    document.querySelector('.modal').classList.remove('show')
    
    gChallengeInterval = setInterval(() => {
        gTime += 1000
    }, 1000)
    
    if (gBalloonsNums) renderBalloonsNums()
    renderPowerups()
    renderLeaderboards()
    playComputer()
}

function playComputer() {
    flashMsg('נָא לְהַקְשִׁיב...')
    gNoteSeq += getRandomIntInclusive(1, 4)

    const audioLengthModifier = gIsSlowTime ? (gAudioLength / 2) : 0
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
    console.log('gGameScore:', gGameScore)
    console.log('gTopScore:', gTopScore)

    if (!gIsUserTurn) return
    const note = gNoteSeq[gUserCurrNoteIdx]

    // user lost:
    if (elBtn.innerText !== note) {
        clearInterval(gChallengeInterval)
        flashMsg('אוּפְּסִי...')
        breakScreen()
        setTimeout(() => {
            gAudioWrong.play()
            document.querySelector('.modal').classList.add('show')
            if (gGameScore > gTopScore && gGameScore > 2) {
                const isConfirm = confirm('לא יודע מה סיימון אמר מה הוא לא אמר, אתה אלוף! תרצה להיכנס לטבלה שלנו?')
                if(isConfirm) {
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

        if (maxLevelsInARow < gCountWinning) {
            goodJob('שברת שיא בכמות השלבים שניצחת רצוף ! עוד כוכבב')
            saveToLocalStorage('maxLevelsInARow', gCountWinning)
        }

        clearInterval(gSkipIntervalId)

        if (gLevel % 3 === 0) {
            addRandomPowerup()
            flashMsg('זכית בתמריץ חדש!')
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

            setTimeout(() => {
                playComputer()
            }, gAudioLength * 2)
        }, gAudioLength)
    } else {
        gUserCurrNoteIdx++
    }
}

function onUsePowerup(powerupName) {
    if (!gIsUserTurn) return

    switch (powerupName) {
        case 'next-note': {
            if (!isAllowedToUse('next-note')) return
            decrementPowerupCount('next-note')
            onTapNextNote()
            gAudioPowerup.play()
            break
        }
        case 'skip-level': {
            if (!isAllowedToUse('skip-level')) return
            decrementPowerupCount('skip-level')
            gSkipIntervalId = setInterval(onTapNextNote, 700)
            gAudioPowerup.play()
            break
        }
        case 'slow-time': {
            if (!isAllowedToUse('slow-time')) return
            decrementPowerupCount('slow-time')
            gIsSlowTime = true
            gAudioPowerup.play()
            break
        }
    }
}

function isAllowedToUse(powerupName) {
    const powerup = gPowerups.find(p => p.name === powerupName)
    return powerup.count > 0 ? true : false
}

function decrementPowerupCount(powerupName) {
    const idx = gPowerups.findIndex(p => p.name === powerupName)
    gPowerups[idx].count--
    renderPowerups()
}

function addRandomPowerup() {
    const randIdx = getRandomIntInclusive(0, gPowerups.length - 1)
    gPowerups[randIdx].count++
    renderPowerups()
}

function addUserToLeaderboards(name) {
    gPlayers.unshift({ name, record: gGameScore })
    saveToLocalStorage(PLAYERS_KEY, gPlayers)
}

function onTapNextNote() {
    const nextNote = gNoteSeq.charAt(gUserCurrNoteIdx)
    const elBtn = getElBtn(nextNote)

    onUserPress(elBtn)
}

function getElBtn(note) {
    return document.querySelector(`.game-container > button:nth-child(${note})`)
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
    }, 1500)
}

function goodJob(txt) {
    gStars++
    let elModal = document.querySelector('.modal')
    let elHealine = document.querySelector('.good-job-headline')
    let elStars = document.querySelector('.stars')
    let strForStarImg = ''
    for (let i = 0; i < gStars; i++) {
        strForStarImg += '<img src="img/star.png" height="50" width="50" alt="" />';
    }
    elStars.innerHTML = strForStarImg
    elHealine.innerText = txt
    elModal.classList.add('show')
    gIsUserTurn === false
    setTimeout(() => {
        elModal.classList.remove('show')
        !gIsUserTurn
    }, 3000)
}

function onSelectLevel(val) {
    gBalloonsNums = val
    gAudioLength = gAudioLength / Math.pow(gBalloonsNums, 1 / 2)
    onStart()
}

function renderBalloonsNums() {
    const gameContainer = document.querySelector('.game-container')
    gameContainer.innerHTML = ''

    var strHTML = ''
    for (var i = 0; i < gBalloonsNums; i++) {
        strHTML += `<button style="background-color: ${getRandomColor()}" onclick="onUserPress(this)">${i + 1
            }</button>`
    }
    gameContainer.innerHTML = strHTML
}

function onToggleLeaderboards() {
    document.querySelector('.leaderboards-container').classList.toggle('show')
    document.querySelector('.backdrop').classList.toggle('show')
}

function _createPowerups() {
    const powerups = [
        _createPowerup('skip-level', 'img/p2.png', 'Skip to next level'),
        _createPowerup('next-note', 'img/p3.png', 'Tap next note'),
        _createPowerup('slow-time', 'img/p1.png', 'Slow down next level note play'),
    ]
    return powerups
}

function _createPowerup(name, imgUrl, title) {
    return {
        name,
        imgUrl,
        count: 1,
        title
    }
}
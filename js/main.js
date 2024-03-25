'use strict'

const gAudioRight = new Audio('sound/right.mp3')
const gAudioWrong = new Audio('sound/wrong.mp3')
const gAudioCheer = new Audio('sound/cheer.mp3')
const gAudioBreak = new Audio('sound/broken.mp3')
const gAudioNotes = [
    new Audio('sound/note/1.mp3'),
    new Audio('sound/note/2.mp3'),
    new Audio('sound/note/3.mp3'),
    new Audio('sound/note/4.mp3')
]
const gAudioLength = 1200

// Don't scare that kid
gAudioBreak.volume = 0.05
gAudioRight.volume = 0.05
gAudioWrong.volume = 0.05
gAudioCheer.volume = 0.1

// Game state:
var gTopScore = +localStorage.getItem('topScore') || 0
var gGameScore
var gIsUserTurn
var gNoteSeq // string of note numbers - example: '1214'
var gUserCurrNoteIdx // index of note in gNoteSeq that user should click next

function onInit() {
    document.querySelector('.modal img').src = `img/go${getRandomIntInclusive(1, 6)}.gif`
}

function onStart() {
    gGameScore = 0
    gIsUserTurn = false
    document.querySelector('.score').innerText = gGameScore
    document.querySelector('.top-score').innerText = gTopScore
    document.querySelector('.modal img').src = `img/go${getRandomIntInclusive(1, 6)}.gif`
    document.querySelector('.modal').classList.remove('show')
    gNoteSeq = ''
    playComputer()
}

function playComputer() {
    flashMsg('נָא לְהַקְשִׁיב...')
    gNoteSeq += getRandomIntInclusive(1, 4)
    for (let i = 0; i < gNoteSeq.length; i++) {
        setTimeout(() => {
            const note = gNoteSeq.charAt(i)
            const el = document.querySelector(`.game-container > button:nth-child(${note})`)
            playNote(el, note)
        }, (i + 1) * gAudioLength)
    }

    setTimeout(() => {
        setUserTurn()
    }, gNoteSeq.length * gAudioLength)
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
        flashMsg('אוּפְּסִי...')
        breakScreen()
        setTimeout(() => {
            gAudioWrong.play()
            document.querySelector('.modal').classList.add('show')
        }, 3000)
        return
    }

    // user got it right
    playNote(elBtn, note)

    // is it the last note in the sequence?
    if (gUserCurrNoteIdx === gNoteSeq.length - 1) {

        gIsUserTurn = false

        setTimeout(() => {
            gGameScore++
            document.querySelector('.score').innerText = gGameScore
            // user broke his record
            if (gGameScore > gTopScore && gGameScore > 4) {
                gTopScore = gGameScore
                document.querySelector('.top-score').innerText = gTopScore
                localStorage.setItem('topScore', gTopScore)
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

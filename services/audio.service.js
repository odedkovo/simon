'use strict'

const gAudioPowerupAchieved = new Audio('sound/powerup-achieved.mp3')
const gAudioPowerupUsed = new Audio('sound/powerup-used.mp3')
const gAudioRight = new Audio('sound/right.mp3')
const gAudioWrong = new Audio('sound/wrong.mp3')
const gAudioCheer = new Audio('sound/cheer.mp3')
const gAudioBreak = new Audio('sound/broken.mp3')
const gAudioNotes = _createAudioNotes()

// Don't scare that kid
gAudioPowerupAchieved.volume = 0.05
gAudioPowerupUsed.volume = 0.05
gAudioBreak.volume = 0.05
gAudioRight.volume = 0.05
gAudioWrong.volume = 0.05
gAudioCheer.volume = 0.1

function _createAudioNotes() {
    const notes = []
    for (let i = 1; i <= 9; i++) {
        notes.push(new Audio(`sound/note/${i}.mp3`))
    }
    return notes
}
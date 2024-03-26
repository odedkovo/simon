'use strict'

const gPowerups = setPowerups()

function getPowerups() {
    return gPowerups
}

function isAllowedToUse(powerupName) {
    const powerup = gPowerups.find((p) => p.name === powerupName)
    return powerup.count > 0 ? true : false
  }

function decrementPowerupCount(powerupName) {
    const idx = gPowerups.findIndex((p) => p.name === powerupName)
    gPowerups[idx].count--
}

function addRandomPowerup() {
    const randIdx = getRandomIntInclusive(0, gPowerups.length - 1)
    gPowerups[randIdx].count++
}

function setPowerups() {
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
        title,
    }
}
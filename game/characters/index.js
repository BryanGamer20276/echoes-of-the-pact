// game/characters/index.js

const juan    = require("./playable/Juan/main");
const botBase = require("./enemies/BotBase/main");

// Lista de personajes jugables
const playableCharacters = [juan];

// Lista de enemigos base
const enemyBases = [botBase];

function getPlayableCharacters() {
  return playableCharacters;
}

function getDefaultPlayableCharacter() {
  return juan;
}

function getBaseEnemy() {
  return enemyBases[0];
}

module.exports = {
  getPlayableCharacters,
  getDefaultPlayableCharacter,
  getBaseEnemy
};

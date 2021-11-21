/*
 * Name: Chingpo Lin
 * Date: Oct 31, 2020
 * Section: CSE 154 AI
 * TA: Tara Wueger
 * This is the pokedex javascript file: pokedex.js, for some functionality of pokemon
 * It get pokemon information from both pokemon API for pokemon information and game API
 * for game information, and then shows the resulting information on the page as expected.
 *
 */
"use strict";

(function() {

  const URL = "https://courses.cs.washington.edu/courses/cse154/webservices/pokedex/";
  const FULL = 100;
  const LOW = 20;
  const MOVE = 4;
  const DIE = 0;

  window.addEventListener('load', init);

  let gameID = "";
  let playerID = "";
  let playerHP = "";

  /**
   * initializing the start button, and fetch the poke API to get the information
   * of all kinds of pokemon
   */
  function init() {
    let url = URL + "pokedex.php?pokedex=all";
    id("start-btn").addEventListener("click", playGame);
    fetch(url)
      .then(checkStatus)
      .then(resp => resp.text())
      .then(getIcon)
      .catch(console.error);
  }

  /**
   * begins the game when start button was clicked. we change into game view and
   * show expected button and view. fetch the game API to get information of
   * opponent pokemon and post in our page as expected.
   */
  function playGame() {
    id("pokedex-view").classList.add("hidden");
    id("p2").classList.remove("hidden");
    qs(".hidden.hp-info").classList.remove("hidden");
    id("results-container").classList.remove("hidden");
    id("flee-btn").classList.remove("hidden");
    id("flee-btn").addEventListener("click", fleeHelper);
    id("start-btn").classList.add("hidden");
    changeMove(true);
    qs("h1").textContent = "Pokemon Battle!";
    let data = new FormData();
    data.append("startgame", "true");
    data.append("mypokemon", qs("#p1 .name").textContent);
    let url = URL + "game.php";
    fetch(url, {method: "POST", body: data})
      .then(checkStatus)
      .then(res => res.json())
      .then(showOppo)
      .catch(console.error);
  }

  /**
   * helper for passing parameter for flee
   */
  function fleeHelper() {
    fight(null, true);
  }

  /**
   * set ID for game and player, and post given information of opponent on web
   * @param {Object} res Json object containing battle information
   */
  function showOppo(res) {
    gameID = res.guid;
    playerID = res.pid;
    chooseCard(res, "#p2");
  }

  /**
   * able or disable the move button depend on whether we are in battle
   * , and adding click event to each move when we are in battle
   * @param {Boolean} useMove if we want to lock the move button
   */
  function changeMove(useMove) {
    let moves = qsa("#p1 .moves button");
    for (let i = 0; i < moves.length; i++) {
      moves[i].disabled = !useMove;
      if (useMove) {
        moves[i].addEventListener("click", fightHelper);
      }
    }
  }

  /**
   * helper for passing parameter for fight, and gives the moves we click as parameter
   */
  function fightHelper() {
    fight(this.getElementsByClassName("move")[0], false);
  }

  /**
   * called when any moves or flee button was clicked, and fetch the API to get
   * the resulting information after using moves.
   * @param {Object} moves the element contains moves' name
   * @param {Boolean} flee if we click the flee
   */
  function fight(moves, flee) {
    id("loading").classList.remove("hidden");
    let data = new FormData();
    data.append("guid", gameID);
    data.append("pid", playerID);
    let move;
    if (flee) {
      move = "flee";
    } else {
      move = moves.textContent.replace(" ", "").toLowerCase();
    }
    data.append("movename", move);
    let url = URL + "game.php";
    fetch(url, {method: "POST", body: data})
      .then(checkStatus)
      .then(res => res.json())
      .then((battleJson) => {
        if (flee) {
          battle(battleJson, true);
        } else {
          battle(battleJson, false);
        }
      })
      .catch(console.error);
  }

  /**
   * renew health information and show battle text by using the data returned by game API
   * @param {Object} battleJson contain the information after one round
   */
  function renew(battleJson) {
    id("loading").classList.add("hidden");
    let word1 = "Player 1 played " + battleJson.results["p1-move"] + " and " +
        battleJson.results["p1-result"] + "!";
    let word2 = "Player 2 played " + battleJson.results["p2-move"] + " and " +
        battleJson.results["p2-result"] + "!";
    id("p1-turn-results").textContent = word1;
    id("p2-turn-results").textContent = word2;
    id("p1-turn-results").classList.remove("hidden");
    if (battleJson.results["p2-move"] === null) {
      id("p2-turn-results").classList.add("hidden");
    } else {
      id("p2-turn-results").classList.remove("hidden");
    }
    qs("#p1 .hp").textContent = battleJson.p1["current-hp"] + "HP";
    qs("#p2 .hp").textContent = battleJson.p2["current-hp"] + "HP";
  }

  /**
   * changed the current health returned by API, and add new pokemon when
   * win the fight. Adding warming color when in low health
   * @param {Object} battleJson battle information form API
   * @param {Boolean} flee if we clicked flee
   */
  function battle(battleJson, flee) {
    renew(battleJson);
    let health1 = FULL * battleJson.p1["current-hp"] / battleJson.p1.hp;
    let health2 = FULL * battleJson.p2["current-hp"] / battleJson.p2.hp;
    qs("#p1 .health-bar").style.width = health1 + "%";
    qs("#p2 .health-bar").style.width = health2 + "%";
    if (health1 < LOW) {
      qs("#p1 .health-bar").classList.add("low-health");
    }
    if (health2 < LOW) {
      qs("#p2 .health-bar").classList.add("low-health");
    }
    if (health1 === DIE || health2 === DIE || flee) {
      if (health2 === DIE) {
        let shortname = battleJson.p2.shortname;
        if (!id(shortname).classList.contains("found")) {
          id(shortname).classList.add("found");
          id(shortname).addEventListener("click", populate);
        }
      }
      endGameHelper(health1, health2, flee);
    }
  }

  /**
   * end game helper for print words of win or lose, and disable move button,
   * make leave game available. show the end button
   * @param {number} health1 the current hp for player1
   * @param {number} health2 the current hp for player2
   * @param {Boolean} flee if we choose to run away
   */
  function endGameHelper(health1, health2, flee) {
    if (health1 === 0 || flee) {
      qs("h1").textContent = "You lost!";
    } else {
      qs("h1").textContent = "You won!";
    }
    id("flee-btn").classList.add("hidden");
    id("endgame").classList.remove("hidden");
    changeMove(false);
    id("endgame").addEventListener("click", endGame);
  }

  /**
   * end the game and return to main view, reset all value
   */
  function endGame() {
    id("pokedex-view").classList.remove("hidden");
    id("endgame").classList.add("hidden");
    id("results-container").classList.add("hidden");
    id("p2").classList.add("hidden");
    id("start-btn").classList.remove("hidden");
    qs("#p1 .hp").textContent = playerHP;
    qs(".hp-info").classList.add("hidden");
    qs("h1").textContent = "Your Pokedex";
    qs("#p1 .health-bar").style.width = "100%";
    qs("#p2 .health-bar").style.width = "100%";
    qs("#p2 .health-bar").classList.remove("low-health");
    qs("#p1 .health-bar").classList.remove("low-health");
    id("p1-turn-results").textContent = "";
    id("p2-turn-results").textContent = "";
  }

  /**
   * get icons of all pokemon, and make basic pokemon available at first
   * @param {Object} name API response of all poke name
   */
  function getIcon(name) {
    let names = name.split("\n");
    let basicList = ["bulbasaur", "charmander", "squirtle"];
    for (let i = 0; i < names.length; i++) {
      let img = gen("img");
      let short = names[i].split(":")[1];
      img.id = short;
      img.src = URL + "sprites/" + short + ".png";
      img.alt = short;
      img.classList.add("sprite");
      for (let j = 0; j < basicList.length; j++) {
        if (basicList[j] === short) {
          img.classList.add("found");
          img.addEventListener("click", populate);
        }
      }
      id("pokedex-view").appendChild(img);
    }
  }

  /**
   * replace the player1 card information by the new one we click.
   */
  function populate() {
    id("start-btn").classList.remove("hidden");
    let pokeUrl = URL + "pokedex.php?pokemon=" + this.alt;
    fetch(pokeUrl)
      .then(checkStatus)
      .then(res => res.json())
      .then((res) => {
        chooseCard(res, "#p1");
      })
      .catch(console.error);
  }

  /**
   * adding the cards information of what we choose or what player2 choose on our page
   * @param {Object} pokeJson API information of opponent's pokemon or my pokemon
   * @param {String} player the string denotes which player
   */
  function chooseCard(pokeJson, player) {
    if (player === "#p2") {
      pokeJson = pokeJson.p2;
    }
    qs(player + " .name").textContent = pokeJson.name;
    qs(player + " .pokepic").src = URL + pokeJson.images.photo;
    qs(player + " .type").src = URL + pokeJson.images.typeIcon;
    qs(player + " .weakness").src = URL + pokeJson.images.weaknessIcon;
    playerHP = pokeJson.hp + "HP";
    qs(player + " .hp").textContent = playerHP;
    qs(player + " .info").textContent = pokeJson.info.description;
    for (let i = 0; i < MOVE; i++) {
      if (i < pokeJson.moves.length) {
        qsa(player + " .move")[i].textContent = pokeJson.moves[i].name;
        qsa(player + " .moves img")[i].src = URL + "icons/" + pokeJson.moves[i].type + ".jpg";
        if (pokeJson.moves[i].dp) {
          qsa(player + " .dp")[i].textContent = pokeJson.moves[i].dp + "DP";
        } else {
          qsa(player + " .dp")[i].textContent = "";
        }
        if (qsa(player + " .moves button")[i].classList.contains("hidden")) {
          qsa(player + " .moves button")[i].classList.remove("hidden");
        }
      } else {
        qsa(player + " .moves button")[i].classList.add("hidden");
      }
    }
  }

  /**
   * Check the status
   * @param {Object} res is response from the page.
   * @returns {Promise<{ok}|*|Error>} returns error when error happens,
   * else the response from web
   */
  async function checkStatus(res) {
    if (!res.ok) {
      return new Error(await res.text());
    }
    return res;
  }

  /**
   * generate an element with given tag
   * @param {String } tagName - the name of tag
   * @returns {object} - the DOM element with given tag name
   */
  function gen(tagName) {
    return document.createElement(tagName);
  }

  /**
   * returns the object with given id.
   * @param {String} id - the id of an element.
   * @return {Object} - the object with given id
   */
  function id(id) {
    return document.getElementById(id);
  }

  /**
   * returns the first object with given selector.
   * @param {String} selector - use to select of an element.
   * @return {Object} - the first object with given selector
   */
  function qs(selector) {
    // returns the node with given selector
    return document.querySelector(selector);
  }

  /**
   * returns the array with all given selector.
   * @param {String} selector - the id of an element.
   * @return {Object} - the array with all given selector
   */
  function qsa(selector) {
    return document.querySelectorAll(selector);
  }
})();
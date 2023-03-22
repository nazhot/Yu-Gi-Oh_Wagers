const socket = io(); //comment out for server
//const socket = io("https://noahzydel.com", {path: "/wagersocket/"});

const cardBackImage = "public/images/back.png";
const smallCardImageUrl = "https://images.ygoprodeck.com/images/cards_small/";
const largeCardImageUrl = "https://images.ygoprodeck.com/images/cards/";

//allow player to press enter after typing in their wager amount
document
  .getElementById("player-wager-amount")
  .addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      document.getElementById("submit-wager").click();
    }
  });

function toggleCardSelect(cardElement) {
    if (cardElement.classList.contains("selected-card")) {
    cardElement.classList.remove("selected-card");
    } else {
    cardElement.classList.add("selected-card");
    }
}

function submitReadyStatus(status) {
    socket.emit("update-readied-status", status);
}

function submitRequestEnd(element) {
    socket.emit("request-end");
    element.style.opacity = "0.3";
}

function submitDownload() {
    socket.emit("download");
}

function swapReadyStatus(readyButtonElement) {
    const elementClass = readyButtonElement.className;
    if (elementClass === "ready") {
    readyButtonElement.className = "not-ready";
    readyButtonElement.innerHTML = "NOT READY";
    } else if (elementClass === "not-ready") {
    readyButtonElement.className = "ready";
    readyButtonElement.innerHTML = "READY";
    }

    submitReadyStatus(readyButtonElement.className === "ready");
}

function submitWager() {
    const wagerElement = document.getElementById("player-wager-amount");
    const wager = wagerElement.value;
    socket.emit("place-wager", wager);
}

function resetDeckScroll() {
    const deckElements = document.getElementsByClassName("deck-container");
    for (const deckElement of deckElements) {
    deckElement.scrollTop = 0;
    }
}

function submitLiquidate() {
    const liquidateElements = document.getElementsByClassName("selected-card");
    const cardIdsToLiquidate = [];
    for (const cardToLiquidate of liquidateElements) {
    cardIdsToLiquidate.push(cardToLiquidate.cardId);
    }
    socket.emit("liquidate-cards", cardIdsToLiquidate);
}

function hideAllElementsByClassName(className) {
    const elements = document.getElementsByClassName(className);
    for (const element of elements) {
    element.classList.remove("hidden");
    element.classList.add("hidden");
    }
}

function showAllElementsByClassName(className) {
    const elements = document.getElementsByClassName(className);
    for (const element of elements) {
    element.classList.remove("hidden");
    }
}

function resetEndButtonOpacity() {
    const endButtons = document.getElementsByClassName("request-end");
    for (const endButton of endButtons) {
    endButton.style.opacity = "1.0";
    }
}

function changeToScreen(screenName) {
    const screen = document.getElementById(screenName);

    hideAllElementsByClassName("screen-container");
    resetEndButtonOpacity();

    screen.classList.remove("hidden");
    resetDeckScroll();

    return screen;
}

function setTokenCount(tokens) {
    setInfoPanes("player-token-count", tokens);
}

function setDeckSize(deckSize) {
    setInfoPanes("player-deck-size", deckSize);
}

function setRemainingCards(cardsRemaining) {
    setInfoPanes("player-cards-remaining", cardsRemaining);
}

function setInfoPanes(elementClass, value) {
    const elements = document.getElementsByClassName(elementClass);
    for (const element of elements) {
    element.innerHTML = value;
    }
}

function clearDeck() {
    const deckElements = document.getElementsByClassName("deck");
    for (const deckElement of deckElements) {
    while (deckElement.firstChild) {
        deckElement.removeChild(deckElement.lastChild);
    }
    }
    return deckElements;
}

function setWagerCard(cardObject) {
    const shownCard = document.getElementById("shown-card");
    shownCard.src = largeCardImageUrl + cardObject.id + ".jpg";
    document.getElementById("wagered-card-name").innerHTML = cardObject.name;
    document.getElementById("wagered-card-desc").innerHTML = cardObject.desc;
}

function download(filename, text) {
    const element = document.createElement("a");
    element.setAttribute(
    "href",
    "data:text/plain;charset=utf-8," + encodeURIComponent(text)
    );
    element.setAttribute("download", filename);
    element.style.display = "none";

    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

/**
 * Create the standard cardElement that's used throughout the program
 * @param {string} cardId id of the card
 */
function generateCardElement(cardObject) {
    const cardId            = cardObject.id;
    const cardWager         = cardObject.wager;
    const card              = document.createElement("img");
    const largeCardElements = document.getElementsByClassName("large-card");

    card.classList.add("deck-card");
    card.src = smallCardImageUrl + cardId + ".jpg";
    card.cardId = cardId;
    card.wager = cardWager;
    card.cardName = cardObject.name;
    card.cardDesc = cardObject.desc;
    card.largeImage = largeCardImageUrl + cardId + ".jpg";
    card.onmouseover = () => {

    for (const largeCardElement of largeCardElements) {
        largeCardElement.src = card.largeImage;
    }

    setInfoPanes("previous-wager", card.wager);
    setInfoPanes("hovered-card-name", card.cardName);
    setInfoPanes("hovered-card-desc", card.cardDesc);
    };

    card.onmouseleave = () => {
    const largeCardElements = document.getElementsByClassName("large-card");
    for (const largeCardElement of largeCardElements) {
        largeCardElement.src = cardBackImage;
    }
    setInfoPanes("previous-wager", "");
    setInfoPanes("hovered-card-name", "");
    setInfoPanes("hovered-card-desc", "");
    };

    card.onclick = () => {
    toggleCardSelect(card);
    };

    return card;
}

/**
 * Generates a standard card element from cardId, and adds it to all deck elements
 * Used when just one card is being added, NOT when a whole deck is being added one at a time
 * (deckElements would be created every time, setDeck can just create it once and pass elements to addCardToDeckElement)
 * Decided to have this function take in a cardId, rather than a card element, since cardElement should be standard across
 *   the game, and every time a card is added generateCardElement should be called to make it
 * @param {string} cardId id of the card to add
 */
function addCard(cardObject) {
    const deckElements = document.getElementsByClassName("deck");

    for (const deckElement of deckElements) {
    const cardElement = generateCardElement(cardObject); //for each deck element, a new cardElement must be generated. Learned the hard way
    deckElement.appendChild(cardElement);
    }
}

/**
 * Add all of the standard card elements to the player's deckElements from the given cardList
 * @param {array} cardList array of cardIds to be added
 */
function setDeck(cardList) {
    const deckElements = clearDeck();
    for (const cardObject of cardList) {
    for (const deckElement of deckElements) {
        const cardElement = generateCardElement(cardObject); //new card element must be generated for every new element it's being added to
        deckElement.appendChild(cardElement);
    }
    }
}

function submitStartGame() {
    console.log("Starting game");
    socket.emit("start-game");
}

socket.on("non-number-wager", () => {
    console.log("Non number wager");
});

socket.on("insufficient-tokens", () => {
    console.log("Insufficient tokens");
});

socket.on("token-update", (tokensRemaining) => {
    console.log("updating token count");
    setTokenCount(tokensRemaining);
});

socket.on("deck-size-update", (deckSize) => {
    setDeckSize(deckSize);
});

socket.on("cards-remaining-update", (cardsRemaining) => {
    setRemainingCards(cardsRemaining);
});

socket.on("self-wager-placed", (tokensRemaining) => {
    setTokenCount(tokensRemaining);
});

socket.on("wager-card", (cardObject) => {
    setWagerCard(cardObject);
});

socket.on("wager-placed", (playerThatPlacedWager) => {});

socket.on("invalid-liquidation", () => {
    console.log("Invalid liquidation");
});

socket.on("change-to-wager-screen", () => {
    changeToScreen("wagering-page");
    document.getElementById("player-wager-amount").focus();
});

socket.on("change-to-liquidate-screen", () => {
    changeToScreen("liquidating-page");
    document.getElementById("liquidate-cards").focus();
});

socket.on("change-to-end-screen", () => {
    changeToScreen("end-page");
});

socket.on("show-end-button", () => {
    showAllElementsByClassName("request-end");
});

socket.on("hide-end-button", () => {
    hideAllElementsByClassName("request-end");
});

socket.on("download", (ydkFile) => {
    download("WagerDeck.ydk", ydkFile);
});

socket.on("update-readied-statuses", (playerStatuses) => {
    let allReady = true;
    for (const player in playerStatuses) {
    const playerReady = playerStatuses[player];
    if (allReady && !playerReady) {
        allReady = false;
    }
    }

    const startGameButton = document.getElementById("start-game-button");

    if (allReady) {
    startGameButton.style.opacity = "1.0";
    } else {
    startGameButton.style.opacity = "0.3";
    }
});

socket.on("is-player-1", () => {
    showAllElementsByClassName("player-1-element");
});

socket.on("card-added", (cardObject) => {
    addCard(cardObject);
});

socket.on("deck", (cardList) => {
    setDeck(cardList);
});
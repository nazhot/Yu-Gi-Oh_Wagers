const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const fs = require("fs");
const { isTypedArray } = require("util/types");

app.use(express.static(__dirname));

app.get("/wager/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

/**
 * TODO: replace with a version that will support multiple rooms at once
 * TODO: add cardList property, {array}, that contains all of the card ids from the cube
 * Contains all of the data for the program. 
 * {number} numPlayers    how many players have connected // TODO: remove in the future and replace with just counting members of the room
 * {object} players       properties are the socket ids of the players that have connected, values are another object containing player specific data
 * {string} currentCard   the card id of the card currently up for auction
 * {object} currentWagers properties are the socket ids of the players that have wagered already, value is how many tokens they wagered up
 * {array}  cardList      needs to be implemented, will be the list of card ids available for auction
 * 
 * Functions
 * addCardToPlayer(player)                   places currentCard within the speficied player's cards
 * getPlayerYDKFile(player)                  generate and return the ydkFile for the specified player
 * setCurrentCardFromCardList()              pops cardList in order to set currentCard
 * getCardsRemaining()                       returns the number of remaining cards in cardList
 * setPlayerStatus(player, property, status) sets a certain player's status to the specified value
 * resetStatuses(property)                   sets all players' specified property back to false
 * resetRequestedEnd()                       sets all players' requestedEnd property back to false
 * resetWagered()                            sets all players' wagered property back to false
 * resetLiquidated()                         sets all players' liquidated property back to false
 * resetReadied()                            sets all players' readied property back to false
 * getAllPlayersStatus(property)             returns an object of {player: property-value} for all of the specified property
 * getAllPlayersAtLeastXCards(numCard)       whether all players currently have at least X cards
 * resetAllPlayersStatuses()                 sets all statuses of all players back to false
 * getNumRemainingCards()                    returns the length of the cardList property
 * getPlayersWithHighestWager()              return an array of player(s) that have the highest wager for a round
 * getLowestWager()                          returns the lowest wager of the round
 * getPlayersWithLeastTieWins()              returns an array of player(s) that have the lowest numTies property
 */
const data = {
    numPlayers: 0,
    players: {},
    currentCard: "",
    currentWagers: {},
    cardList: [],
    /**
     * Places currentCard within the speficied player's cards. Objects in players.cards take the form:
     * {
     *  id    {string} the card id
     *  wager {number} the wager the player submitted
     *  value {number} the lowest wager of the round
     * }
     * @param {string} player socket.id of the player
     */
    addCardToPlayer(player){
        this.players[player].cards.push({
            id:  this.currentCard,
            wager:  this.currentWagers[player],
            value: this.getLowestWager(),
        })
    },

    /**
     * Generate and return the ydkFile for the specified player
     * @param {string} player socket.id of the player 
     * @returns {string} the text needed for a ydkFile based on the player's cards
     */
    getPlayerYDKFile(player){
        let ydkFile = "#main";
        for (const cardIndex in this.players[player].cards){
            const cardId = this.players[player].cards[cardIndex].id;
            ydkFile += "\n" + cardId;
        }
        ydkFile += "\n#extra";
        ydkFile += "\n!side";

        return ydkFile;
    },

    /**
     * Pops cardList in order to set currentCard
     */
    setCurrentCardFromCardList(){
        this.currentCard = cardList.pop();
    },

    /**
     * Returns the number of remaining cards in cardList
     * @returns {number} the number of remaining cards, which is the length of cardList
     */
    getCardsRemaining(){
        return this.cardList.length;
    },

    /**
     * Sets a certain player's status to the specified value
     * @param {string}  player   socket.id of player 
     * @param {string}  property name of the property to set 
     * @param {boolean} status   value to set the property to
     */
    setPlayerStatus(player, property, status){
        this.players[player][property] = status;
    },

    /**
     * Sets all players' specified property back to false
     * @param {string} property name of the property to reset
     */
    resetStatuses(property){
        for (const player in this.players){
            this.players[player][property] = false;
        }
    },

    /**
     * Sets all players' requestedEnd property back to false
     */
    resetRequestedEnd(){
        this.resetStatuses("requestedEnd");
    },

    /**
     * Sets all players' wagered property back to false
     */
    resetWagered(){
        this.resetStatuses("wagered");
    },

    /**
     * Sets all players' liquidated property back to false
     */
    resetLiquidated(){
        this.resetStatuses("liquidated");
    },

    /**
     * Sets all players' readied property back to false
     */
    resetReadied(){
        this.resetStatuses("readied");
    },

    /**
     * Returns an object of {player: property-value} for all of the specified property
     * @param {string} property name of the property to get the values of
     * @returns {object} contains the values of each player's property, in the form:
     *                   {
     *                      player: property-status
     *                   }
     */
    getAllPlayersStatus(property){
        const returnData = {};
        for (const player in this.players){
            returnData[player] = this.players[player][property];
        }
        return returnData;
    },

    /**
     * Whether all players currently have at least X cards
     * @param {number} numCards number of cards to check if players' have
     * @returns {boolean} if all players have at least X cards
     */
    getAllPlayersAtLeastXCards(numCards){
        for (const player in this.players){
            if(this.players[player].cards.length < numCards){
                return false;
            }
        }
        return true;
    },

    /**
     * Sets all statuses of all players back to false
     */
    resetAllPlayersStatuses(){
        for (const player in this.players){
            this.resetLiquidated();
            this.resetWagered();
            this.resetReadied();
            this.resetRequestedEnd();
        }
    },

    /**
     * Get the number of cards remaining in cardList
     * @returns {number} the length of the cardList property
     */
    getNumRemainingCards(){
        return this.cardList.length;
    },

    /**
     * Compiles the player(s) with the highest wager
     * -Start with the highest wager of -1
     * -Go through all of the players' wagers
     * -If a player's wager is equal to the highest wager, add the player to the array
     * -If a player's wager is lower than the highest wager, set highest wager to that wager, empty the array, and add the player
     * @returns {array} player(s) that have the highest wager for a round
     */
    getPlayersWithHighestWager() {
        let highestWager   = -1;
        let highestPlayers = [];
        for (const [player, wager] of Object.entries(this.currentWagers)){
            if (wager === highestWager){
                highestPlayers.push(player);
                continue;
            }
            if (wager > highestWager){
                highestWager   = wager;
                highestPlayers = [player];
            }
        }
        return highestPlayers;
    },

    /**
     * Get the lowest wager of the round
     * @returns {number} lowest wager of the round
     */
    getLowestWager() {
        let lowestWager = Infinity;
        for (const player in this.currentWagers){
            const wager = this.currentWagers[player];
            lowestWager = Math.min(lowestWager, wager);
        }
        return lowestWager;
    },

    /**
     * Get an array of player(s) that have the lowest numTies property
     * -Start with the lowest ties of 100
     * -Go through all of the players' numTies
     * -If a player's numTies is equal to the lowest ties, add the player to the array
     * -If a player's numTies is lower than the lowest ties, set lowest ties to that value, empty the array, and add the player
     * @returns {array} player(s) that have the lowest number of ties so far in the game
     */
    getPlayersWithLeastTieWins() {
        let lowestTieWins = 100;
        let lowestPlayers = [];
        for (const player in this.players){
            const ties = this.players[player].tieWins;
            if (ties === lowestTieWins){
                lowestPlayers.push(player);
                continue;
            }
            if (ties < lowestTieWins){
                lowestTieWins = ties;
                lowestPlayers = [player];
            }
        }
        return lowestPlayers;
    }
};

const cardList = fs.readFileSync("public/cardLists/Draft Masters", "utf-8").split("\n");
shuffleArray(cardList);
data.cardList = cardList;

/**
 * Shuffles an array using Fisher-Yates (aka Knuth) Shuffle
 * @param {array} array array to be shuffled
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

/**
 * The default data given to each player when they join
 * @returns {object} default values for the player
 */
function defaultPlayerData(){
    return {
        name: "",
        tokens: 1000,
        cards: [], //format should be {card number, price you paid, price opponent paid}
        wagered: false,
        liquidated: false,
        readied: false,
        requestedEnd: false,
        tieWins: 0,
    };
}

/**
 * Checks if every player has propertyName set to true
 * @param {string} propertyName name of the property within the player object
 * @returns {boolean} if all of the players have propertyName set to true
 */
function checkIfAllPropertiesTrue(propertyName){
    for (const prop in data.players){
        if (!data.players[prop][propertyName]){
            return false;
        }
    }
    return true;
}

/**
 * Reset the card list in data by shuffling the global card list, and setting data.cardList equal to it
 */
function resetCardList(){
    shuffleArray(cardList);
    data.cardList = cardList;
}

/**
 * Checks if all players have wagered
 * @returns whether all players have wagered
 */
function checkIfAllPlayersWagered(){
    return checkIfAllPropertiesTrue("wagered");
}

/**
 * Checks if all players have liquidated
 * @returns whether all players have liquidated
 */
function checkIfAllPlayersLiquidated(){
    return checkIfAllPropertiesTrue("liquidated");
}

/**
 * Checks if all players have requested to end the game
 * @returns whether all players have requestedEnd
 */
function checkIfAllPlayersRequestedEnd(){
    return checkIfAllPropertiesTrue("requestedEnd");
}

/**
 * Tell a player that they have insufficient tokens for the given wager
 * @param {string} player socket.id of player
 */
function emitInsufficientTokens(player){
    io.to(player).emit("insufficient-tokens")
}

/**
 * Tell a player that they tried to liquidate a card that doesn't appear in their player.cards array
 * @param {string} player socket.id of player
 * @param {string} card   cardId that player attempted to remove
 */
function emitInvalidLiquidation(player, card){
    io.to(player).emit("invalid-liquidation", card);
}

/**
 * Tell a player that they placed a wager to update their tokens, and let all players know that a wager happened
 * @param {string} player          socket.id of player that placed the wager
 * @param {string} playerName      name of the player that placed the wager, currently not used by client
 * @param {number} tokensRemaining 
 */
function emitWagerPlaced(player, playerName, tokensRemaining){
    io.to(player).emit("self-wager-placed", tokensRemaining);
    io.emit("wager-placed", playerName);
}

/**
 * Tell all players to change their screen to the wager screen, and tell them the card being wagered
 */
function emitChangeAllToWagerScreen(){
    for (const player in data.players){
        emitChangeToWagerScreen(player);
    }
    emitWagerCard();
}

/**
 * Tell all players to change their screen to the liquidate screen
 */
function emitChangeAllToLiquidateScreen(){
    for (const player in data.players){
        emitChangeToLiquidateScreen(player);
    }
}

/**
 * Tell all players to change their screen to the end screen
 */
function emitChangeAllToEndScreen(){
    for (const player in data.players){
        emitChangeToEndScreen(player);
    }
}

/**
 * Generate a player's deck by grabbing the id of each card in their cards array, and send it to them
 * TODO: update so that a player gets not only the card ids, but also the wager they put in for each card
 * @param {string} player socket.id of player
 */
function emitDeck(player){
    const deck = [];
    for (const card of data.players[player].cards){
        deck.push(card.id);
    }
    io.to(player).emit("deck", deck);
}

/**
 * Send a player the card that they just earned
 * @param {string} player socket.id of player
 */
function emitCardAdded(player){
    io.to(player).emit("card-added", data.currentCard);
}

/**
 * Tell a player to change to the wager screen
 * @param {string} player socket.id of the player
 */
function emitChangeToWagerScreen(player){
    io.to(player).emit("change-to-wager-screen");
}

/**
 * Tell a player to change to the liquidate screen
 * @param {string} player socket.id of the player
 */
function emitChangeToLiquidateScreen(player){
    io.to(player).emit("change-to-liquidate-screen");
}

/**
 * Tell a player to change to the end screen
 * @param {string} player socket.id of the player
 */
function emitChangeToEndScreen(player){
    io.to(player).emit("change-to-end-screen");
}

/**
 * Tell all players to display their end buttons
 */
function emitShowAllEndButtons(){
    for (const player in data.players){
        io.to(player).emit("show-end-button");
    }
}

/**
 * Tell all players to hide their end buttons
 */
function emitHideAllEndButtons(){
    for (const player in data.players){
        io.to(player).emit("hide-end-button");
    }
}

/**
 * Tell player that the wager they submitted is not a number
 * @param {string} player socket.id of player with a non-number wager
 */
function emitNonNumberWager(player){
    io.to(player).emit("non-number-wager");
}

/**
 * Tell a player their token amount
 * @param {string} player socket.id of player to tell
 */
function emitTokenUpdate(player){
    io.to(player).emit("token-update", data.players[player].tokens);
}

/**
 * Tell all players the new wager card
 */
function emitWagerCard(){
    for (const player in data.players){
        io.to(player).emit("wager-card", data.currentCard)
    }
}

/**
 * Tell all players what each players property status is
 * @param {string} property name of the property to get
 */
function emitAllPlayersStatus(property){
    const playerStatuses = data.getAllPlayersStatus(property);
    const statusName = "update-" + property + "-statuses";
    io.emit(statusName, playerStatuses);
    //console.log(playerStatuses);
}

/**
 * Tell all players how many cards remain
 */
function emitAllCardsRemaining(){
    const cardsRemaining = data.getCardsRemaining();
    for (const player in data.players){
        io.to(player).emit("cards-remaining-update", cardsRemaining);
    }
}

/**
 * Tell all players how many tokens they have
 */
function emitAllPlayersTokens(){
    for (const player in data.players){
        emitTokenUpdate(player);
    }
}

/**
 * Tell all players how big their deck is
 */
function emitAllPlayersDeckSize(){
    for (const player in data.players){
        io.to(player).emit("deck-size-update", data.players[player].cards.length);
    }
}

/**
 * Remove the given card for the given player, and return its value
 * @param {string} player socket.id of player
 * @param {string} cardId card id to remove from player.cards
 * @returns the value of the removed card, or null if that card is not present
 */
function liquidateCard(player, cardId){
    const playerData = data.players[player];
    let counter = 0;
    for(const card of playerData.cards){
        if (card.id === cardId){
            const value = card.value;
            playerData.cards.splice(counter, 1);
            return value;
        }
        counter++;
    }
    return null;
}

/**
 * Determines if end buttons need to be changed to hidden/shown, or stay the same. They need to change if before != after
 * @param {boolean} before whether buttons should have been shown before making a card change
 * @param {boolean} after whether buttons should have been shown after making a card change
 */
function updateEndButtonsBasedOnCardChange(before, after){
    if (before !== after){
        if (after){
            emitShowAllEndButtons();
        } else {
            emitHideAllEndButtons();
        }
    }
}

/**
 * Whether a string could be converted to a number or not
 * @param {string} stringToCheck string being checked
 * @returns {boolean} string can be converted to a number
 */
function isNumeric(stringToCheck){
    if (typeof stringToCheck !== "string") return false;
    return !isNaN(stringToCheck) &&
           !isNaN(parseFloat(stringToCheck));
}


io.on("connection", (socket) => {
    console.log(socket.id);
    if (data.numPlayers >= 2){
        if (data.numPlayers > 2){
            console.log("ERROR: More than 2 players allowed to enter");
        }
        return;
    }

    if (data.numPlayers === 0){
        io.to(socket.id).emit("is-player-1");
    }

    data.players[socket.id] = defaultPlayerData();
    data.numPlayers++;

    socket.on("set-name", (name) => {
        if (typeof name !== "string"){
            return;
        }
        data.players[socket.id].name = name;
    });

    socket.on("start-game", () => {
        emitAllCardsRemaining();
        emitAllPlayersDeckSize();
        emitAllPlayersTokens();
        data.setCurrentCardFromCardList();
        emitChangeAllToWagerScreen();
    });

    socket.on("place-wager", (tokensWagered) => {
        const playerData = data.players[socket.id];

        if (data.currentWagers[socket.id]){
            console.log("Tried to redo wager");
            return;
        }
        if (!isNumeric(tokensWagered)){
            emitNonNumberWager(socket.id);
            return;
        }

        tokensWagered = Math.max(parseInt(tokensWagered), 0);

        if (playerData.tokens < tokensWagered) {
            emitInsufficientTokens(socket.id);
            return;
        }

        playerData.tokens            -= tokensWagered;
        data.currentWagers[socket.id] = tokensWagered;

        data.setPlayerStatus(socket.id, "wagered", true);

        const allWagered = checkIfAllPlayersWagered();
        //console.log(data);
        //console.log(allWagered);
        if (allWagered){
            const beforeAllPlayersOver40 = data.getAllPlayersAtLeastXCards(40);
            const winningPlayers         = data.getPlayersWithHighestWager();
            const numWinningPlayers      = winningPlayers.length;
            const lowestWager            = data.getLowestWager();
            let   winningPlayer          = null;

            if (numWinningPlayers > 1){
                const elligiblePlayers = data.getPlayersWithLeastTieWins();
                      winningPlayer    = elligiblePlayers[Math.floor(Math.random()*elligiblePlayers.length)];
                      data.players[winningPlayer].tieWins++;
            } else {
                winningPlayer = winningPlayers[0];
            }

            data.addCardToPlayer(winningPlayer);
            emitCardAdded(winningPlayer);
            data.currentWagers = {};
            data.resetAllPlayersStatuses();
            //console.log(data);
            emitDeck(winningPlayer);
            if (data.getCardsRemaining() === 0){
                emitChangeAllToEndScreen();
                return;
            }
            emitChangeAllToLiquidateScreen();
            emitAllPlayersDeckSize();
            emitAllCardsRemaining();

            const afterAllPlayersOver40 = data.getAllPlayersAtLeastXCards(40);
            updateEndButtonsBasedOnCardChange(beforeAllPlayersOver40, afterAllPlayersOver40);
            data.setCurrentCardFromCardList();
        }

        emitWagerPlaced(socket.id, playerData.name, playerData.tokens);
        
    });

    socket.on("liquidate-cards", (cardsToLiquidate) => {
        const playerData = data.players[socket.id];
        const beforeAllPlayersOver40 = data.getAllPlayersAtLeastXCards(40);
        for (const card of cardsToLiquidate){
            const tokensToAdd = liquidateCard(socket.id, card);
            if (tokensToAdd == null){
                emitInvalidLiquidation(socket.id, card);
                continue;
            }
            playerData.tokens += tokensToAdd;
        }

        const afterAllPlayersOver40 = data.getAllPlayersAtLeastXCards(40);

        updateEndButtonsBasedOnCardChange(beforeAllPlayersOver40, afterAllPlayersOver40);

        playerData.liquidated = true;

        const allLiquidated = checkIfAllPlayersLiquidated();
        if (allLiquidated){
            data.resetAllPlayersStatuses();
            for (const player in data.players){
                emitDeck(player);
                emitTokenUpdate(player);
            }
            emitAllPlayersDeckSize();
            emitChangeAllToWagerScreen();
        }
        //console.log(allLiquidated);
    });

    /**
     * Client sends this message via the end button, is totally manual
     */
    socket.on("request-end", () => {
        if (!data.getAllPlayersAtLeastXCards(40)){
            return;
        }

        data.setPlayerStatus(socket.id, "requestedEnd", true);
        
        const allWantEnd = checkIfAllPlayersRequestedEnd();

        if (!allWantEnd){
            return;
        }

        emitChangeAllToEndScreen();
    });

    socket.on("download", () => {
        io.to(socket.id).emit("download", data.getPlayerYDKFile(socket.id));
    });

    socket.on("update-readied-status", (status) => {
        data.setPlayerStatus(socket.id, "readied", status);
        emitAllPlayersStatus("readied");
    });

    socket.on("disconnecting", () => {
        data.numPlayers--;
        delete data.players[socket.id];
    });

    socket.on("disconnect", () => {
    });
});

server.listen(8090, () => {
    console.log("listening on *:8090");
});
  
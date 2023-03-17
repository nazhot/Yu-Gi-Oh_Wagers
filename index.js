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
 */
const data = {
    numPlayers: 0,
    players: {},
    currentCard: "",
    currentWagers: {},
    cardList: [],
    addCardToPlayer(player){
        this.players[player].cards.push({
            id:  this.currentCard,
            wager:  this.currentWagers[player],
            value: this.getLowestWager(),
        })
    },
    getPlayerYDKFile(player){
        let ydkFile = "#main";
        for (const cardIndex in this.players[player].cards){
            const cardId = this.players[player].cards[cardIndex].id;
            ydkFile += "\n" + cardId;
        }

        return ydkFile;
    },
    setCurrentCardFromCardList(){
        this.currentCard = cardList.pop();
    },
    getCardsRemaining(){
        return this.cardList.length;
    },
    setPlayerStatus(player, property, status){
        this.players[player][property] = status;
    },
    resetStatuses(property){
        for (const player in this.players){
            this.players[player][property] = false;
        }
    },
    resetRequestedEnd(){
        this.resetStatuses("requestedEnd");
    },
    resetWagered(){
        this.resetStatuses("wagered");
    },
    resetLiquidated(){
        this.resetStatuses("liquidated");
    },
    resetReadied(){
        this.resetStatuses("readied");
    },
    getAllPlayersStatus(property){
        const returnData = {};
        for (const player in this.players){
            returnData[player] = this.players[player][property];
        }
        return returnData;
    },
    getAllPlayersAtLeastXCards(numCards){
        for (const player in this.players){
            if(this.players[player].cards.length < numCards){
                return false;
            }
        }
        return true;
    },
    resetAllPlayersStatuses(){
        for (const player in this.players){
            this.resetLiquidated();
            this.resetLiquidated();
            this.resetReadied();
            this.resetRequestedEnd();
        }
    },
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
    getLowestWager() {
        let lowestWager = Infinity;
        for (const player in this.currentWagers){
            const wager = this.currentWagers[player];
            lowestWager = Math.min(lowestWager, wager);
        }
        return lowestWager;
    },
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

function resetCardList(){
    shuffleArray(cardList);
    data.cardList = cardList;
}

function checkIfAllPlayersWagered(){
    return checkIfAllPropertiesTrue("wagered");
}

function checkIfAllPlayersLiquidated(){
    return checkIfAllPropertiesTrue("liquidated");
}

function checkIfAllPlayersRequestedEnd(){
    return checkIfAllPropertiesTrue("requestedEnd");
}

function emitInsufficientTokens(player){
    io.to(player).emit("insufficient-tokens")
}

function emitInvalidLiquidation(player, card){
    io.to(player).emit("invalid-liquidation", card);
}

function emitWagerPlaced(player, playerName, tokensRemaining){
    io.to(player).emit("self-wager-placed", tokensRemaining);
    io.emit("wager-placed", playerName);
}

function emitChangeAllToWagerScreen(){
    for (const player in data.players){
        emitChangeToWagerScreen(player);
        emitWagerCard();
    }
    
}

function emitChangeAllToLiquidateScreen(){
    for (const player in data.players){
        emitChangeToLiquidateScreen(player);
    }
}

function emitChangeAllToEndScreen(){
    for (const player in data.players){
        emitChangeToEndScreen(player);
    }
}

function emitDeck(player){
    const deck = [];
    for (const card of data.players[player].cards){
        deck.push(card.id);
    }
    io.to(player).emit("deck", deck);
}

function emitCardAdded(player){
    io.to(player).emit("card-added", data.currentCard);
}

function emitChangeToWagerScreen(player){
    io.to(player).emit("change-to-wager-screen");
}

function emitChangeToLiquidateScreen(player){
    io.to(player).emit("change-to-liquidate-screen");
}

function emitChangeToEndScreen(player){
    io.to(player).emit("change-to-end-screen");
}

function emitShowAllEndButtons(){
    for (const player in data.players){
        io.to(player).emit("show-end-button");
    }
}

function emitHideAllEndButtons(){
    for (const player in data.players){
        io.to(player).emit("hide-end-button");
    }
}

function emitNonNumberWager(player){
    io.to(player).emit("non-number-wager");
}

function emitTokenUpdate(player){
    io.to(player).emit("token-update", data.players[player].tokens);
}

function emitWagerCard(){
    for (const player in data.players){
        io.to(player).emit("wager-card", data.currentCard)
    }
}

function emitAllPlayersStatus(property){
    const playerStatuses = data.getAllPlayersStatus(property);
    const statusName = "update-" + property + "-statuses";
    io.emit(statusName, playerStatuses);
    //console.log(playerStatuses);
}

function emitAllPlayersTokens(){
    for (const player in data.players){
        emitTokenUpdate(player);
    }
}

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

function updateEndButtonsBasedOnCardChange(before, after){
    if (before !== after){
        if (after){
            emitShowAllEndButtons();
        } else {
            emitHideAllEndButtons();
        }
    }
}



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
        data.setCurrentCardFromCardList();
        emitAllPlayersTokens();
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
  
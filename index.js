const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const fs = require("fs");
const { isTypedArray } = require("util/types");

app.use(express.static(__dirname));

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

const data = {
    numPlayers: 0,
    players: {},
    currentCard: "Test",
    currentWagers: {},
    cardList: [],
    addCardToPlayer(player){
        this.players[player].cards.push({
            card:  this.currentCard,
            value: this.getLowestWager(),
        })
    },
    resetWagered(){
        for(const player in this.players){
            this.players[player].wagered = false;
        }
    },
    getPlayersWithHighestWager() {
        let highestWager   = -1;
        let highestPlayers = [];
        for(const [player, wager] of Object.entries(this.currentWagers)){
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
        for(const player in this.players){
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

function defaultPlayerData(){
    return {
        name: "",
        tokens: 1000,
        cards: [], //format should be {card number, price you paid, price opponent paid}
        wagered: false,
        liquidated: false,
        tieWins: 0,
    };
}

function checkAllProperties(propertyName){
    for (const prop in data.players){
        if (!data.players[prop][propertyName]){
            return false;
        }
    }

    return true;
}

function checkIfAllPlayersWagered(){
    return checkAllProperties("wagered");
}

function checkIfAllPlayersLiquidated(){
    return checkAllProperties("liquidated");
}

function emitInsufficientTokens(player){
    io.to(player).emit("insufficient-tokens")
}

function emitInvalidLiquidation(player, card){
    io.to(player).emit("invalid-liquidation", card);
}

function emitWagerPlaced(player, playerName, tokensRemaining){
    io.to(player).emit("self-placed-wager", tokensRemaining);
    io.emit("wager-placed", playerName);
}

function emitChangeAllToWagerScreen(){
    for (const player in data.players){
        emitChangeToWagerScreen(player);
    }
}

function emitChangeAllToLiquidateScreen(){
    for (const player in data.players){
        emitChangeToLiquidateScreen(player);
    }
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

function emitNonNumberWager(player){
    io.to(player).emit("non-number-wager");
}

function isNumeric(stringToCheck){
    if (typeof stringToCheck !== "string") return false;
    return !isNaN(stringToCheck) &&
           !isNaN(parseFloat(stringToCheck));
}


io.on("connection", (socket) => {

    if (data.numPlayers >= 2){
        if (data.numPlayers > 2){
            console.log("ERROR: More than 2 players allowed to enter");
        }
        return;
    }

    data.players[socket.id] = defaultPlayerData();
    data.numPlayers++;

    socket.on("set-name", (name) => {
        if (typeof name !== "string"){
            return;
        }
        data.players[socket.id].name = name;
    });

    socket.on("place-wager", (tokensWagered) => {
        const playerData = data.players[socket.id];

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
        playerData.wagered            = true;

        const allWagered = checkIfAllPlayersWagered();
        //console.log(data);
        console.log(allWagered);
        if (allWagered){
            const winningPlayers    = data.getPlayersWithHighestWager();
            const numWinningPlayers = winningPlayers.length;
            const lowestWager       = data.getLowestWager();
            let   winningPlayer     = null;
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
            data.resetWagered();
            console.log(data);            
            emitChangeAllToLiquidateScreen();
        }

        emitWagerPlaced(socket.id, playerData.name, playerData.tokens);
        
    });

    socket.on("liquidate-cards", (cardsToLiquidate) => {
        const playerData = data.players[socket.id];
        for (const card of cardsToLiquidate){
            const tokensToAdd = liquidateCard(card);
            if (tokensToAdd == null){
                emitInvalidLiquidation(socket.id, card);
                continue;
            }
            playerData.tokens += tokensToAdd;
        }

        playerData.liquidated = true;

        const allLiquidated = checkIfAllPlayersLiquidated();
        console.log(allLiquidated);
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
  
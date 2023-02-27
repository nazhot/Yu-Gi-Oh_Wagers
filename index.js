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
};

function defaultPlayerData(){
    return {
        name: "",
        tokens: 1000,
        cards: [], //format should be {card number, price you paid, price opponent paid}
        wagered: false,
        liquidated: false,
    };
}

function checkAllProperties(propertyName){
    for (const prop in data.players){
        if (!prop[propertyName]){
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

function emitChangeToWagerScreen(player){
    io.to(player).emit("change-to-wager-screen");
}

function emitChangeToLiquidateScreen(player){
    io.to(player).emit("change-to-liquidate-screen");
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

        if (playerData.tokens < tokensWagered) {
            emitInsufficientTokens(socket.id);
            return;
        }

        playerData.tokens -= tokensWagered;
        
        playerData.wagered = true;
        const allWagered = checkIfAllPlayersWagered();
        console.log(data);
        console.log(allWagered);
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
  
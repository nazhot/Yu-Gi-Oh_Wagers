<p align="center">
  <a href="https://noahzydel.com">
    <img alt="Noah Logo" height="128" src="./.github/resources/NoahLogo.svg">
    <h1 align="center">Noah Zydel</h1>
  </a>
</p>

---

- [📖 Overview](#-overview)
- [⭐️ Current Version](#-current-version)
- [🔜 Hopeful Features](#-hopeful-features)
- [🪚 Built With](#-built-with)
- [🔨 Build Instructions](#-build-instructions)
- [🔄 Adding Recurring Events](#-adding-recurring-events)


# Yu-Gi-Oh Wager Game
A new take on Yu-Gi-Oh deck building, going head to head with opponents, blind wagering on cards to add to your deck.
Live version available at: https://noahzydel.com/wager/

## 📖 Overview
A tool focused on adding another layer to deck building within the Yu-Gi-Oh card game. The idea came from the card game GOPS (https://playingcarddecks.com/blogs/how-to-play/gops-game-rules). A card list, following the same format as cube format lists, is chosen, and a total number of tokens is decided by the host.

The game starts with a card being chosen from the list, and shown to all players. Every player gets a chance to wager some of their remaining tokens on the card, and the card goes to the highest wager (a winner is chosen in the case of a tie), and everyone's wagers are subtracted from their tokens. Players are moved to a liquidating screen, where they are shown their deck, and have the option to click and remove card(s) from it in order to be given back the lowest wager that was put on that card. Gameplay repeats until either all cards are gone, or players have at least 40 cards each and all agree to end. 

After gameplay is completed, players can download a .ydk file of their deck to import into the dueling software of their choice.

## ⭐️ Current Version
v0.0.1
- Card list is already chosen for you (https://ygoprodeck.com/cube/view-cube/11)
- Token count is predetermined (1000)
- Information displayed to players:
  - Their token count
  - Their deck size
  - Total number of cards remaining in the list
  - Name & description of wager card
  - Name & description of card in player's deck being hovered over
- Clicking a card gives it a red border, toggling its selection for liquidation
- Finishing a game lets the player download the .ydk for their deck

## Previous Versions
N/A

## 🔜 Hopeful Features
- Room system same as the deckbuilding game (may make a seperate program for just rooms/lobby)
- Allow players to set their own name
- Show players the other players in the game
- Show the players how many other players still need to wager/liquidate
- Allow host to set rule that players gain X tokens every Y rounds
- Allow multiple card lists to choose from:
  - Host chooses from drop down
  - Upload local file to use
  - Every player chooses a list, and it's a roulette
- Show players the breakdown of their deck: number of spell/trap/monster cards
- Show breakdown of remaining cards: number of spell/trap/monster cards

## 🪚 Built With
- node.js
- express.js
- socket.io

## 🔨 Build Instructions
After forking and cloning, navigate to the repository in your command line and install the NPM packages:
```
npm install
```
Run the following script in your command line:
```
npm start
```
Once the server is running, go to http://localhost:8090 in your browser.
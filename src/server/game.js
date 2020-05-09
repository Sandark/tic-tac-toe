const support = require("./support");
const winCombinations = ["012", "345", "678", "036", "147", "258", "048", "246"];

function Game(id = support.getRandomId(5).toUpperCase(),
              players = {},
              currentTurn = "X") {
    this.id = id;
    this.players = players;
    this.field = {};
    this.winner = undefined;
    this.currentTurn = currentTurn;

    this.addPlayer = (id) => {
        if (Object.keys(this.players).includes(id)) {
            return true;
        }

        if (Object.keys(this.players).length === 2) {
            return false;
        } else {
            this.players[id] = Object.values(this.players).includes("X") ? "O" : "X";
            return true;
        }
    }

    this.deletePlayer = (id) => {
        delete this.players[id];
    }

    this.hasPlayers = () => {
        return Object.keys(this.players).length > 0;
    }

    this.getOpponent = (playerId) => {
        return Object.keys(players).find(p => p !== playerId);
    }

    this.getSymbol = (id) => {
        return this.players[id];
    }

    this.makeTurn = (id, selectedCell) => {
        let symbol = this.players[id];
        this.currentTurn = this.currentTurn === "X" ? "O" : "X";
        this.field[selectedCell] = symbol;
        this.findWinner();

        if (this.winner !== undefined) {
            this.state = "won";
        } else if (Object.keys(this.field).length === 9) {
            this.state = "draw";
        }
    }

    this.findWinner = () => {
        for (let combination of winCombinations) {
            let rowValues = "";
            for (let n of combination.split("")) {
                if (this.field["c" + n] !== undefined) {
                    rowValues += this.field["c" + n];
                }
            }

            if (rowValues === "XXX") {
                this.winner = "X";
            } else if (rowValues === "OOO") {
                this.winner = "O";
            }
        }

        if (this.winner === undefined && Object.keys(this.field).length === 9) {
            this.winner = "XO";
        }
    }

    this.finished = () => {
        return this.winner !== undefined;
    }

    this.getState = (playerId) => {
        return {
            gameId: this.id,
            field: this.field,
            currentTurn: this.currentTurn,
            player: this.getSymbol(playerId),
            opponentSymbol: "XO".replace(this.getSymbol(playerId), ""),
            opponent: this.getOpponent(playerId)
        }
    }
}

module.exports = {
    Game
}
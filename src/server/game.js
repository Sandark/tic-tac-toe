const support = require("./support");
const winCombinations = ["012", "345", "678", "036", "147", "258", "048", "246"];

class Game {
    constructor(id = support.getRandomId(5).toUpperCase()) {
        this.id = id;
        this.players = {};
        this.field = {};
        this.winner = undefined;
        this.currentTurn = "X";
        this.xWin = 0;
        this.oWin = 0;
    }

    addPlayer = (id) => {
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

    deletePlayer = (playerId) => {
        delete this.players[playerId];
    }

    hasPlayers = () => {
        return Object.keys(this.players).length > 0;
    }

    hasPlayer = (playerId) => {
        return Object.keys(this.players).includes(playerId);
    }

    getOpponent = (playerId) => {
        return Object.keys(this.players).find(p => p !== playerId);
    }

    getSymbol = (playerId) => {
        return this.players[playerId];
    }

    makeTurn = (id, selectedCell) => {
        let symbol = this.players[id];
        this.currentTurn = this.currentTurn === "X" ? "O" : "X";
        this.field[selectedCell] = symbol;
        this.findWinner();
    }

    findWinner = () => {
        for (let combination of winCombinations) {
            let rowValues = "";
            for (let n of combination.split("")) {
                if (this.field["c" + n] !== undefined) {
                    rowValues += this.field["c" + n];
                }
            }

            if (rowValues === "XXX") {
                this.winner = "X";
                this.xWin++;
                break;
            } else if (rowValues === "OOO") {
                this.winner = "O";
                this.oWin++;
                break;
            }
        }

        if (this.winner === undefined && Object.keys(this.field).length === 9) {
            this.winner = "XO";
        }
    }

    finished = () => {
        return this.winner !== undefined;
    }

    restart = () => {
        this.currentTurn = this.winner === "XO" ? "X" : this.winner;
        this.winner = undefined;
        this.field = {};
    }

    getState = (playerId) => {
        return {
            gameId: this.id,
            field: this.field,
            currentTurn: this.currentTurn,
            player: this.getSymbol(playerId),
            opponentSymbol: "XO".replace(this.getSymbol(playerId), ""),
            opponent: this.getOpponent(playerId),
            score: `${this.xWin}:${this.oWin}`,
            winner: this.winner
        };
    }
}



module.exports = Game;
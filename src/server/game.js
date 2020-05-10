const support = require("./support");
const winCombinations = ["012", "345", "678", "036", "147", "258", "048", "246"];

function Game(id = support.getRandomId(5).toUpperCase()) {
    this.id = id;
    this.players = {};
    this.field = {};
    this.winner = undefined;
    this.currentTurn = "X";
    this.xWin = 0;
    this.oWin = 0;

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

    this.deletePlayer = (playerId) => {
        delete this.players[playerId];
    }

    this.hasPlayers = () => {
        return Object.keys(this.players).length > 0;
    }

    this.hasPlayer = (playerId) => {
        return Object.keys(this.players).includes(playerId);
    }

    this.getOpponent = (playerId) => {
        return Object.keys(this.players).find(p => p !== playerId);
    }

    this.getSymbol = (playerId) => {
        return this.players[playerId];
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

    this.finished = () => {
        return this.winner !== undefined;
    }

    this.restart = () => {
        this.currentTurn = this.winner === "XO" ? "X" : this.winner;
        this.winner = undefined;
        this.field = {};
    }

    this.getState = (playerId) => {
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

module.exports = {
    Game
}
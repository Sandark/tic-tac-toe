const field = document.getElementById("game-field");
const cells = document.querySelectorAll(".cell");
const playerX = document.getElementById("player-x");
const playerXStatus = document.getElementById("player-x-status");
const playerO = document.getElementById("player-o");
const playerOStatus = document.getElementById("player-o-status");
const gameIdInput = document.getElementById("game-id-input");
const gameWinner = document.querySelector(".game_winner");
const score = document.querySelector("#score");

const joinGameButton = document.getElementById("join-game");
const startNewButton = document.getElementById("start-new");
const disconnectButton = document.getElementById("disconnect-game");

const socket = io("/",
    {
        autoConnect: false,
        reconnect_attempt: 1
    });

let playerSymbol;
let opponentSymbol;

disableAllCells();
gameIdInput.value = "";

/* Setup listeners for buttons */
joinGameButton.addEventListener("click", () => {
    if (gameIdInput.value !== "") {
        gameIdInput.classList.remove("error");

        if (!socket.connected) {
            socket.open();
            socket.emit("join.game", gameIdInput.value);
            onConnectionOpened();
        }
    } else {
        gameIdInput.classList.add("error");
    }
});

startNewButton.addEventListener("click", () => {
    if (!socket.connected) {
        socket.open();
        socket.emit("create.game");
        onConnectionOpened();
    }
});

disconnectButton.addEventListener("click", () => {
    if (socket.connected) {
        socket.close();
        onConnectionClosed();
    }

    disableAllCells();
    cleanAllCells();
    gameIdInput.value = "";
});

function onConnectionOpened() {
    startNewButton.disabled = true;
    joinGameButton.disabled = true;
    gameIdInput.disabled = true;
}

function onConnectionClosed() {
    startNewButton.disabled = false;
    joinGameButton.disabled = false;
    gameIdInput.disabled = false;
}

cells.forEach(b => {
    b.addEventListener("click", (evt) => {
        if (evt.target.disabled) {
            console.log(`Button ${evt.target.id} is disabled`);
            return;
        }
        evt.preventDefault();
        evt.target.innerText = playerSymbol;
        socket.emit("move.made", evt.currentTarget.id, playerSymbol);
        disableAllCells();
        playerX.classList.toggle("current");
        playerO.classList.toggle("current");
    });
});

/* Request player ID from server if missing */
if (readCookie("userId") === null) {
    fetch("/get_player_id")
        .then(res => res.json())
        .then(res => createCookie("userId", res.playerId, 1));
}

/* Game logic */
function cleanAllCells() {
    cells.forEach(b => b.innerText = "");
}

function disableAllCells() {
    cells.forEach(b => b.disabled = true);
}

function enableEmptyCells() {
    cells.forEach(b => {
        if (b.innerText === "" || b.innerText === undefined) {
            b.disabled = false
        }
    });
}

socket.on("disconnected", () => {

})

socket.on("wrong.game", () => {
    socket.close();
    gameIdInput.classList.add("error");
    onConnectionClosed();
});

socket.on("moved.player", (btn, value, currentTurn) => {
    document.getElementById(btn).innerText = value;

    if (currentTurn === playerSymbol) {
        enableEmptyCells();
    }

    if (currentTurn === "X") {
        playerX.classList.add("current");
        playerO.classList.remove("current");
    } else {
        playerO.classList.add("current");
        playerX.classList.remove("current");
    }
});

socket.on("joined.game", (gameState) => {
    gameIdInput.value = "GameID: " + gameState.gameId;

    playerSymbol = gameState.player;
    opponentSymbol = gameState.opponentSymbol;

    updateStateInfo(playerSymbol, "You");
    updateStateInfo(opponentSymbol, gameState.opponent ? "Online" : "Offline");

    Object.keys(gameState.field).forEach(key => {
        document.getElementById(key).innerText = gameState.field[key];
    })

    if (gameState.currentTurn === playerSymbol && !status.winner) {
        enableEmptyCells();
    }

    score.innerText = gameState.score;
    gameState.currentTurn === "X" ? playerX.classList.add("current") : playerO.classList.add("current");
});

socket.on("restarted.game", (gameState) => {
    cleanAllCells();
    field.classList.remove("field_blurred");
    gameWinner.classList.remove("visible");

    if (gameState.currentTurn === playerSymbol) {
        enableEmptyCells();
    }

    playerX.classList.remove("winner");
    playerO.classList.remove("winner");
})

socket.on("finished.game", (gameState) => {
    disableAllCells();

    score.innerText = gameState.score;
    field.classList.add("field_blurred");
    gameWinner.innerText = gameState.winner;
    gameWinner.classList.add("visible");

    playerO.classList.remove("current");
    playerX.classList.remove("current");
});

socket.on("joined.player", (anotherPlayer) => {
    updateStateInfo(anotherPlayer, "Online");
})

socket.on("disconnected.player", (anotherPlayer) => {
    updateStateInfo(anotherPlayer, "Offline");
})

function updateStateInfo(player, state) {
    if (player === "X") {
        playerXStatus.innerText = state;
    } else if (player === "O") {
        playerOStatus.innerText = state;
    }
}

/* Cookie specific functions */
function createCookie(name, value, days) {
    let expires = "";
    if (days) {
        let date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }

    document.cookie = name + "=" + value + expires + "; path=/";
}

function readCookie(name) {
    let nameEQ = name + "=";
    let ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function eraseCookie(name) {
    createCookie(name, "", -1);
}

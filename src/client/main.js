const cells = document.querySelectorAll(".cell");
const playerX = document.getElementById("player-x");
const playerXStatus = document.getElementById("player-x-status");
const playerO = document.getElementById("player-o");
const playerOStatus = document.getElementById("player-o-status");
const gameIdInput = document.getElementById("game-id-input");

const joinGameButton = document.getElementById("join-socket");

let socket = io("/",
    {
        autoConnect: false
    });

let playerSymbol;

joinGameButton.addEventListener("click", () => {
    eraseCookie("gameId");
    if (gameIdInput.value !== "") {
        createCookie("gameId", gameIdInput.value);
    }

    if (!socket.connected) {
        socket.open();
    }
})

cells.forEach(b => {
    b.addEventListener("click", (evt) => {
        if (evt.target.disabled) {
            console.log(`Button ${evt.target.id} is disabled`);
            return;
        }
        evt.preventDefault();
        evt.target.innerText = playerSymbol;
        socket.emit("move", evt.currentTarget.id, playerSymbol);
        disableAllCells();
        playerX.classList.toggle("current");
        playerO.classList.toggle("current");
    });
});

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

socket.on("move", (btn, value, currentTurn) => {
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

socket.on("id generated", (userId) => {
    if (readCookie("userId") !== userId) {
        createCookie("userId", userId, 1);
    }
})

socket.on("joined", (game) => {
    eraseCookie("gameId");
    createCookie("gameId", game.id);
    gameIdInput.value = game.id;

    playerSymbol = game.getSymbol(readCookie("userId"));
    document.getElementById("chat").innerText = `You've joined the game, your symbol is ${playerSymbol} and game id is ${game.id}`;

    if (playerSymbol === "X") {
        playerXStatus.innerText = "You";

        if (Object.values(game.players).includes("O")) {
            playerOStatus.innerText = "Online";
        } else {
            playerOStatus.innerText = "Offline";
        }
    } else {
        playerOStatus.innerText = "You";

        if (Object.values(game.players).includes("X")) {
            playerXStatus.innerText = "Online";
        } else {
            playerXStatus.innerText = "Offline";
        }
    }

    Object.keys(game.field).forEach(key => {
        document.getElementById(key).innerText = game.field[key];
    })

    if (game.currentTurn === playerSymbol) {
        enableEmptyCells();
    }

    game.currentTurn === "X" ? playerX.classList.add("current") : playerO.classList.add("current");
});

socket.on("player joined", (anotherPlayer) => {
    if (anotherPlayer === "X") {
        playerXStatus.innerText = "Online";
    } else if (anotherPlayer === "O") {
        playerOStatus.innerText = "Online";
    }
})

socket.on("player left", (anotherPlayer) => {
    if (anotherPlayer === "X") {
        playerXStatus.innerText = "Offline";
    } else if (anotherPlayer === "O") {
        playerOStatus.innerText = "Offline";
    }
})

socket.on("disconnected", () => {
    document.getElementById("chat").innerText = "This game already has 2 players";
})

socket.on("game end", (winner) => {
    if (winner === "N") {
        document.getElementById("chat").innerText = "This is draw! Game will be restarted in 10 sec.";
    } else if (winner === playerSymbol) {
        document.getElementById("chat").innerText = "Congratulation! You're the winner!";
    } else {
        document.getElementById("chat").innerText = `Player ${winner} has won.`;
    }

    if (winner === "X") {
        playerX.classList.add("winner");
        playerX.classList.add("current");
        playerO.classList.remove("current");
    } else if (winner === "O") {
        playerO.classList.add("winner");
        playerO.classList.add("current");
        playerX.classList.remove("current");
    }

    disableAllCells();
})

socket.on("game reset", (game) => {
    cleanAllCells();
    document.getElementById("chat").innerText = "Game was restarted!";

    if (game.currentTurn === playerSymbol) {
        enableEmptyCells();
    }

    if (game.currentTurn === "X") {
        playerX.classList.add("current");
        playerO.classList.remove("current");
    } else {
        playerO.classList.add("current");
        playerX.classList.remove("current");
    }

    playerX.classList.remove("winner");
    playerO.classList.remove("winner");
})

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
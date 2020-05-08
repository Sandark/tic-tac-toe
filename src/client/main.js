const cells = document.querySelectorAll("button");
const playerX = document.getElementById("player-x");
const playerXStatus = document.getElementById("player-x-status");
const playerO = document.getElementById("player-o");
const playerOStatus = document.getElementById("player-o-status");

const socket = io();

let playerSymbol;

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

socket.on("joined", (status) => {
    if (readCookie("userId") !== status.playerId) {
        createCookie("userId", status.playerId, 1);
    }

    playerSymbol = status.joinedAs;
    document.getElementById("chat").innerText = "You've joined the game, your symbol is " + playerSymbol;

    if (playerSymbol === "X") {
        playerXStatus.innerText = "You";

        if (status.playerOStatus) {
            playerOStatus.innerText = "Online";
        } else {
            playerOStatus.innerText = "Offline";
        }
    } else {
        playerOStatus.innerText = "You";

        if (status.playerXStatus) {
            playerXStatus.innerText = "Online";
        } else {
            playerXStatus.innerText = "Offline";
        }
    }

    Object.keys(status.field).forEach(key => {
        document.getElementById(key).innerText = status.field[key];
    })

    if (status.currentTurn === playerSymbol) {
        enableEmptyCells();
    }

    status.currentTurn === "X" ? playerX.classList.add("current") : playerO.classList.add("current");
});

socket.on("player joined", (anotherPlayer) => {
    if (anotherPlayer === "X") {
        playerXStatus.innerText = "Online";
    }else if (anotherPlayer === "O") {
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

    if(winner === "X") {
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

socket.on("game reset", (currentTurn) => {
    cleanAllCells();
    document.getElementById("chat").innerText = "Game was restarted!";

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
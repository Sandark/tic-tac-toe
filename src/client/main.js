
const buttons = document.querySelectorAll("button");

const socket = io();

let playerSymbol;

function cleanAllFields() {
    buttons.forEach(b => b.innerText = "");
}

function disableAllFields() {
    buttons.forEach(b => b.disabled = true);
}

function enableEmptyFields() {
    buttons.forEach(b => {
        if (b.innerText === "" || b.innerText === undefined) {
            b.disabled = false
        }
    });
}

buttons.forEach(b => {
    b.addEventListener("click", (evt) => {
        if (evt.target.disabled) {
            console.log(`Button ${evt.target.id} is disabled`);
            return;
        }
        evt.preventDefault();
        evt.target.innerText = playerSymbol;
        socket.emit("cell selected", evt.currentTarget.id, playerSymbol);
        disableAllFields();
    });
});

socket.on("cell selected", (btn, value, currentTurn) => {
    document.getElementById(btn).innerText = value;

    if (currentTurn === playerSymbol) {
        enableEmptyFields();
    }
});

socket.on("joined", (value, name) => {
    playerSymbol = value;
    document.getElementById("chat").innerText = "You've joined the game, your symbol is " + value;
    document.getElementById("title").innerText = name;
});

socket.on("disconnected", () => {
    document.getElementById("chat").innerText = "This game already has 2 players";
})

socket.on("retrieve field", (field, currentTurn) => {
    Object.keys(field).forEach(key => {
        document.getElementById(key).innerText = field[key];
    })

    if (currentTurn === playerSymbol) {
        enableEmptyFields();
    }
})

socket.on("game end", (winner) => {
    if (winner === "N") {
        document.getElementById("chat").innerText = "This is draw! Game will be restarted in 10 sec.";
    } else if (winner === playerSymbol) {
        document.getElementById("chat").innerText = "Congratulation! You're the winner!";
    } else {
        document.getElementById("chat").innerText = `Player ${winner} has won.`;
    }

    disableAllFields();
})

socket.on("game reset", (currentTurn) => {
    cleanAllFields();
    document.getElementById("chat").innerText = "Game was restarted!";

    if (currentTurn === playerSymbol) {
        enableEmptyFields();
    }
})



let socket = io();

let buttons = document.querySelectorAll("button");

let char;

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
        evt.target.innerText = char;
        socket.emit("cell selected", evt.currentTarget.id, char);
        disableAllFields();
    });
});

socket.on("cell selected", (btn, value, currentTurn) => {
    document.getElementById(btn).innerText = value;

    if (currentTurn === char) {
        enableEmptyFields();
    }
});

socket.on("joined", (value, name) => {
    char = value;
    document.getElementById("chat").innerText = "You've joined the game, you char is " + value;
    document.getElementById("title").innerText = name;
});

socket.on("game full", () => {
    document.getElementById("chat").innerText = "This game already has 2 players";
})

socket.on("retrieve field", (field, currentTurn) => {
    Object.keys(field).forEach(key => {
        document.getElementById(key).innerText = field[key];
    })

    if (currentTurn === char) {
        enableEmptyFields();
    }
})

socket.on("game end", (winner) => {
    if (winner === undefined) {
        document.getElementById("chat").innerText = "This is draw! Game will be restarted in 10 sec.";
    } else {
        if (winner === char) {
            document.getElementById("chat").innerText = "Congratulation! You're the winner!";
        } else {
            document.getElementById("chat").innerText = `Player ${winner} has won.`;
        }
    }

    disableAllFields();
})

socket.on("game reset", (currentTurn) => {
    cleanAllFields();
    document.getElementById("chat").innerText = "Game was restarted!";

    if (currentTurn === char) {
        enableEmptyFields();
    }
})
// let url_string = window.location.href;
// let url = new URL(url_string);
// let id = url.searchParams.get("id");
// console.log(id);
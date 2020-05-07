const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const bodyParser = require("body-parser");

const port = process.env.PORT || 8080;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}))
app.use(express.static("src/client"));

app.get("/", (req, res) => {
    res.sendFile("src/client/index.html");
});

let users = {};
let field = {};
let currentTurn = "X";

const winCombinations = ["012", "345", "678", "036", "147", "258", "148", "246"];

io.on("connection", (socket) => {
    if (!Object.values(users).includes("X")) {
        users[socket.id] = "X";
        socket.emit("joined", "X", "Player X");
    } else if (!Object.values(users).includes("O")) {
        users[socket.id] = "O";
        socket.emit("joined", "O", "Player O");
    } else {
        socket.emit("game full");
        socket.disconnect(true);
        return;
    }

    socket.emit("retrieve field", field, currentTurn)

    console.log(`A user connected ${socket.id} with ${users[socket.id]}`);

    socket.on('disconnect', () => {
        console.log(`user disconnected ${socket.id} with ${users[socket.id]}`);
        delete users[socket.id];
    });

    socket.on("cell selected", (btn, char) => {
        console.log(`Button with id ${btn} was pressed with char ${char}`);

        field[btn] = char;
        currentTurn = char === "X" ? "O" : "X";
        socket.broadcast.emit("cell selected", btn, char, currentTurn);

        const winner = findWinner();

        if (winner !== undefined) {
            io.emit("game end", winner);

            setTimeout(() => {
                field = {};
                currentTurn = winner;

                io.emit("game reset", currentTurn);
            }, 10000)
        } else if (Object.keys(field).length === 9) {
            io.emit("game end");

            setTimeout(() => {
                field = {};
                currentTurn = "X";

                io.emit("game reset", currentTurn);
            }, 10000)
        }
    })
});

function findWinner() {
    let winner;
    for (let c of winCombinations) {
        let combination = "";
        for (let n of c.split("")) {
            if (field["c" + n] !== undefined) {
                combination += field["c" + n];
            }
        }

        if (combination === "XXX") {
           return  "X";
        } else if (combination === "OOO") {
            return "O";
        }
    }
}

http.listen(port, () => {
    console.log(`App is running on port ${port}`);
});


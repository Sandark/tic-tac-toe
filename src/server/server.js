const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const bodyParser = require("body-parser");
const {v4: uuid} = require("uuid");
const gameFactory = require("./game.js");

const port = process.env.PORT || 8080;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}))
app.use(express.static("src/client"));

app.get("/", (req, res) => {
    res.sendFile("src/client/index.html");
});

let game;

let destroyTimeout;

io.on("connection", (socket) => {
    console.log("Cookies: " + socket.request.headers.cookie);

    if (game === undefined) {
        game = new gameFactory.Game(uuid());
    }

    if (game.addPlayer(getPlayerId(socket)) === false) {
        socket.emit("disconnected");
        socket.disconnect(true);
        console.log(`User was disconnected as game doesn't have more space ${getPlayerId(socket)}`);
        return;
    }

    if (game.hasPlayers() && destroyTimeout !== undefined) {
        console.info(`Game ${game.id} destruction canceled.`);
        clearTimeout(destroyTimeout);
        destroyTimeout = undefined;
    }

    console.log(`A user connected ${getPlayerId(socket)}`);

    socket.emit("joined", game.getSymbol(getPlayerId(socket)), `Player ${game.getSymbol(getPlayerId(socket))}`);
    socket.emit("retrieve field", game.field, game.currentTurn)

    socket.on('disconnect', () => {
        console.info(`user disconnected ${getPlayerId(socket)}`);
        game.deletePlayer(getPlayerId(socket));

        if (!game.hasPlayers()) {
            console.info(`All players have left. Game ${game.id} will be destroyed in 1 minute`);
            destroyTimeout = setTimeout(() => {
                console.info(`Game ${game.id} was destroyed.`)
                game = new gameFactory.Game(uuid());
            }, 60*1000);
        }
    });

    socket.on("cell selected", (selectedCellId) => {
        console.log(`Button with id ${selectedCellId} was pressed by user ${getPlayerId(socket)}`);

        game.makeTurn(getPlayerId(socket), selectedCellId);
        socket.broadcast.emit("cell selected", selectedCellId, game.getSymbol(getPlayerId(socket)), game.currentTurn);

        if (game.winner !== undefined) {
            io.emit("game end", game.winner);

            setTimeout(() => {
                game = new gameFactory.Game(uuid(), game.players, game.winner);

                io.emit("game reset", game.currentTurn);
            }, 10000)
        }
    })
});

function getPlayerId(socket) {
    return socket.id;
}

http.listen(port, () => {
    console.log(`App is running on port ${port}`);
});


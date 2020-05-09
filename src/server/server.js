const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const bodyParser = require("body-parser");
const gameFactory = require("./game");
const support = require("./support");

const port = process.env.PORT || 8080;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}))
app.use(express.static("src/client"));

app.get("/", (req, res) => {
    res.sendFile("src/client/index.html");
});

http.listen(port, () => {
    console.log(`App is running on port ${port}`);
});

let games = {};
let gamesDestroyTimeout = {};
let playerRemovalTimeout = {};

io.on("connection", (socket) => {
    let game = getGame(socket);

    socket.join(game.id);

    if (game.addPlayer(support.getPlayerId(socket)) === false) {
        socket.emit("disconnected");
        socket.disconnect(true);
        console.log(`User was disconnected as game doesn't have more space ${support.getPlayerId(socket)}`);
        return;
    }

    if (game.hasPlayers() && gamesDestroyTimeout[game.id] !== undefined) {
        console.info(`Game ${game.id} destruction canceled.`);
        clearTimeout(gamesDestroyTimeout[game.id]);
        delete gamesDestroyTimeout[game.id];
    }

    if (playerRemovalTimeout[support.getPlayerId(socket)] !== undefined) {
        clearTimeout(playerRemovalTimeout[support.getPlayerId(socket)]);
        delete playerRemovalTimeout[support.getPlayerId(socket)];
    }

    console.log(`A user connected ${support.getPlayerId(socket)}`);

    if (!support.getPlayerId(socket)) {
        socket.emit("id generated", support.getRandomId());
    }
    socket.emit("joined", game);

    socket.to(game.id).emit("player joined", game.getSymbol(support.getPlayerId(socket)));

    socket.on('disconnect', onDisconnect(socket, game));

    socket.on("move.made", (selectedCellId) => {
        const playerId = support.getPlayerId(socket);
        const currentGame = getGame(socket);

        console.log(`Button with id ${selectedCellId} was pressed by user ${playerId}`);

        currentGame.makeTurn(playerId, selectedCellId);

        if (currentGame.finished()) {
            socket.broadcast.emit("move", selectedCellId, currentGame.getSymbol(playerId), currentGame.winner);
            io.emit("game end", currentGame.winner);

            setTimeout(() => {
                let newGame = new gameFactory.Game(currentGame.players, currentGame.winner === "N" ? "X" : currentGame.winner);
                games[newGame.id] = newGame;

                io.emit("game reset", newGame);
            }, 10000)
        } else {
            socket.broadcast.emit("move", selectedCellId, currentGame.getSymbol(playerId), game.currentTurn);
        }
    })
});

function getGame(socket) {
    let gameId = support.getGameId(socket);

    if (gameId === null || games[gameId] === undefined) {
        let newGame = new gameFactory.Game();
        gameId = newGame.id;
        games[gameId] = newGame;
    }

    return games[gameId];
}

function onDisconnect(socket) {
    return () => {
        const playerId = support.getPlayerId(socket);
        const currentGame = getGame(socket);

        console.info(`Player ${playerId} was disconnected from game ${currentGame.id}.`);
        io.to(currentGame.id).emit("player left", currentGame.getSymbol(playerId));

        playerRemovalTimeout[playerId] = setTimeout(() => {
            currentGame.deletePlayer(playerId);

            if (!currentGame.hasPlayers()) {
                console.info(`All players have left. Game ${currentGame.id} will be destroyed in 60 seconds`);
                gamesDestroyTimeout[currentGame.id] = setTimeout(() => {
                    console.info(`Game ${currentGame.id} was destroyed.`)
                    delete games[currentGame.id];
                }, 60 * 1000);
            }

        }, 30 * 1000)
    };
}
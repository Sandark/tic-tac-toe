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

app.get("/get_player_id", (req, res) => {
    res.json({
        playerId: support.getRandomId()
    });
})

http.listen(port, () => {
    console.log(`App is running on port ${port}`);
});

let games = {};
let gamesDestroyTimeout = {};
let playerRemovalTimeout = {};

io.on("connection", (socket) => {
    console.log(`A user connected ${support.getPlayerId(socket)}`);

    socket.on("join.game", onJoinGame(socket))

    socket.on("create.game", onCreateGame(socket))

    socket.on('disconnect', onDisconnect(socket));

    socket.on("move.made", onMoveMade(socket))
});

function onJoinGame(socket) {
    return (gameId) => {
        let game = games[gameId.toUpperCase()];

        if (game) {
            onJoinedGamed(game, socket);
        } else {
            socket.emit("wrong.game");
        }
    };
}

function onCreateGame(socket) {
    return () => {
        let newGame = new gameFactory.Game();
        onJoinedGamed(newGame, socket);
        games[newGame.id] = newGame;
        console.log(`New game ${newGame.id} is created`);
    };
}

function onJoinedGamed(game, socket) {
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

    socket.emit("joined.game", game);
    socket.to(game.id).emit("joined.player", game.getSymbol(support.getPlayerId(socket)));
}

function onMoveMade(socket) {
    return (selectedCellId) => {
        const playerId = support.getPlayerId(socket);
        const currentGame = getGame(playerId);

        if (currentGame === undefined) {
            return;
        }

        console.log(`Button with id ${selectedCellId} was pressed by user ${playerId}`);

        currentGame.makeTurn(playerId, selectedCellId);

        if (currentGame.finished()) {
            socket.to(currentGame.id).emit("moved.player", selectedCellId, currentGame.getSymbol(playerId), currentGame.winner);
            io.to(currentGame.id).emit("game end", currentGame.winner);

            setTimeout(() => {
                let newGame = new gameFactory.Game(currentGame.id, currentGame.players, currentGame.winner === "N" ? "X" : currentGame.winner);
                games[newGame.id] = newGame;

                io.emit("restarted.game", newGame);
            }, 10000)
        } else {
            socket.to(currentGame.id).emit("moved.player", selectedCellId, currentGame.getSymbol(playerId), currentGame.currentTurn);
        }
    };
}

function onDisconnect(socket) {
    return () => {
        const playerId = support.getPlayerId(socket);
        const currentGame = getGame(playerId);

        if (currentGame === undefined) {
            return;
        }

        console.info(`Player ${playerId} was disconnected from game ${currentGame.id}.`);
        io.to(currentGame.id).emit("disconnected.player", currentGame.getSymbol(playerId));

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

function getGame(playerId) {
    return Object.values(games).find(g => g.getSymbol(playerId) !== undefined);
}
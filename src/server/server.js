const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const bodyParser = require("body-parser");
const Game = require("./game");
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

/* Client interaction with server */
io.on("connection", (socket) => {
    console.log(`A user connected ${support.getPlayerId(socket)}`);

    socket.on("join.game", onJoinGame(socket))

    socket.on("create.game", onCreateGame(socket))

    socket.on("move.made", onMoveMade(socket))

    socket.on("disconnect", onDisconnect(socket));
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
        let newGame = new Game();
        onJoinedGamed(newGame, socket);
        games[newGame.id] = newGame;
        console.log(`New game ${newGame.id} is created`);
    };
}

function onJoinedGamed(game, socket) {
    let playerId = support.getPlayerId(socket);

    socket.join(game.id);
    if (game.addPlayer(playerId) === false) {
        socket.emit("disconnected");
        socket.disconnect(true);
        console.info(`User was disconnected as game doesn't have more space ${playerId}`);
        return;
    }

    Object.values(games)
        .filter(g => g.id !== game.id && g.hasPlayer(playerId))
        .forEach(g => {
            g.deletePlayer(playerId);
            console.info(`Player ${playerId} was removed from game ${g.id}`);
            scheduleGameDestructionIfNoPlayers(g);
        });

    if (game.hasPlayers() && gamesDestroyTimeout[game.id] !== undefined) {
        console.info(`Game ${game.id} destruction canceled.`);
        clearTimeout(gamesDestroyTimeout[game.id]);
        delete gamesDestroyTimeout[game.id];
    }

    if (playerRemovalTimeout[playerId] !== undefined) {
        clearTimeout(playerRemovalTimeout[playerId]);
        delete playerRemovalTimeout[playerId];
    }

    socket.emit("joined.game", game.getState(playerId));
    socket.to(game.id).emit("joined.player", game.getSymbol(playerId));
}

function onMoveMade(socket) {
    return (selectedCellId) => {
        const playerId = support.getPlayerId(socket);
        const currentGame = getGame(playerId);

        console.debug(`Button with id ${selectedCellId} was pressed by user ${playerId}`);

        currentGame.makeTurn(playerId, selectedCellId);

        socket.to(currentGame.id).emit("moved.player", selectedCellId, currentGame.getSymbol(playerId), currentGame.currentTurn);

        if (currentGame.finished()) {
            io.to(currentGame.id).emit("finished.game", currentGame.getState());

            setTimeout(() => {
                currentGame.restart();

                io.to(currentGame.id).emit("restarted.game", currentGame.getState());
            }, 10 * 1000)
        }
    };
}

function scheduleGameDestructionIfNoPlayers(game) {
    if (!game.hasPlayers() && gamesDestroyTimeout[game.id] === undefined) {
        console.info(`All players have left. Game ${game.id} will be destroyed in 60 seconds`);
        gamesDestroyTimeout[game.id] = setTimeout(() => {
            console.info(`Game ${game.id} was destroyed.`)
            delete games[game.id];
        }, 60 * 1000);
    }
}

function onDisconnect(socket) {
    return () => {
        const playerId = support.getPlayerId(socket);
        const currentGame = getGame(playerId);

        if (currentGame) {
            console.info(`Player ${playerId} was disconnected from game ${currentGame.id}.`);
            io.to(currentGame.id).emit("disconnected.player", currentGame.getSymbol(playerId));

            playerRemovalTimeout[playerId] = setTimeout(() => {
                currentGame.deletePlayer(playerId);
                scheduleGameDestructionIfNoPlayers(currentGame);
            }, 30 * 1000)
        }
    };
}

function getGame(playerId) {
    return Object.values(games).find(g => g.getSymbol(playerId) !== undefined);
}
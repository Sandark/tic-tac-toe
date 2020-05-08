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
    let gameId = support.getGameId(socket);
    let game;
    if (gameId === null || games[gameId] === undefined) {
        let newGame = new gameFactory.Game();
        gameId = newGame.id;
        games[gameId] = newGame;
    }

    game = games[gameId];

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

    socket.emit("joined", {
        playerId: support.getPlayerId(socket) || support.getRandomId(),
        gameId: game.id,
        joinedAs: game.getSymbol(support.getPlayerId(socket)),
        playerXStatus: game.hasPlayer("X"),
        playerOStatus: game.hasPlayer("O"),
        field: game.field,
        currentTurn: game.currentTurn
    });

    socket.broadcast.emit("player joined", game.getSymbol(support.getPlayerId(socket)));

    socket.on('disconnect', () => {
        const playerId = support.getPlayerId(socket);

        console.info(`user disconnected ${playerId}`);
        io.emit("player left", game.getSymbol(playerId));
        io.emit("player left", game.getSymbol(playerId));

        playerRemovalTimeout[playerId] = setTimeout(() => {
            game.deletePlayer(playerId);

            if (!game.hasPlayers()) {
                console.info(`All players have left. Game ${game.id} will be destroyed in 60 seconds`);
                gamesDestroyTimeout[game.id] = setTimeout(() => {
                    console.info(`Game ${game.id} was destroyed.`)
                    delete games[game.id];
                }, 60 * 1000);
            }

        }, 30 * 1000)
    });

    socket.on("move", (selectedCellId) => {
        const playerId = support.getPlayerId(socket);

        console.log(`Button with id ${selectedCellId} was pressed by user ${playerId}`);

        game.makeTurn(playerId, selectedCellId);

        if (game.winner !== undefined) {
            socket.broadcast.emit("move", selectedCellId, game.getSymbol(playerId), game.winner);
            io.emit("game end", game.winner);

            setTimeout(() => {
                game = new gameFactory.Game(game.players, game.winner === "N" ? "X" : game.winner);

                io.emit("game reset", game);
            }, 10000)
        } else {
            socket.broadcast.emit("move", selectedCellId, game.getSymbol(playerId), game.currentTurn);
        }
    })
});
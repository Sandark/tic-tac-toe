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

users = {};

io.on("connection", (socket) => {
    if (Object.keys(users).length == 0) { 
        users[socket.io] = "X";
        socket.emit("char", "X");
    } else if (Object.keys(users).length == 1) {
        users[socket.io] = "O";
        socket.emit("char", "O");
    } else {
        socket.close();
        return;
    }

    console.log(`A user connected ${socket.id} with ${users[socket.io]}`);


    socket.on('disconnect', () => {
        console.log(`user disconnected ${socket.id}`);
        delete users[socket.io];
      });

    socket.on("cell selected", (btn, char) => {
        console.log(`Button with id ${btn} was pressed with char ${char}`);

        socket.broadcast.emit("cell selected", btn, char);
    })
});

http.listen(port, () => {
    console.log(`App is running on port ${port}`);
});
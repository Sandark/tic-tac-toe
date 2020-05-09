const crypto = require("crypto");

function getRandomId(length = 10) {
    return crypto.randomBytes(length).toString("hex");
}

function getPlayerId(socket) {
    return readCookie("userId", socket);
}

function getGameId(socket) {
    return readCookie("gameId", socket);
}

function readCookie(name, socket) {
    let nameEQ = name + "=";
    let ca = socket.request.headers.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

module.exports = {
    getRandomId,
    getPlayerId,
    getGameId
}
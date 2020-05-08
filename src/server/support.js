const crypto = require("crypto");

function getRandomId() {
    return crypto.randomBytes(10).toString("hex");
}

function getPlayerId(socket) {
    return readCookie("userId", socket.request.headers.cookie);
}

function readCookie(name, cookies) {
    let nameEQ = name + "=";
    let ca = cookies.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

module.exports = {
    getRandomId,
    getPlayerId
}
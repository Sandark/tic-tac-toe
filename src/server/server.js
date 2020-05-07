const express = require("express");
const app = express();

const port = process.env.PORT || 8080;

app.use(express.static("src/client"));

app.listen(port, () => {
    console.log(`App is running on port ${port}`)
});

app.get("/", (req, res) => {
    res.sendFile("src/client/index.html");
})
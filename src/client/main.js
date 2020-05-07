let socket = io();

let buttons = document.querySelectorAll("button");

let char;

buttons.forEach(b => {
    b.addEventListener("click", (evt) =>{
        evt.preventDefault();
        b.innerText = char;
        socket.emit("cell selected", evt.currentTarget.id, char);
    });
});

socket.on("cell selected", (btn, char) => {
    document.getElementById(btn).innerText = char;
});

socket.on("char", (value) => {
    char = value;
});

// let url_string = window.location.href;
// let url = new URL(url_string);
// let id = url.searchParams.get("id");
// console.log(id);
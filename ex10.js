var http = require("http").createServer(handler);
var io = require("socket.io").listen(http); // socket.io for permanent connection between server and client
var fs = require("fs"); //var for file system
var firmata = require("firmata");
var desiredValue = 0; // desired value var
//var socket = io.connect("172.16.22.224:8080"); // create socket - connect to it

var board = new firmata.Board("/dev/ttyACM0", function(){ // ACM Abstract Control Model for serial communication with Arduino (could be USB)
console.log("Connecting to Arduino");
console.log("Enabling analog Pin 0");
board.pinMode(0, board.MODES.ANALOG); // analog pin 0
});

function handler (req,res) {
fs.readFile(__dirname+"/example10.html",
function(err,data) {
if (err) {
res.writeHead(500,{"Content-Type":"text/plain"});
return res.end("Error loading html page.");
}
res.writeHead(200);
res.end(data);
});
}

var desiredValue = 0; // desired value var
var clientIpAddress=null;
http.listen(8080); // server will listen on port 8080

board.on("ready", function() {
    board.analogRead(0, function(value) {
    desiredValue = value; // continuous read of pin A0
});

io.sockets.on('connection', function(socket) {  // from bracket ( onward, we have an argument of the function on -> at 'connection' the argument is transfered i.e. function(socket)
    socket.emit("messageToClient", "Server connected, board ready.");
    setInterval(sendValues, 40, socket); // na 40ms we send message to client
}); // end of socket



    

    

                
}); // end board.digitalRead on pin 2

function sendValues (socket) {
    socket.emit("clientReadValues",
    {
    "desiredValue": desiredValue    
    });
};


var http = require("http").createServer(handler);
var io=require("socket.io").listen(http); //socket library
var fs= require ("fs"); //variable for file system
var firmata = require("firmata");



var board = new firmata.Board("/dev/ttyACM0", function(){ // ACM Abstract Control Model for serial communication with Arduino (could be USB)
    console.log("Connecting to Arduino");
 
    console.log("Activation of Pin 13");
    board.pinMode(13, board.MODES.OUTPUT); // Configures the specified pin to behave either as an input or an output.
});

function handler (req, res) {
    
    fs.readFile(__dirname+"/example04.html",
    
    function (err, data) 
    {
        
        if (err) {
            
            res.writeHead(500, {"Content-Type": "text/plain"});
            return res.end("Error loading html page.");
            
        }
       res.writeHead(200);
       res.end(data);
        
    });
    
}


http.listen(8080); //server will listen on part 8080

io.sockets.on("connection", function(socket) {
    socket.on("commandToArduino", function(commandNo){
        console.log("hgkjhg,kjhhbkj,");
        if (commandNo == "1") {
            board.digitalWrite(13, board.HIGH); // write HIGH on pin 13
            console.log("hgkjhg,kjhhbkj,");
        }
        if (commandNo == "0") {
            board.digitalWrite(13, board.LOW); // write LOW on pin 13
            console.log("hgkjhg,kjhhbkj,");
        }
    });
});


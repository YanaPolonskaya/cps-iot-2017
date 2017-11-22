var http = require("http").createServer(handler); // on req - hand
var io = require("socket.io").listen(http); // socket library
var fs = require("fs"); // variable for file system for providing html
var firmata = require("firmata");
var controlAlgorihtmStartedFlag = 0; // flag in global scope to see weather ctrlAlg has been started
var intervalCtrl; // var for setInterval in global space
var pwm = 0;
var Kp = 0.55; // proportional factor
var Ki = 0.008; // integral factor
var Kd = 0.15; // differential factor
var pwm = 0;
var pwmLimit = 254;

var err = 0; // variable for second pid implementation
var errSum = 0; // sum of errors
var dErr = 0; // difference of error
var lastErr = 0; // to keep the value of previous error
console.log("Starting the code");

var board = new firmata.Board("/dev/ttyACM0", function(){
    console.log("Connecting to Arduino");
    
    board.pinMode(0, board.MODES.ANALOG); // analog pin 0
    
    board.pinMode(1, board.MODES.ANALOG); // analog pin 1
    board.pinMode(2, board.MODES.OUTPUT); // direction of DC motor
board.pinMode(3, board.MODES.PWM); // PWM of motor i.e. speed of rotation
board.pinMode(4, board.MODES.OUTPUT); // direction DC motor
});

function handler(req, res) {
    fs.readFile(__dirname + "/example15.html",
    function (err, data) {
        if (err) {
            res.writeHead(500, {"Content-Type": "text/plain"});
            return res.end("Error loading html page.");
        }
    res.writeHead(200);
    res.end(data);
    })
}

var desiredValue = 0; // desired value var
var actualValue = 0; // variable for actual value (output value)
var factor = 0.1;
var pwm=0;
http.listen(8080); // server will listen on port 8080

board.on("ready", function() {
    
    board.analogRead(0, function(value){
        desiredValue = value; // continuous read of analog pin 0
    });
    board.analogRead(1, function(value) {
        actualValue = value; // continuous read of pin A1
    });
    
    io.sockets.on("connection", function(socket) {
        socket.emit("messageToClient", "Server connected, board ready.");
        setInterval(sendValues, 40, socket); // na 40ms we send message to client
        socket.on("startControlAlgorithm", function(){
            startControlAlgorithm();
        });
    
        socket.on("stopControlAlgorithm", function(){
            stopControlAlgorithm();
});
    }); // end of sockets.on connection

}); // end board.digitalRead on pin 2




/*function controlAlgorithm () {
     pwm = factor*(desiredValue-actualValue);
    if(pwm > 255) {pwm = 255}; // to limit the value for pwm / positive
    if(pwm < -255) {pwm = -255}; // to limit the value for pwm / negative
    if (pwm > 0) {board.digitalWrite(2,1); board.digitalWrite(4,0);}; // določimo smer če je > 0
    if (pwm < 0) {board.digitalWrite(2,0); board.digitalWrite(4,1);}; // določimo smer če je < 0
    board.analogWrite(3, Math.abs(pwm));
};*/
function controlAlgorithm () {
  err = desiredValue - actualValue; // error
  errSum += err; // sum of errors, like integral
  dErr = err - lastErr; // difference of error
  pwm = Kp*err + Ki*errSum + Kd*dErr;
  lastErr = err; // save the value for the next cycle
  if(pwm > pwmLimit) {pwm = pwmLimit}; // to limit the value for pwm / positive
  if(pwm < -pwmLimit) {pwm = -pwmLimit}; // to limit the value for pwm / negative
  if (pwm > 0) {board.digitalWrite(2,1); board.digitalWrite(4,0);}; // določimo smer če je > 0
  if (pwm < 0) {board.digitalWrite(2,0); board.digitalWrite(4,1);}; // določimo smer če je < 0
  board.analogWrite(3, Math.abs(pwm));
};
 function startControlAlgorithm () {
    if (controlAlgorihtmStartedFlag == 0) {
        controlAlgorihtmStartedFlag = 1; // set flag that the algorithm has started
        intervalCtrl = setInterval(function() {controlAlgorithm(); }, 80); // na 30ms klic
        console.log("Control algorithm started");
    }
};
function stopControlAlgorithm () {
    clearInterval(intervalCtrl); // clear the interval of control algorihtm
    board.analogWrite(3,0); // write 0 on pwm pin to stop the motor
    controlAlgorihtmStartedFlag = 0; // set flag that the algorithm has stopped
};
function sendValues (socket) {
    socket.emit("clientReadValues",
    { // json notation between curly braces
    "desiredValue": desiredValue,
    "actualValue": actualValue,
    "pwm": pwm
    });
    console.log(desiredValue);
};
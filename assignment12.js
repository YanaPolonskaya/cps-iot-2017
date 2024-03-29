var http = require("http").createServer(handler); // on req - hand
var io = require("socket.io").listen(http); // socket library
var fs = require("fs"); // variable for file system for providing html
var firmata = require("firmata");
var sendValueViaSocket = function() {}; // function to send message over socket
var sendStaticMsgViaSocket = function() {}; // function to send static message over socket

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
var KpE = 0; // multiplication of Kp x error
var KiIedt = 0; // multiplication of Ki x integral of error
var KdDe_dt = 0; // multiplication of Kd x differential of error i.e.e Derror/dt
var errSumAbs = 0; // sum of absolute errors as performance measure
var controlAlgorithmStartedFlag = 0; // variable for indicating weather the Alg has benn sta.
var intervalCtrl; // var for setInterval in global scope
var intervalPulseFunction; // for setTimeout / setInterval
var performanceMeasure = 0;
var readAnalogPin0Flag = 1; // flag for reading the pin if the pot is driver
console.log("Starting the code");

var board = new firmata.Board("/dev/ttyACM0", function(){
    console.log("Connecting to Arduino");
    
    board.pinMode(0, board.MODES.ANALOG); // analog pin 0
    
board.pinMode(1, board.MODES.ANALOG); // analog pin 1
board.pinMode(2, board.MODES.OUTPUT); // direction of DC motor
board.pinMode(3, board.MODES.PWM); // PWM of motor i.e. speed of rotation
board.pinMode(4, board.MODES.OUTPUT); // direction DC motor
board.pinMode(8, board.MODES.OUTPUT);
//???????????????
console.log("Enabling Push Button on pin 2");
board.pinMode(13, board.MODES.INPUT);

board.analogWrite(3, Math.round(Math.abs(pwm)));

});

function handler(req, res) {
    fs.readFile(__dirname + "/assignment12.html",
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
       if (readAnalogPin0Flag == 1) desiredValue = value; // continuous read of analog pin 0
    });
    board.analogRead(1, function(value) {
        actualValue = value; // continuous read of pin A1
    });
    
    board.digitalRead(13, function(value) {
        if (value == 1) {
          
          stopControlAlgorithm();
          
            
        }
       
        
    });
    
    io.sockets.on("connection", function(socket) {
        
        socket.emit("messageToClient", "Server connected, board ready.");
        socket.emit("staticMsgToClient", "Server connected, board ready.")
        
        setInterval(sendValues, 40, socket); // na 40ms we send message to client
        
        
        socket.on("startControlAlgorithm", function(numberOfControlAlgorithm){
            startControlAlgorithm(numberOfControlAlgorithm);
        });
    
        socket.on("sendPosition", function(position) {
            readAnalogPin0Flag = 0; // we don't read from the analog pin anymore, value comes from GUI
            desiredValue = position; // GUI takes control
            socket.emit("messageToClient", "Position set to: " + position)
        });
    
    
        socket.on("stopControlAlgorithm", function(){
            stopControlAlgorithm();
        });

        sendValueViaSocket = function (value) {
        io.sockets.emit("messageToClient", value);
        }
    
        sendStaticMsgViaSocket = function (value) {
        io.sockets.emit("staticMsgToClient", value);
        }

socket.on("plus", function(){
            pwm=pwm+5;
        });

socket.on("minus", function(){
            pwm=pwm-5;
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
function controlAlgorithm (parameters) {
    if (parameters.ctrlAlgNo == 1) {
        pwm = parameters.pCoeff*(desiredValue-actualValue);
        err = desiredValue-actualValue;
        errSumAbs += Math.abs(err);
        if(pwm > pwmLimit) {pwm = pwmLimit}; // to limit the value for pwm / positive
        if(pwm < -pwmLimit) {pwm = -pwmLimit}; // to limit the value for pwm / negative
        if (pwm > 0) {board.digitalWrite(2,1); board.digitalWrite(4,0);}; // določimo smer če je > 0
        if (pwm < 0) {board.digitalWrite(2,0); board.digitalWrite(4,1);}; // določimo smer če je < 0
        board.analogWrite(3, Math.abs(pwm));
        console.log(Math.round(pwm));
    }
    if (parameters.ctrlAlgNo == 2) {
        err = desiredValue - actualValue; // error
        errSum += err; // sum of errors, like integral
        errSumAbs += Math.abs(err);
        dErr = err - lastErr; // difference of error
        KpE=parameters.Kp1*err;
        KiIedt=parameters.Ki1*errSum;
        KdDe_dt=parameters.Kd1*dErr;
        pwm = KpE + KiIedt + KdDe_dt; // ab
        lastErr = err; // save the value for the next cycle
        if(pwm > pwmLimit) {pwm = pwmLimit}; // to limit the value for pwm / positive
        if(pwm < -pwmLimit) {pwm = -pwmLimit}; // to limit the value for pwm / negative
        if (pwm > 0) {board.digitalWrite(2,1); board.digitalWrite(4,0);}; // določimo smer če je > 0
        if (pwm < 0) {board.digitalWrite(2,0); board.digitalWrite(4,1);}; // določimo smer če je < 0
        board.analogWrite(3, Math.abs(pwm));        
  }
  
   if (parameters.ctrlAlgNo == 3) {
	          err = desiredValue - actualValue; // error as difference between desired and actual val.
          errSum += err; // sum of errors | like integral
          errSumAbs += Math.abs(err);
          dErr = err - lastErr; // difference of error
       pwm = parameters.Kp2*err+parameters.Ki2*errSum+parameters.Kd2*dErr; // PID expression
        // we will put parts of expression for pwm to
       // global workspace
         KpE = parameters.Kp2*err;
       KiIedt = parameters.Ki2*errSum;
         KdDe_dt = parameters.Kd2*dErr;
         pwm = KpE + KiIedt + KdDe_dt; // we use above parts
          console.log(parameters.Kp2 + "|" + parameters.Ki2 + "|" + parameters.Kd2);
          lastErr = err; // save the value of error for next cycle to estimate the derivative
          if (pwm > pwmLimit) {pwm =  pwmLimit}; // to limit pwm values
          if (pwm < -pwmLimit) {pwm = -pwmLimit}; // to limit pwm values
          if (pwm > 0) {board.digitalWrite(2,1); board.digitalWrite(4,0);}; // direction if > 0
          if (pwm < 0) {board.digitalWrite(2,0); board.digitalWrite(4,1);}; // direction if < 0
          board.analogWrite(3, Math.abs(pwm));        
	      }
  
  
  
};


function sendValues (socket) {
    socket.emit("clientReadValues",
    { // json notation between curly braces
    "desiredValue": desiredValue,
    "actualValue": actualValue,
    "pwm": pwm,
    "err": err,
    "errSum": errSum,
    "dErr": dErr,
    "KpE": KpE,
    "KiIedt": KiIedt,
    "KdDe_dt": KdDe_dt,
   "errSumAbs": errSumAbs
    });
    
};

 function startControlAlgorithm (parameters) {
    if (controlAlgorihtmStartedFlag == 0) {
	    controlAlgorihtmStartedFlag = 1; // set flag that the algorithm has started
        
        intervalCtrl = setInterval(function() {controlAlgorithm(parameters); }, 30); // na 30ms klic
        console.log("Control algorithm " + parameters.ctrlAlgNo + " started");
        sendStaticMsgViaSocket("Control algorithm " + parameters.ctrlAlgNo + " started | " + json2txt(parameters));
        board.digitalWrite(8, board.HIGH); // write LOW on pin 13 
     }
  };
  
function stopControlAlgorithm () {
    clearInterval(intervalCtrl); // clear the interval of control algorihtm
    board.analogWrite(3,0); // write 0 on pwm pin to stop the motor
    controlAlgorihtmStartedFlag = 0; // set flag that the algorithm has stopped
    pwm = 0; // set pwm to 0
    errSumAbs = 0;
    
    controlAlgorithmStartedFlag = 0;
    console.log("ctrlAlg STOPPED");
    sendStaticMsgViaSocket("Stop");
    board.digitalWrite(8, board.LOW); // write LOW on pin 13 
};

function json2txt(obj) // function to print out the json names and values
{
  var txt = '';
  var recurse = function(_obj) {
    if ('object' != typeof(_obj)) {
      txt += ' = ' + _obj + '\n';
    }
    else {
      for (var key in _obj) {
        if (_obj.hasOwnProperty(key)) {
          txt += '.' + key;
          recurse(_obj[key]);
        } 
      }
    }
  };
  recurse(obj);
  return txt;
}


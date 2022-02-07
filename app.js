const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const ping = require('net-ping');
const config = require('./config.json');
const { exec } = require('child_process');
const fs = require('fs');


if (config.hosts == undefined) {
    config.hosts = [];
}
if (config.graphs == undefined) {
    config.graphs = [];
}
if (isNaN(config.pingInterval)) {
    config.pingInterval = 5000;
}

const upStates = new Array(config.hosts.length);

const pingOpts = {
    retries: 1,
    timeout: 2000
};
const session = ping.createSession (pingOpts);

const logOpts = {
    timestampFormat: 'YYYY-MM-DD HH:mm:ss',
    logDirectory: __dirname + '/logs',
    fileNamePattern:'ping-<DATE>.log',
    dateFormat:'YYYY-MM'
};
const log = require('simple-node-logger').createRollingFileLogger( logOpts );
log.warn('Server restarted');

app.set('view engine', 'ejs');
app.use(express.static('public'));


function padTo2Digits(num) {
  return num.toString().padStart(2, '0');
}


function loadLogs() {
    const date = new Date();
    
    var logsLastMonth = [];
    var logsThisMonth = [];
    var thisMonth = date.getFullYear()+'-'+padTo2Digits(date.getMonth() + 1);
    var lastMonth = date.getFullYear()+'-'+padTo2Digits(date.getMonth());
    if(date.getMonth() == 0){
        lastMonth = date.getFullYear()-1+'-12';
    } 
    
    try {
        logsLastMonth = fs.readFileSync(__dirname + '/logs/ping-'+lastMonth+'.log').toString().split("\n");
        logsLastMonth.splice(-1);
        logsLastMonth.reverse();
        } catch (err) {
    }

    try {
        logsThisMonth = fs.readFileSync(__dirname + '/logs/ping-'+thisMonth+'.log').toString().split("\n");
        logsThisMonth.splice(-1);
        logsThisMonth.reverse();
        } catch (err) {
    }
    
    const logs = logsThisMonth.concat(logsLastMonth);
    
    return logs;
}


function getTimestamp() {
    const date = new Date();
    return (
        [
            date.getFullYear(),
            padTo2Digits(date.getMonth() + 1),
            padTo2Digits(date.getDate()),
        ].join('-') +
        ' ' +
        [
            padTo2Digits(date.getHours()),
            padTo2Digits(date.getMinutes()),
            padTo2Digits(date.getSeconds()),
        ].join(':')
    );
}


function stateChange(state, index, target, info) {
    if( upStates[index] !== undefined) {
        if (upStates[index] != state) {
            upStates[index] = state;
            log.info(target+' '+info);
            io.emit('message', getTimestamp() + ' INFO  ' + target+' '+info);
        }
    } else {
        upStates[index] = state;
    }
}


io.on('connection', (socket) => {
    socket.emit('downstreamConfig', config);
    
    socket.on('upstreamConfig', (newConfig) => {
        fs.writeFile(__dirname + '/config.json', newConfig, err => {
            if (err) {
                console.log('Error writing new config file:', err);
            } else {exec('pm2 restart projectPing', (err, stdout, stderr) => {
                  if (err) {
                    console.error(err);
                  }
                });
            }
          });
    });
});


setInterval(function(){
    for (var i = 0; i < config.hosts.length; i++) {
        session.pingHost (config.hosts[i].targetAddress, function (error, target, sent, rcvd) {
        
            const index = config.hosts.findIndex(x => x.targetAddress === target);
            const ms = rcvd - sent;
            
            if (error) {
                if (error instanceof ping.RequestTimedOutError) {
                    io.emit('ping', index, false, 'timeout');
                    stateChange(false, index, config.hosts[index].targetName, 'is disconnected' );
                } else {
                    io.emit('ping', index, false, 'error');
                    stateChange(false, index, config.hosts[index].targetName, '(error)') ;
                }
            } else {
                io.emit('ping', index, true, ms+'ms');
                stateChange(true, index, config.hosts[index].targetName, 'is now UP (' + ms + 'ms)');
            }
        });
    }
},config.pingInterval);


app.get('/', function(req, res){ 
        res.render(__dirname + '/index', {
            config: config,
            logs: loadLogs()
          });
    });

    
http.listen(80, function(){
   console.log('App listening on port 80');
});


var socket = io();

var hostsElement = document.getElementById('hosts');
var messagesElement = document.getElementById('messages');
var graphsElement = document.getElementById('graphs');

var serverConfig = {};
var firstConnect = true;

var configModalEl = document.getElementById('configModal');
var configButtonEl = document.getElementById('saveConfig');
var resetSpeedButtonEl = document.getElementById('newSpeedTest');
var configExButtonEl = document.getElementById('exampleConfig');
var connectionModal = new bootstrap.Modal(document.getElementById('connectionModal'));
var configModal = new bootstrap.Modal(document.getElementById('configModal'));
var alertPlaceholder = document.getElementById('configAlertPlaceholder');






function validateJson(json) {
    try {
        JSON.parse(json);
        return true;
    } catch {
        return false;
    }
}


function setStateUp(index, time) {
    var div = document.getElementById('host_'+index);
    div.children[0].className = 'oi oi-circle-check i-host i-host-up';
    div.children[2].textContent = ' ('+time+')';
}

function setStateDown(index, time) {
    var div = document.getElementById('host_'+index);
    div.children[0].className = 'oi oi-circle-x i-host i-host-down';
    div.children[2].textContent = ' ('+time+')';
}


function setLostConnection() {
    var hosts = document.getElementsByName('hosts');
    hosts.forEach(function(div) { 
        div.children[0].className = 'oi oi-loop-circular i-host';
        div.children[2].textContent = '';
    });
}


function writeMessage(msg) {
    var tr = document.createElement('tr');
    var td = document.createElement('td');
    td.textContent = msg;
    tr.appendChild(td);
    messagesElement.prepend(tr);

    if (messagesElement.childElementCount > 600) {
        messagesElement.removeChild(messages.lastElementChild);
    }
}


configModalEl.addEventListener('show.bs.modal', function (event) {
    var pretty = JSON.stringify(serverConfig, undefined, 2);
    document.getElementById('configTextarea').value = pretty;
});


configModalEl.addEventListener('hide.bs.modal', function (event) {
    alertPlaceholder.innerHTML = '';
});


configExButtonEl.addEventListener('click', function (event) {
    var exampleConfigJSON = {
        "hosts": [
            {
                "targetName": "Offline",
                "targetAddress": "8.8.8.8"
            }
        ],
        "pingInterval": 5000,
        "libreNMSURL": "http://10.200.202.26",
        "libreNMSUsername": "username",
        "libreNMSPassword": "password",
        "sonicwallDeviceID": "2",
        "graphs": [
            {
                "graphName": "DO Laptop",
                "graphID": "12"
            }
        ]
    };
    var prettyJSON = JSON.stringify(exampleConfigJSON, undefined, 2);
    document.getElementById('configTextarea').value = prettyJSON;
});


configButtonEl.addEventListener('click', function (event) {
    var newConfig = document.getElementById('configTextarea').value;
    if(validateJson(newConfig)) {
        socket.emit('upstreamConfig', newConfig);
        configModal.hide();
    } else {
        var wrapper = document.createElement('div');
        var errorMessage = 'Error with config file. Check if file is in JSON format.';
        wrapper.innerHTML = '<div class="alert alert-danger alert-dismissible" role="alert">'+errorMessage+'<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>';
        alertPlaceholder.append(wrapper);
    }
});

resetSpeedButtonEl.addEventListener('click', function (event) {
    var speedTestFrame = document.getElementById('speedTestFrame');
    
speedTestFrame.innerHTML = '<div style="min-height:360px;"><div style="width:100%;height:0;padding-bottom:50%;position:relative;"><iframe style="border:none;position:absolute;top:0;left:0;width:100%;height:100%;min-height:360px;border:none;overflow:hidden !important;" src="//openspeedtest.com/Get-widget.php"></iframe></div></div>';

        
    
});



socket.on('connect', function() {
    connectionModal.hide();
    if (firstConnect) {
        firstConnect = false;
    } else {
        //socket.emit('serverReconnect');
        window.location.reload();
    }
});


socket.on('downstreamConfig', function(config) {
    serverConfig = config;
});


socket.on('connect_error', function() {
    connectionModal.show();
    setLostConnection();
});


socket.on('message', function(msg) {
    writeMessage(msg);
});


socket.on('ping', function(index, upState, time) {
    if (upState) {
        setStateUp(index, time);
    } else {
        setStateDown(index, time);
    }
});


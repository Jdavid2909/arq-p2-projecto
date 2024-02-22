//var wsbroker = "192.168.0.3";  //mqtt websocket enabled broker
//var wsbroker = "localhost";
var wsbroker = "broker.hivemq.com";

//var wsport = 8083 // port for above
var wsport = 1883; // port for above

var client = new Paho.MQTT.Client(
	wsbroker,
	Number(8000),
	"myclientid_" + parseInt(Math.random() * 100, 10)
);

client.onConnectionLost = function (responseObject) {
	console.log("connection lost: " + responseObject.errorMessage);
};

/*################################################################################################*/
/*####################################### LLEGA EL MENSAJE########################################*/
/*################################################################################################
let dataCache =  esto lo almaceno en un etiqueta laben, o como mdoificar un equiqueta input con js y el uso del api
*/


client.onMessageArrived = function (message) {
	let destination = message.destinationName;


	let dataFormat = JSON.parse(message.payloadString);
	document.getElementById('cpuValue').textContent = dataFormat.CPU + ' %';
	document.getElementById('almcValue').textContent = dataFormat.Alc.toLocaleString() + ' %';
	document.getElementById('cacheValue').textContent = dataFormat.Cache.toLocaleString() + ' %';
	document.getElementById('tptValue').textContent = dataFormat.Tpt + ' GB';

	console.log(destination);
	
}

function actualizarElementosHtml(dataFormat) {
	document.getElementById('cpuValue').textContent = dataFormat.CPU + ' %';
	document.getElementById('almcValue').textContent = dataFormat.Alc.toLocaleString() + ' %';
	document.getElementById('cacheValue').textContent = dataFormat.Cache.toLocaleString() + ' %';
	document.getElementById('tptValue').textContent = dataFormat.Tpt + ' GB';
	// etc.
  }
  
  client.onMessageArrived = function (message) {
	let dataFormat = JSON.parse(message.payloadString);
  
	// actualizar elementos HTML
	actualizarElementosHtml(dataFormat);
  }


var options = {
	timeout: 3,
	onSuccess: function () {
		console.log("mqtt connected");
		// Connection succeeded; subscribe to our topic, you can add multile lines of these
		client.subscribe("grupo4", { qos: 2 });
	},
	onFailure: function (message) {
		console.log("Connection failed: " + message.errorMessage);
	},
};


function testMqtt(){
	console.log("hi");
}
function initMqtt() {
	client.connect(options);
}
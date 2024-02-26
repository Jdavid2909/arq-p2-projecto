/*################################################################################################*/
/*####################################### CLIENTE MQTT ###########################################*/
/*################################################################################################*/

//var wsbroker = "192.168.0.3";  //mqtt websocket enabled broker
var wsbroker = "broker.hivemq.com";
//var wsbroker = "localhost";
//var wsbroker = "0.tcp.sa.ngrok.io";
var chart_bars;
var data;

var wsport = 1883; // port for above
//var wsport = 8083 // port for above
//var wsport = 14792; // port for above
var client = new Paho.MQTT.Client(
	wsbroker,
	//Number(wsport)
	Number(8000),
	"myclientid_" + parseInt(Math.random() * 100, 10)
);


client.onConnectionLost = function (responseObject) {
	console.log("connection lost: " + responseObject.errorMessage);

	// Llamar a la función updateHtmlElements cada segundo
	intervalId = setInterval(() => updateHtmlElements("1", dataFormat), 1000);
}



/*################################################################################################*/
/*####################################### LLEGA EL MENSAJE########################################*/
/*################################################################################################*/
let chart;
let dataFormat;
let primero = 1;
let computerElement;
let computerName;
client.onMessageArrived = function (message) {

	let chart_bars;
	let data;
	// Check if data is a number before using toFixed()
	if (typeof data === 'number') {
		data = data.toFixed(2);
	} else {
		console.warn('No se puede convertir el valor en un número de punto fijo');
		console.log(data); // Imprime la variable data en la consola
	}

	let destination = message.destinationName;
	if (destination === "grupo4") {
		dataFormat = JSON.parse(message.payloadString);
		console.log(dataFormat); // Log the dataFormat object to the console

		updateHtmlElements("1", dataFormat);
		updateHtmlElements("2", dataFormat);
		updateHtmlElements("3", dataFormat);
		updateHtmlElements("4", dataFormat);

		//Cargar datos CPU , Memoria y Almacenamiento

		addData(chart, dataFormat.CPU);
		addMemory(chart, dataFormat.Memory);
		addDisco(chart, dataFormat.Disco);

	}

};

function enviarMensajeMQTT(mensajeJSON) {
	let messageObj = new Paho.MQTT.Message(mensajeJSON);
	messageObj.destinationName = "grupo4"; // Cambia al topic correcto
	client.send(messageObj);
}

var options = {
	timeout: 3,
	onSuccess: function () {
		console.log("mqtt connected");
		// Connection succeeded; subscribe to our topic, you can add multile lines of these
		client.subscribe("grupo4", {
			qos: 1
		});
	},
	onFailure: function (message) {
		console.log("Connection failed: " + message.errorMessage);
	},
};


function testMqtt() {
	console.log("hi");
}

function initMqtt() {
	client.connect(options);
}

function updateHtmlElements(computerName, data) {
	const computerContainer = document.getElementById(`computer-row-${computerName}`);

	const dataCPUElement = document.getElementById("dataCPUElement");
	dataCPUElement.textContent = data.CPU.toFixed(2) + "%";

	const dataMemoryElement = document.getElementById("dataMemoryElement");
	dataMemoryElement.textContent = data.Memory.toFixed(2) + "%";

	const dataDiscoElement = document.getElementById("dataDiscoElement");
	dataDiscoElement.textContent = data.Disco + " GB";

	const dataTemperatura = document.getElementById("dataTemperatura");
	dataTemperatura.textContent = "Temperatura: " + data.Temperatura + " °C";

	computerElement.appendChild(dataCPUElement);
	computerElement.appendChild(dataMemoryElement);
	computerElement.appendChild(dataDiscoElement);

	if (computerContainer.firstChild) {
		computerContainer.insertBefore(computerElement, computerContainer.firstChild);
	} else {
		computerContainer.appendChild(computerElement);
	}

}

function addData(chart, data) {
	if (chart && chart.data && chart.data.datasets && Array.isArray(chart.data.datasets)) {
		chart.data.datasets[0].data.push(data);
		chart.update();
	} else {
		console.error("Error: El objeto chart no está definido correctamente.");
	}
}

function addMemory(chart, data) {
	if (chart && chart.data && chart.data.datasets && Array.isArray(chart.data.datasets)) {
		chart.data.datasets[0].data.push(data);
		chart.update();
	} else {
		console.error("Error: El objeto chart no está definido correctamente.");
	}
}

function addDisco(chart, data) {
	if (chart && chart.data && chart.data.datasets && Array.isArray(chart.data.datasets)) {
		chart.data.datasets[0].data.push(data);
		chart.update();
	} else {
		console.error("Error: El objeto chart no está definido correctamente.");
	}
}

// Función para obtener la información de las otras tres computadoras
function getComputerData() {
	// Array de direcciones IP de las otras tres computadoras
	const otherComputers = ['192.168.0.1', '192.168.1.2', '192.168.0.1', '192.168.0.1'];

	// Recorrer cada computadora y hacer la petición
	otherComputers.forEach(computerIP => {
		// Realizar la petición HTTP a la API de la computadora
		fetch(`http://${computerIP}/api/computer-info`)
			.then(response => response.json())
			.then(computerData => {
				// Procesar la información de la computadora
				console.log(`Información de la computadora en ${computerIP}:`);
				console.log(computerData);

				// Enviar la información al broker MQTT
				const mqttMessage = JSON.stringify({
					computerIP,
					cpu: computerData.cpu,
					memory: computerData.memory,
					disk: computerData.disk,
					temperature: computerData.temperature
				});
				enviarMensajeMQTT(mqttMessage);

				// Actualizar los elementos HTML con la información de la computadora
				updateHtmlElements(computerData);
			})
			.catch(error => {
				console.error(`Error al obtener la información de la computadora en ${computerIP}:`, error);
			});
	});
}

// Llamar a la función para obtener la información de las otras tres computadoras
getComputerData();
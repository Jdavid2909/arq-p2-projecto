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
/*################################################################################################*/
/*####################################### LLEGA EL MENSAJE########################################*/
/*################################################################################################*/
let chart;
let dataFormat;
let primero = 1;
let intervalId;

client.onMessageArrived = function (message) {
	let destination = message.destinationName;
	if (destination === "grupo4") {
		try {
			dataFormat = JSON.parse(message.payloadString);
			console.log(dataFormat); // Log the dataFormat object to the console

			updateHtmlElements("1", dataFormat);
			updateHtmlElements("2", dataFormat);
			updateHtmlElements("3", dataFormat);
			updateHtmlElements("4", dataFormat);

			//Cargar datos CPU, Memoria y Almacenamiento
			addData(chart, dataFormat.CPU);
			addMemory(chart, dataFormat.Memory);
			addDisco(chart, dataFormat.Disco);

			updateChart(dataFormat.frecuenciaRAM);
		} catch (error) {
			console.error('Error al procesar los datos recibidos:', error);
		}
	}
};

function enviarMensajeMQTT(mensajeJSON) {
	let messageObj = new Paho.MQTT.Message(mensajeJSON);
	messageObj.destinationName = "grupo4"; // Cambia al topic correcto
	client.send(messageObj);
}

client.onConnected = function (responseObject) {
	console.log("Connected");

	drawRAMFrequencyChart();

	if (intervalId) {
		clearInterval(intervalId);
	}
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
	client.connect({
		onSuccess: function () {
			console.log("mqtt connected");
			client.subscribe("grupo4", {
				qos: 1
			});
		},
		onFailure: function (message) {
			console.log("Connection failed: " + message.errorMessage);
		},
	});
}

function updateHtmlElements(apiEndpoint, computerData) {

	const computerContainer = document.getElementById(`computer-row-${apiEndpoint}`);

	if (computerData && computerData.cpu !== undefined) {

		const dataCPUElement = document.createElement("dataCPUElement");
		dataCPUElement.textContent = `CPU: ${computerData.cpu.toFixed(2)}%`;

		const dataMemoryElement = document.createElement("dataMemoryElement");
		dataMemoryElement.textContent = `Memory: ${computerData.memory.toFixed(2)}%`;

		const dataDiscoElement = document.createElement("dataDiscoElement");
		dataDiscoElement.textContent = `Disk: ${computerData.disk} GB`;

		const dataTemperatura = document.createElement("dataTemperatura");
		dataTemperatura.textContent = `Temperature: ${computerData.temperature} °C`;

		computerContainer.innerHTML = ''; // Limpiar el contenido previo

		computerContainer.appendChild(dataCPUElement);
		computerContainer.appendChild(dataMemoryElement);
		computerContainer.appendChild(dataDiscoElement);
		computerContainer.appendChild(dataTemperatura);
	} else {
		console.error('Error: No se pueden actualizar los elementos HTML porque los datos de la computadora son indefinidos o no contienen la propiedad cpu.');
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

function drawRAMFrequencyChart() {
	// Obtener el elemento canvas donde se dibujará el gráfico
	var ctx = document.getElementById('chart_line').getContext('2d');

	// Crear un nuevo gráfico de línea
	var myChart = new Chart(ctx, {
		type: 'line',
		data: {
			// Etiquetas para el eje X (tiempo)
			labels: ['Tiempo 1', 'Tiempo 2', 'Tiempo 3', 'Tiempo 4', 'Tiempo 5'],
			datasets: [{
				// Nombre de la serie
				label: 'Frecuencia de RAM',
				// Datos de la frecuencia de RAM (aquí debes proporcionar tus propios datos)
				data: [80, 70, 85, 90, 75],
				// Color de la línea del gráfico
				borderColor: 'blue',
				// Ancho de la línea del gráfico
				borderWidth: 1
			}]
		},
		options: {
			scales: {
				y: {
					// Configuración del eje Y (frecuencia de RAM)
					beginAtZero: true
				}
			}
		}
	});
}
// Función para inicializar el gráfico
function initChart() {
	var ctx = document.getElementById('chart_line').getContext('2d');
	chart = new Chart(ctx, {
		type: 'line',
		data: {
			// Etiquetas para el eje X (tiempo)
			labels: [],
			datasets: [{
				// Nombre de la serie
				label: 'Frecuencia de RAM',
				// Datos de la frecuencia de RAM inicialmente vacíos
				data: [],
				// Color de la línea del gráfico
				borderColor: 'blue',
				// Ancho de la línea del gráfico
				borderWidth: 1
			}]
		},
		options: {
			scales: {
				y: {
					// Configuración del eje Y (frecuencia de RAM)
					beginAtZero: true
				}
			}
		}
	});
}

// Función para actualizar el gráfico con los nuevos datos
function updateChart(data) {
	if (chart && chart.data && chart.data.datasets && Array.isArray(chart.data.datasets)) {
		// Agregar una nueva etiqueta de tiempo al eje X
		const timeLabel = new Date().toLocaleTimeString();
		chart.data.labels.push(timeLabel);

		// Agregar el nuevo dato de la frecuencia de RAM al conjunto de datos
		chart.data.datasets[0].data.push(data);

		// Limitar la cantidad de etiquetas en el eje X para mantener solo las últimas 5
		if (chart.data.labels.length > 5) {
			chart.data.labels.shift(); // Eliminar la primera etiqueta
			chart.data.datasets[0].data.shift(); // Eliminar el primer dato
		}

		// Actualizar el gráfico
		chart.update();
	} else {
		console.error("Error: El objeto chart no está definido correctamente.");
	}
}

// Llamar a initChart una vez que la página esté lista para inicializar el gráfico
document.addEventListener('DOMContentLoaded', function () {
	initChart();
});

// Función para obtener y enviar los datos de las computadoras a través del API
async function getAndSendDataFromAPIs(computerAPIs) {
	for (const apiEndpoint of computerAPIs) {
		try {
			async function obtenerDatosCPU(apiEndpoint) {
				try {
					const response = await fetch(apiEndpoint + '/cpu');
					if (!response.ok) {
						throw new Error('Error al obtener datos de CPU: ' + response.statusText);
					}
					const data = await response.json();
					return data;
				} catch (error) {
					throw new Error('Error al obtener datos de CPU: ' + error.message);
				}
			}

			async function obtenerDatosMemoria(apiEndpoint) {
				try {
					const response = await fetch(apiEndpoint + '/memoria');
					if (!response.ok) {
						throw new Error('Error al obtener datos de memoria: ' + response.statusText);
					}
					const data = await response.json();
					return data;
				} catch (error) {
					throw new Error('Error al obtener datos de memoria: ' + error.message);
				}
			}

			async function obtenerDatosDisco(apiEndpoint) {
				try {
					const response = await fetch(apiEndpoint + '/disco');
					if (!response.ok) {
						throw new Error('Error al obtener datos de disco: ' + response.statusText);
					}
					const data = await response.json();
					return data;
				} catch (error) {
					throw new Error('Error al obtener datos de disco: ' + error.message);
				}
			}


			const dataCPUElement = await obtenerDatosCPU(apiEndpoint);
			const dataMemoryElement = await obtenerDatosMemoria(apiEndpoint);
			const dataDiscoElement = await obtenerDatosDisco(apiEndpoint);

			// Actualizar elementos HTML con los datos obtenidos
			updateHtmlElements(apiEndpoint, {
				cpu: dataCPUElement,
				memory: dataMemoryElement,
				disk: dataDiscoElement
			});

			// Luego puedes enviar mensajes MQTT u otras acciones necesarias

		} catch (error) {
			console.error(`Error al obtener datos de ${apiEndpoint}:`, error);
		}
	}
}

// Llamar a la función para obtener y enviar los datos de las computadoras a través del API cada segundos
setInterval(() => getAndSendDataFromAPIs(['http://localhost:3000']), 1000);
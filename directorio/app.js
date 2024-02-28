const express = require('express');
const cors = require('cors');
const os = require('os');
const osUtils = require('os-utils');

const app = express();
const PORT = 3000;

// Habilitar CORS para todas las solicitudes
app.use(cors());

// Función para obtener el uso de la CPU
function obtenerDatosCPU() {
  return new Promise((resolve, reject) => {
    osUtils.cpuUsage((dataCPUElement) => {
      resolve(dataCPUElement * 100); // Multiplicamos por 100 para obtener el porcentaje
    });
  });
}

// Función para obtener el uso de la memoria
function obtenerDatosMemoria() {
  const memoriaTotal = os.totalmem();
  const memoriaLibre = os.freemem();
  const memoriaEnUso = memoriaTotal - memoriaLibre;
  const porcentajeUso = (memoriaEnUso / memoriaTotal) * 100;
  return porcentajeUso;
}

// Función para obtener el uso del disco
function obtenerDatosDisco() {
  const discoTotal = os.totalmem();
  const discoLibre = os.freemem();
  const discoEnUso = discoTotal - discoLibre;
  const porcentajeUso = (discoEnUso / discoTotal) * 100;
  return porcentajeUso;
}

// Rutas de tu API
app.get('/cpu','/memoria', 'disco', async (req, res) => {
  try {
    const dataCPUElement = await obtenerDatosCPU();
    const dataMemoryElement = obtenerDatosMemoria();
    const dataDiscoElement = obtenerDatosDisco();
    const data = {
      CPU: dataCPUElement,
      Memory: dataMemoryElement,
      Disco: dataDiscoElement
    };
    res.json(data);
  } catch (error) {
    console.error('Error al obtener datos de CPU:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor de API escuchando en el puerto ${PORT}`);
});
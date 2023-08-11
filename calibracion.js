//***************************************************************************** */
//****      D E C L A R  A C I O N   D E  V A R I A B L  E S               **** */
//***************************************************************************** */
const datosSensor = require('./sensorData'); //importo la variable de datos del sensor que usaré para rectificarlos

//VARIABLES GAIN Y TINT (CONTROLADAS POR LOS SELECTORES WEB)
let tint = 182;
let gain = 512;

//VARIABLES DE CORRECCION DEL BASIC_COUNT
const { offsetCompensation, factorSensor } = require('./constants'); //importo las constantes para la corrección del basic count

//*--------------------------------
//* comprobación de datos válidos :
//*--------------------------------

// Función para verificar si un valor es un número válido
function isNumber(value) {
    return typeof value === 'number' && !isNaN(value);
}

// Comprobar que los datos del sensor se han importado correctamente
if (Array.isArray(datosSensor) && datosSensor.length > 0) {
    console.log('Datos del sensor importados correctamente')
    console.log('datosSensor: ', datosSensor[0].F1);
} else {
    console.error('!!! Error al importar los datos del sensor...')
}

// Comprobar los valores en offsetCompensation
for (const key in offsetCompensation) {
    if (offsetCompensation.hasOwnProperty(key)) {
        if (!isNumber(offsetCompensation[key])) {
            console.error(`Valor no válido en offsetCompensation[${key}]`);
        }
    }
}

// Comprobar los valores en factorSensor
for (const key in factorSensor) {
    if (factorSensor.hasOwnProperty(key)) {
        if (!isNumber(factorSensor[key])) {
            console.error(`Valor no válido en factorSensor[${key}]`);
        }
    }
}
//***************************************************************************** */
//*                          F U N C I O N E S                                  */
//***************************************************************************** */

//****** FUNCION PARA CALCULAR LOS BASIC COUNTS DE CADA LONGITUD DE ONDA ****** */
function calcularBasicCounts(datosSensor, tint, gain) {

    const basic_counts = [];
    for (const dato of datosSensor) {
        // verificar si 'tint' y 'gain' son números válidos y no cero
        if (typeof tint !== 'number' || typeof gain !== 'number' || tint === 0 || gain === 0) {
            console.log('valores de tint o gain no son válidos');
            return []; //retprna un array vacío en caso de error
        }

        // verificar si 'dato' es un número válido
        const datosF = ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'clear', 'IR']; // creo la variable datosF para que every rastree si son numeros los valores de esas propiedades.
        if (typeof dato !== 'object' || !datosF.every(f => typeof dato[f] === 'number' && !isNaN(dato[f]))) {
            console.error('Dato del sensor inválido:', dato);
            continue; // Continuar con la siguiente iteración
        }

        // si la verificación anterior ha sido correcta y trabajamos con números calculamos los basic countpara cada campo 'F'
        const basic_count = {};
        datosF.forEach(f => {
            basic_count[f] = dato[f] / (tint * gain);
        });
        // Agregar el resultado a la lista
        basic_counts.push(basic_count)
    }



    return basic_counts;
}

//llamada a la funcion de cálculo de basic Counts con los valores del sensor, de tint y de gain:
const basicCounts = calcularBasicCounts(datosSensor, tint, gain);
//console.log('Basic Counts: ', basicCounts);

//****** FUNCION PARA CORREGIR LOS BASIC COUNTS DE CADA LONGITUD DE ONDA ****** */


function calculateCorrectedData(basicCounts) {
    // calculo el Data Sensor (Corr). Excel AS7341_Calibracion.xls/pestaña Demonstation Calculation. (columna F) 
    const dataSensorCorr = basicCounts.map(counts => {
        const correctedCounts = {};
        for (const key in counts) {
            //console.log(`Calculating for ${key}:`, typeof(counts[key]));

            const correctedValue = factorSensor[key] * (counts[key] - offsetCompensation[key]);
            correctedCounts[key] = correctedValue;
            //console.log(`Corrected value for ${key}:`, correctedValue);
        }
        return correctedCounts;
    });

    // calculo el Data Sensor (Corr). Excel AS7341_Calibracion.xls/pestaña Demonstation Calculation. (columna G) 
    const maxCorr = Math.max(...dataSensorCorr.map(counts => Math.max(...Object.values(counts))));

    const dataSensorCorrVsNor = dataSensorCorr.map(counts => {
        const normalizedCounts = {};
        for (const key in counts) {
            normalizedCounts[key] = counts[key] / maxCorr;
        }
        return normalizedCounts;
    });

    return dataSensorCorrVsNor;
}

//llamando a la funcion que corrige y normaliza los datos basic_count:
const correctedAndNormalizedData = calculateCorrectedData(basicCounts);

console.log('Corrected and Normalized Data:', correctedAndNormalizedData);
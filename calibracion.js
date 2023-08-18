import { datosSensor } from './sensorData.js';
import { offsetCompensation, factorSensor } from './constants.js';
//console.log ('datosSensor:',datosSensor)
//console.log('offsetCompensation:',offsetCompensation)
//console.log('factorSensor:', datosSensor)



//ACTUALIZACION DE VARIABLES DESDE LA WEB

//valores iniciales de las variables
let tint = 80;
let gain = 280;
let lx = 1;
let calcLx = 683 * lx;

//Otras variables:
var valoresCorregidos = [];
var matrixArray = [];
const matrices = {};
const resultMatrices = {};
var matrizCie1931 = [];
const matricesResultantesXYZ = {};
let colorValues = [];

const colorTargets = [
    [118, 0, 237, 'violeta', 1],
    [0, 40, 255, 'azul', 2],
    [0, 213, 255, 'cyan', 3],
    [31, 255, 0, 'verde', 4],
    [179, 255, 0, 'verde-lima', 5],
    [255, 223, 0, 'amarillo', 6],
    [255, 79, 0, 'naranja', 7],
    [255, 0, 0, 'rojo', 8],
    [255, 255, 255, 'blanco', 9],
    [0, 0, 0, 'negro', 10]
];;
const dataXYLx = []
let idContador = 1; //variable para añadir un id a la matriz dataXYLx
const idToText = {
    1: "violeta",
    2: "azul",
    3: "cyan",
    4: "verde",
    5: "Verde-lima",
    6: "amarillo",
    7: "naranja",
    8: "rojo",
    9: "blanco",
    10: "negro"
};

// Variables importadas desde archivos .csv:
async function obtenerDatosMatrixRow() {
    try {
        const response = await fetch('matrixRow.csv');
        const csvText = await response.text();

        // Divide el texto CSV en líneas
        const lines = csvText.split('\n');

        // Convierte las líneas en un array de arrays (filas y celdas)
        matrixArray = lines.map(line => line.split(','));

        return matrixArray;
    } catch (error) {
        console.error('Error al cargar el archivo matrixRow.csv', error);
    }
}

async function obtenerDatosMatrizFormateadaCie1931() {
    try {
        const response = await fetch('standardValuesFormated_CIE1931.csv');
        const csvText = await response.text();
        // Divide el texto CSV en líneas
        const lines = csvText.split('\n');
        // Convierte las líneas en un array de arrays (filas y celdas)
        matrizCie1931 = lines.map(line => line.split(','));
        return matrizCie1931
    } catch (error) {
        console.error('Error al cargar el archivo standardValuesFormated_CIE1931.csv', error);
    }
}

// Obtener los elementos de los sliders por su id
const targetColorColumn = document.getElementById('target-colors');
const testColorColumn = document.getElementById('test-colors');
const tintSlider = document.getElementById('tint');
const gainSlider = document.getElementById('gain');
const lxSlider = document.getElementById('lx');

// Obtener los elementos para mostrar los valores
const tintValueDisplay = document.getElementById('tintValue');
const gainValueDisplay = document.getElementById('gainValue');
const lxValueDisplay = document.getElementById('lxValue');
//funcion para eliminar los elementos cada vez que se cambien las variables:
function clearChildElements(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}
// Función para manejar el cambio de valor en los sliders
function handleSliderChange(slider, variableName, valueDisplay) {
    // Actualizar el valor de la variable y mostrarlo
    window[variableName] = parseFloat(slider.value);
    valueDisplay.textContent = window[variableName]; // Mostrar el valor en el elemento
    tint = parseInt(tintSlider.value);
    gain = parseInt(gainSlider.value);
    lx = parseFloat(lxSlider.value)
    console.log(`${variableName}:`, window[variableName]);
    console.log(`${slider.id} seleccionado: ${slider.value}`);


    // Llamar a main() cada vez que cambie un slider
    colorValues = [];
    main();
}
// Función para crear un elemento div con etiqueta dentro de los cuadros
function createColorDiv(color, label, colorId) {

    // ... creación de un div con color y etiqueta en el html ...
    const div = document.createElement('div');
    div.style.backgroundColor = `rgb(${color.r}, ${color.g}, ${color.b})`;
    //console.log('colorId:', colorId);
    div.innerHTML = `<p class="${colorId === 1 || colorId === 2 || colorId === 7 || colorId === 8 || colorId === 10 ? 'white-label' : ''}">${label}</p>`;
    return div;

}
// Asignar eventos de cambio a los sliders
tintSlider.addEventListener('input', () => handleSliderChange(tintSlider, 'tint', tintValueDisplay));
gainSlider.addEventListener('input', () => handleSliderChange(gainSlider, 'gain', gainValueDisplay));
lxSlider.addEventListener('input', () => handleSliderChange(lxSlider, 'lx', lxValueDisplay));

//* *** FUNCIONES GENERALES:
// Función para multiplicar cada valor de una fila por una constante
function multiplicarFilaPorConstante(fila, constante) {
    return fila.map(valor => valor * constante);
}
// Función para obtener el valor corregido de gamma inversa
function getReversedGammaCorrectedValue(value) {
    return value <= 0.0031308 ? 12.92 * value : (1.0 + 0.055) * Math.pow(value, 1.0 / 2.4) - 0.055;
}
// funcion para convertir a RGN
function convertXYBriToRGB(x, y, bri) {
    //comprobar si los valores son numeros para poder operar
    //console.log('funcion convertXYBBriToRGB loaded: x= ', x)

    // ... cálculos para obtener valores r, g, b ...
    //console.log('x:', x)
    let xy = {
        x: x,
        y: y
    };

    let z = 1.0 - xy.x - xy.y;
    let Y = bri / 255;
    let X = (Y / xy.y) * xy.x;
    let Z = (Y / xy.y) * z;

    let r = X * 1.656492 - Y * 0.354851 - Z * 0.255038;
    let g = -X * 0.707196 + Y * 1.655397 + Z * 0.036152;
    let b = X * 0.051713 - Y * 0.121364 + Z * 1.011530;

    r = getReversedGammaCorrectedValue(r);
    g = getReversedGammaCorrectedValue(g);
    b = getReversedGammaCorrectedValue(b);

    // Traer todos los componentes negativos a cero
    r = Math.max(r, 0);
    g = Math.max(g, 0);
    b = Math.max(b, 0);

    // Si un componente es mayor que 1, ajustar los componentes por ese valor
    let max = Math.max(r, g, b);
    if (max > 1) {
        r = r / max;
        g = g / max;
        b = b / max;
    }
    //console.log('RGB values:', r, g, b);
    return {
        r: Math.floor(r * 255),
        g: Math.floor(g * 255),
        b: Math.floor(b * 255),
    };


}
//* *******************************************************
//* ***** FUNCION CALCULAR BASIC COUNTS *******************
//* *******************************************************
async function calcularBasicCounts(sensorData, t, g) {
    console.log('3a. FUNCION CALCULAR BASIC COUNTS DATOS EJECUTADA....')
    console.log('tint:', tint, ' gain:', gain)
    const basic_counts = [];
    for (const dato of datosSensor) {
        // verificar si 'tint' y 'gain' son números válidos y no cero
        if (typeof t !== 'number' || typeof g !== 'number' || t === 0 || g === 0) {
            console.log('valores de tint o gain no son válidos', 'gain:', g, ' tint', t);
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
            basic_count[f] = dato[f] / (t * g);
        });
        // Agregar el resultado a la lista
        basic_counts.push(basic_count)
    }
    return basic_counts;

}

//* *******************************************************
//* ***** FUNCION CALCULAR BASIC COUNTS CORREGIDOS  *******
//* *******************************************************

async function calculateCorrectedData(basicCounts, factorSensor, offsetCompensation) {
    //console.log('4a. FUNCION CALCULAR CORRECCION BASIC COUNTS EJECUTADA....')

    // calculo el Data Sensor (Corr). Excel AS7341_Calibracion.xls/pestaña Demonstation Calculation. (columna F) 
    const dataSensorCorr = basicCounts.map(counts => {
        const correctedCounts = {};
        for (const key in counts) {
            //console.log(`Calculating for ${key}:`, typeof(counts[key]));

            const correctedValue = factorSensor[key] * (counts[key] - offsetCompensation[key]);
            correctedCounts[key] = correctedValue;
            //console.log(`Corrected value for ${key}:`, correctedValue);
            valoresCorregidos.push(correctedValue)
        }

        return correctedCounts;
    });

    // Imprimir los correctedCounts antes de seguir con los cálculos posteriores
    //console.log('dataSensorCorr:', dataSensorCorr);

    // calculo el Data Sensor (Corr/NOR). Excel AS7341_Calibracion.xls/pestaña Demonstation Calculation. (columna G) 
    const maxCorrPerObject = dataSensorCorr.map(counts => Math.max(...Object.values(counts))); //calculo el máximo de cada objeto(color)
    //console.log('Max Corr per Object:', maxCorrPerObject);


    const dataSensorCorrVsNor = dataSensorCorr.map((counts, index) => {
        const normalizedCounts = {};
        const maxCorrForObject = maxCorrPerObject[index]; // Obtener el valor maxCorr correspondiente al objeto actual
        for (const key in counts) {
            normalizedCounts[key] = counts[key] / maxCorrForObject;
        }
        return normalizedCounts;
    });

    return { dataSensorCorrVsNor, dataSensorCorr };
}
//* *******************************************************
//* *****     FUNCION RECONSTRUCCION ESPECTRAL      *******
//* *******************************************************
async function spectralReconstruccion(matrizSpectral) {
    //console.log('5a. FUNCION SPECTRAL RECONSTRUCCION EJECUTADA....')

    //le quito la key (f1...f8) y me quedo solo con el valor para montar las matrices.
    const subArraysDataCorrected = [];
    for (let i = 0; i < valoresCorregidos.length; i += 10) {
        const subArray = valoresCorregidos.slice(i, i + 10);
        subArraysDataCorrected.push(subArray);
    }

    //console.log('subArraysDataCorrected: ', (subArraysDataCorrected.slice(0, 3)));
    //console.log('matrizSpectral:', (matrizSpectral.slice(0, 3)));

    // Hay que multiplicar subArraysDataCorrected de 10matrices de 10f x 1c por matrizSpectral de 271f x 10c
    // Multiplicación de matrices


    // Multiplicar cada submatriz de subArraysDataCorrected por matrizSpectral

    //console.log('matrixArray',matrixArray)
    //console.log('matrizSpectral',matrizSpectral)
    for (let i = 0; i < subArraysDataCorrected.length; i++) {
        const variableName = `matrix${i + 1}`;
        const matrixData = subArraysDataCorrected[i];
        matrices[variableName] = matrixData;
    }
    const filas_matrixArray = matrizSpectral.length;
    //console.log('matrizSpectral[0]',matrizSpectral[0])
    const column_matrixArray = matrizSpectral[0].length;

    const filas_matrix1 = matrices.matrix1.length;
    const column_matrix1 = 1;

    //console.log(`matriz m1: ${filas_matrixArray} filas x ${column_matrixArray} columnas`);
    //console.log(`matrices.matrix1: ${filas_matrix1} filas x ${column_matrix1} columnas`);

    // Verificar si las matrices pueden multiplicarse
    if (column_matrixArray != filas_matrix1) {
        console.log("No se pueden multiplicar las matrices");
    } else {
        //console.log(`La matriz resultante es de ${filas_matrixArray} x ${column_matrix1}`);

        //* MULTIPLICAR MATRICES subArraysDataCorrected X matrizSpectral PARA OBTENER LA MATRIZ SPECTRAL RECONSTRUCTION (COLUMNA N DEL EXCEL, pagina demostration Calculations.)

        // Hacer la multiplicación para cada matriz individual
        for (let i = 0; i < subArraysDataCorrected.length; i++) {
            const variableName = `matrix${i + 1}`;
            const currentMatrix = matrices[variableName];

            const multiplicacion = new Array(filas_matrixArray); // Crear un array vacío del número de filas de m1

            // Crear la matriz vacía de filas m1 x columnas m2
            for (let x = 0; x < multiplicacion.length; x++) {
                multiplicacion[x] = new Array(column_matrix1).fill(0);
            }

            // Realizar la multiplicación
            for (let x = 0; x < multiplicacion.length; x++) {
                multiplicacion[x][0] = 0; // Inicializar el valor en la posición [x][0] para cada fila

                for (let z = 0; z < column_matrixArray; z++) {
                    multiplicacion[x][0] += matrixArray[x][z] * currentMatrix[z];
                }
            }

            // Almacena la matriz resultante en el objeto resultMatrices
            resultMatrices[variableName] = multiplicacion;
        }
    }
    //console.log('Matrices resultantes:', resultMatrices.matrix1);
    //console.log('MatrizCie1931', matrizCie1931)
    //necesito recortar las matrices de resultMatrices para que contengan el mismo número de filas que matrizCie1931:
    const numFilasDeseadas = matrizCie1931.length
    for (const variableName in resultMatrices) {
        if (resultMatrices.hasOwnProperty(variableName)) {
            resultMatrices[variableName] = resultMatrices[variableName].slice(0, numFilasDeseadas);
        }
    }
    return { resultMatrices, matrizCie1931 }
}
//* *******************************************************
//* *****        FUNCION MULTIPLICAR MATRICES       *******
//* *******************************************************
async function resultMatricesXmatrizCie1931(resultMatrices, matrizCie1931) {
    // Recorre cada matriz en resultMatrices y realiza la multiplicación con matrizCie1931
    //console.log('6º- FUNCION resultMatricesXmatrizCie1931 EJECUTADA')
    //console.log('resultMatrices:',resultMatrices)
    //console.log('matrizCie1931:',matrizCie1931)
    for (const variableName in matrices) {
        if (matrices.hasOwnProperty(variableName)) {
            const currentMatrix = matrices[variableName];
            const matrizResultante = [];
            for (let i = 0; i < currentMatrix.length; i++) {

                const filaResultante = multiplicarFilaPorConstante(matrizCie1931[i], currentMatrix[i][0]);

                matrizResultante.push(filaResultante);
            }

            matricesResultantesXYZ[variableName] = matrizResultante;

        }
    }
    /*
    //preparar la variable para exportar a un csv para comprobar datos.
    const matrizResultante1 = matricesResultantesXYZ.matrix1;
    const csvData = matrizResultante1.map(row => row.join(',')).join('\n');
    fs.writeFileSync('matrizCalculatedXYZ.csv', csvData, 'utf-8');
    */

    /*
    // Imprimir las matrices resultantes XYZ
    for (const variableName in matricesResultantesXYZ) {
        if (matricesResultantesXYZ.hasOwnProperty(variableName)) {
            console.log(`${variableName} XYZ:`, matricesResultantesXYZ[variableName]);
        }
    }
    */
}
//* *******************************************************
//* ***** FUNCION SUMAR LAS COLUMNAS DE LAS MATRIZ  *******
//* *******************************************************
async function sumarColumnasMatrixXYZ() {
    const sumMatrices = {};
    // Iterar a través de las matrices resultantes
    for (let i = 1; i <= Object.keys(resultMatrices).length; i++) {
        const matrixName = `matrix${i}`;
        const matrix = resultMatrices[matrixName];

        // Inicializar las sumas de cada coordenada
        let sumX = 0;
        let sumY = 0;
        let sumZ = 0;

        // Sumar los valores de cada coordenada
        for (let rowIndex = 0; rowIndex < matrix.length; rowIndex++) {
            sumX += matrix[rowIndex][0] * matrizCie1931[rowIndex][0];
            sumY += matrix[rowIndex][0] * matrizCie1931[rowIndex][1];
            sumZ += matrix[rowIndex][0] * matrizCie1931[rowIndex][2];
        }

        // Asignar las sumas al objeto
        sumMatrices[`Sum ${matrixName}_X`] = sumX;
        sumMatrices[`Sum ${matrixName}_Y`] = sumY;
        sumMatrices[`Sum ${matrixName}_Z`] = sumZ;
    }

    //console.log('sumMatrices--*-',sumMatrices);
    return sumMatrices;
}

//* *******************************************************
//* *********     FUNCION x y z Normalizados     **********
//* *******************************************************
async function obtener_xyzNorm(resultadosXYZ) {
    const arraySumMatrices = Object.entries(resultadosXYZ)

    const valoresXYZsumados = {};
    //console.log('Array = ', arraySumMatrices);

    for (let i = 0; i < arraySumMatrices.length / 3; i++) {
        const variableName = `Color_${i + 1}`;
        const startIndex = i * 3;

        const sumX = arraySumMatrices[startIndex][1];
        const sumY = arraySumMatrices[startIndex + 1][1];
        const sumZ = arraySumMatrices[startIndex + 2][1];
        const sumTotal = sumX + sumY + sumZ
        const x_ = sumX / sumTotal;
        const y_ = sumY / sumTotal;
        const z_ = sumZ / sumTotal;

        valoresXYZsumados[variableName] = { sumX, sumY, sumZ, x_, y_, z_ }

    }
    //console.log('valoresXYZsumados',valoresXYZsumados)
    return valoresXYZsumados;
}

//* *******************************************************
//* *********     FUNCION x y z Normalizados     **********
//* *******************************************************
async function obtenerLx(valor, luminosidad) {
    //console.log('FUNCION obtenerLx ejecutada')
    for (const color in valor) {
        if (valor.hasOwnProperty(color)) {
            const yValor = valor[color].sumY;
            let yValorXCalcLx = (yValor * luminosidad);
            //pongo condicional para asegurarme que si el valor de Lx es cercano a 0 en positivo o en negativo el valor será 0
            if ((yValorXCalcLx) > -1 && (yValorXCalcLx) < 1) {
                yValorXCalcLx = 0;
            } else if (yValorXCalcLx >= 1) {
                yValorXCalcLx = parseInt(yValor * luminosidad);
            } else {
                console.log('revisar el lux de alguno de los colores, posiblemente esté dando un valor negativo')
            }

            const text = idToText[idContador];
            dataXYLx.push([valor[color].x_, valor[color].y_, yValorXCalcLx, text, idContador++])
        }
    }
    colorValues = dataXYLx
        //console.log('dataXYLx',dataXYLx)   

}
//* *******************************************************
//* *********     FUNCION CONVERTIR EN RGB       **********
//* *******************************************************
async function loadColors() {
    //console.log('Colors loaded successfully');
    // Borrar los contenidos anteriores de los contenedores
    // Eliminar los colores anteriores de los contenedores
    clearChildElements(targetColorColumn);
    clearChildElements(testColorColumn);
    //targetColorColumn.innerHTML = '';
    //testColorColumn.innerHTML = '';
    console.log('colorValues=>', colorValues[0])
        // Cargar colores de prueba en el contenedor correspondiente
    for (const colorEntry of colorValues) {
        // ... obtener valores x,y, bri y colorId ...

        const x = colorEntry[0];
        const y = colorEntry[1];
        const bri = colorEntry[2];
        const colorId = colorEntry[4];

        // ... convertir a RGB ...
        const rgb = convertXYBriToRGB(x, y, bri); //const rgb = convertXYBriToRGB(xy[0], xy[1], bri);
        const colorDiv = createColorDiv(rgb, `${colorEntry[3]}`, colorId);

        // ... crear un cuadro de color con etiqueta en el html ...
        testColorColumn.appendChild(colorDiv); // Agregar al contenedor de pruebas
    }

    // Cargar colores objetivo en el contenedor correspondiente
    for (const targetEntry of colorTargets) {
        // ... obtener valores RGB ...
        const rgb = {
            r: targetEntry[0],
            g: targetEntry[1],
            b: targetEntry[2]
        };
        const colorId = targetEntry[4];
        const colorDiv = createColorDiv(rgb, targetEntry[3], colorId);
        // ... crear un cuadro de color con etiqueta ...
        targetColorColumn.appendChild(colorDiv); // Agregar al contenedor de objetivos
    }
}


//* =================================================
//* ====  FUNCION ASINCRONA PARA CARGAR LAS FUNCIONES
//* =================================================


async function main() {

    const calcLx = 683 * lx; // Valor actualizado de calcLx
    console.log('Using values:', tint, gain, lx);
    const basicCounts = await calcularBasicCounts(datosSensor, tint, gain);
    const correctedAndNormalizedData = await calculateCorrectedData(basicCounts, factorSensor, offsetCompensation);
    const matrizSpect = await obtenerDatosMatrixRow();

    await obtenerDatosMatrizFormateadaCie1931();
    try {

        //funcion matriz especral
        const { resultMatrices, matrizCie1931 } = await spectralReconstruccion(matrizSpect)
            //funcion para otener la matriz calculatedXYZ
        await resultMatricesXmatrizCie1931(resultMatrices, matrizCie1931);
        const sumMatrices = await sumarColumnasMatrixXYZ();
        const valoresXYZsumados = await obtener_xyzNorm(sumMatrices);
        await obtenerLx(valoresXYZsumados, calcLx);
        await convertXYBriToRGB();
        await loadColors();
    } catch (error) {
        console.error('Ocurrió un error:', error);
    }
}

main().catch(error => {
    console.error(`Ocurrió un error:`, error);
});
import { datosSensor } from './sensorData.js';
import { offsetCompensation, factorSensor } from './constants.js';
//console.log ('datosSensor:',datosSensor)
//console.log('offsetCompensation:',offsetCompensation)
//console.log('factorSensor:', datosSensor)



//ACTUALIZACION DE VARIABLES DESDE LA WEB

//valores iniciales de las variables
let tint = 129;
let gain = 514;
let lx = 1;
let calcLx = 683 * lx;

//Otras variables:
var valoresCorregidos = [];
var matrixArray = [];
const matrices = {};
var resultMatrices = {};
var matrizCie1931 = [];
const matricesResultantesXYZ = {};
let colorValues = [];
let basic_counts = [];
var sumMatrices = {};
let matrizResultante = [];
//exponente de corrección de gamma inversa (de 0.1 a 3.0)
let coefGammaInversa = 2.6;
// coeficiente transformacion lineales:
let rX = 2.586; //1.656492; //
let rY = 1.206; //0.354851; //
let rZ = 0.356; //0.255038; //
let gX = 1.392; //0.707196; //
let gY = 2.024; //1.655397; //
let gZ = 0.091; //0.036152; //
let bX = 2.077; //0.05173; //
let bY = 2.746; //0.121364; //
let bZ = 1.073; //1.011530 //

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
];
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
//* ***************************************************************************
//* ***************************** DOM *****************************************
//* ***************************************************************************
// Obtener los elementos de los sliders por su id
const targetColorColumn = document.getElementById('target-colors');
const testColorColumn = document.getElementById('test-colors');
const tintSlider = document.getElementById('tint');
const gainSlider = document.getElementById('gain');
const lxSlider = document.getElementById('lx');
const gammaSlider = document.getElementById('gamma');
const redXSlider = document.getElementById('rX');
const redYSlider = document.getElementById('rY');
const redZSlider = document.getElementById('rZ');
const greenXSlider = document.getElementById('gX');
const greenYSlider = document.getElementById('gY');
const greenZSlider = document.getElementById('gZ');
const blueXSlider = document.getElementById('bX');
const blueYSlider = document.getElementById('bY');
const blueZSlider = document.getElementById('bZ');


// Obtener los elementos para mostrar los valores
const tintValueDisplay = document.getElementById('tintValue');
const gainValueDisplay = document.getElementById('gainValue');
const lxValueDisplay = document.getElementById('lxValue');
const gammaInvValueDisplay = document.getElementById('gammaValue');
const rxValueDisplay = document.getElementById('rxValue');
const ryValueDisplay = document.getElementById('ryValue');
const rzValueDisplay = document.getElementById('rzValue');
const gxValueDisplay = document.getElementById('gxValue');
const gyValueDisplay = document.getElementById('gyValue');
const gzValueDisplay = document.getElementById('gzValue');
const bxValueDisplay = document.getElementById('bxValue');
const byValueDisplay = document.getElementById('byValue');
const bzValueDisplay = document.getElementById('bzValue');



//funcion para eliminar los elementos cada vez que se cambien las variables:
function clearChildElements(element) {
    while (element.firstChild) {
        if (element.firstChild === testColorColumn) {
            element.removeChild(element.firstChild);
        } else {
            console.log('no es FIRST CHILD! LO')
                // Por ejemplo, eliminar otros elementos si es necesario.
            element.removeChild(element.firstChild);
        }
    }
}


// Función para manejar el cambio de valor en los sliders
function handleSliderChange(slider, variableName, valueDisplay) {
    // Actualizar el valor de la variable y mostrarlo
    window[variableName] = parseFloat(slider.value);
    valueDisplay.textContent = window[variableName]; // Mostrar el valor en el elemento
    tint = parseInt(tintSlider.value);
    gain = parseInt(gainSlider.value);
    lx = parseFloat(lxSlider.value);
    coefGammaInversa = parseFloat(gammaSlider.value);
    rX = parseFloat(redXSlider.value);
    rY = parseFloat(redYSlider.value);
    rZ = parseFloat(redZSlider.value);
    gX = parseFloat(greenXSlider.value);
    gY = parseFloat(greenYSlider.value);
    gZ = parseFloat(greenZSlider.value);
    bX = parseFloat(blueXSlider.value);
    bY = parseFloat(blueYSlider.value);
    bZ = parseFloat(blueZSlider.value);

    console.log(`${variableName}:`, window[variableName]);
    console.log(`${slider.id} seleccionado: ${slider.value}`);


    // Llamar a main() cada vez que cambie un slider

    basic_counts = []
    valoresCorregidos = []
    sumMatrices = []
    matrizResultante = []
    resultMatrices = {}
    colorValues = []
    main();
}

// Asignar eventos de cambio a los sliders
tintSlider.addEventListener('input', () => handleSliderChange(tintSlider, 'tint', tintValueDisplay));
gainSlider.addEventListener('input', () => handleSliderChange(gainSlider, 'gain', gainValueDisplay));
lxSlider.addEventListener('input', () => handleSliderChange(lxSlider, 'lx', lxValueDisplay));
gammaSlider.addEventListener('input', () => handleSliderChange(gammaSlider, 'gamma', gammaInvValueDisplay));
redXSlider.addEventListener('input', () => handleSliderChange(redXSlider, 'rx', rxValueDisplay));
redYSlider.addEventListener('input', () => handleSliderChange(redYSlider, 'ry', ryValueDisplay));
redZSlider.addEventListener('input', () => handleSliderChange(redZSlider, 'rz', rzValueDisplay));
greenXSlider.addEventListener('input', () => handleSliderChange(greenXSlider, 'gx', gxValueDisplay));
greenYSlider.addEventListener('input', () => handleSliderChange(greenYSlider, 'gy', gyValueDisplay));
greenZSlider.addEventListener('input', () => handleSliderChange(greenZSlider, 'gz', gzValueDisplay));
blueXSlider.addEventListener('input', () => handleSliderChange(blueXSlider, 'bx', bxValueDisplay));
blueYSlider.addEventListener('input', () => handleSliderChange(blueYSlider, 'by', byValueDisplay));
blueZSlider.addEventListener('input', () => handleSliderChange(blueZSlider, 'bz', bzValueDisplay));

// Inicializar valores en los spans
document.getElementById('tintValue').textContent = tint;
document.getElementById('gainValue').textContent = gain;
document.getElementById('lxValue').textContent = lx;
document.getElementById('gammaValue').textContent = coefGammaInversa;
document.getElementById('rxValue').textContent = rX;
document.getElementById('ryValue').textContent = rY;
document.getElementById('rzValue').textContent = rZ;
document.getElementById('gxValue').textContent = gX;
document.getElementById('gyValue').textContent = gY;
document.getElementById('gzValue').textContent = gZ;
document.getElementById('bxValue').textContent = bX;
document.getElementById('byValue').textContent = bY;
document.getElementById('bzValue').textContent = bZ;
// Configurar valores iniciales de los sliders
document.getElementById('tint').value = tint;
document.getElementById('gain').value = gain;
document.getElementById('lx').value = lx;
document.getElementById('gamma').value = coefGammaInversa;
document.getElementById('rX').value = rX;
document.getElementById('rY').value = rY;
document.getElementById('rZ').value = rZ;
document.getElementById('gX').value = gX;
document.getElementById('gY').value = gY;
document.getElementById('gZ').value = gZ;
document.getElementById('bX').value = bX;
document.getElementById('bY').value = bY;
document.getElementById('bZ').value = bZ;

// 


// Función para crear un elemento div con etiqueta dentro de los cuadros
function createColorDiv(color, label, colorId) {

    // ... creación de un div con color y etiqueta en el html ...
    const div = document.createElement('div');
    div.style.backgroundColor = `rgb(${color.r}, ${color.g}, ${color.b})`;

    // Agrega un espacio en blanco como contenido del div para asegurarte de que sea visible
    div.innerHTML = '&nbsp;';



    return div;

}


//* *** FUNCIONES GENERALES:
// Función para multiplicar cada valor de una fila por una constante
function multiplicarFilaPorConstante(fila, constante) {
    return fila.map(valor => valor * constante);
}
// Función para obtener el valor corregido de gamma inversa
function getReversedGammaCorrectedValue(value) {
    //Si el valor de value es menor o igual a 0.0031308, se aplica una corrección lineal, en caso contrario se aplica una corrección de gamma inversa.
    return value <= 0.0031308 ? 12.92 * value : (1.0 + 0.055) * Math.pow(value, 1.0 / coefGammaInversa) - 0.055;
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
    //console.log('rx,ry,rz: ',rX,',',rY,',',rZ)
    //console.log('gx,gy,gz: ',gX,',',gY,',',gZ)
    //console.log('bx,by,bz: ',bX,',',bY,',',bZ)
    let r = X * rX - Y * rY - Z * rZ;
    let g = -X * gX + Y * gY + Z * gZ;
    let b = X * bX - Y * bY + Z * bZ;

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
    const tiempoInicio = new Date();
    console.log('****** calcularBasicCounts HA EMPEZADO A EJECUTARSE ****', tiempoInicio, tiempoInicio.getMilliseconds())

    //console.log('3a. FUNCION CALCULAR BASIC COUNTS DATOS EJECUTADA....')
    //console.log('tint:', tint, ' gain:', gain)
    //console.log('BASIC COUNTS ANTES', basic_counts.length)
    for (const dato of datosSensor) {
        // verificar si 'tint' y 'gain' son números válidos y no cero
        if (typeof t !== 'number' || typeof g !== 'number' || t === 0 || g === 0) {
            //console.log('valores de tint o gain no son válidos', 'gain:', g, ' tint', t);
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
    console.log('BASIC COUNTS DESPUES', basic_counts.length)

    const tiempoFin = new Date()
    console.log('****** la calcularBasicCounts FINALIZA A LAS: ****', tiempoFin, tiempoFin.getMilliseconds())
    return basic_counts;

}

//* *****************************************************************
//* ***** FUNCION CALCULAR BASIC COUNTS CORREGIDOS COLUMNA F  *******
//* *****************************************************************

async function calculateCorrectedData(basicCounts, factorSensor, offsetCompensation) {
    //console.log('4a. FUNCION CALCULAR CORRECCION BASIC COUNTS EJECUTADA....')
    const tiempoInicio = new Date();
    console.log('****** calculateCorrectedData HA EMPEZADO A EJECUTARSE ****', tiempoInicio, tiempoInicio.getMilliseconds())

    const correctedCounts = {};

    // calculo el Data Sensor (Corr). Excel AS7341_Calibracion.xls/pestaña Demonstation Calculation. (columna F) 
    const dataSensorCorr = basicCounts.map(counts => {

        for (const key in counts) {
            //console.log(`Calculating for ${key}:`, typeof(counts[key]));

            const correctedValue = factorSensor[key] * (counts[key] - offsetCompensation[key]);
            correctedCounts[key] = correctedValue;
            //console.log(`Corrected value for ${key}:`, correctedValue);
            valoresCorregidos.push(correctedValue)
        }

        return correctedCounts;
    });
    //* ***** FUNCION CALCULAR BASIC COUNTS CORREGIDOS Y NORMALIZADOS COLUMNA G  *******

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
    const tiempoFin = new Date()
    console.log('****** calculateCorrectedData FINALIZA A LAS: ****', tiempoFin, tiempoFin.getMilliseconds())
    return { dataSensorCorrVsNor, dataSensorCorr };
}
//* *****************************************************************
//* *****     FUNCION RECONSTRUCCION ESPECTRAL  COLUMNA N     *******
//* *****************************************************************
//Se multiplica la columna F(los basic_counts corregidos) por la MatrizSpectral General de 721filas x 10columnas, se obtiene una matriz de 721 filas x 1 columna
async function spectralReconstruccion(matrizSpectral) {
    const tiempoInicio = new Date();
    console.log('****** spectralReconstruccion HA EMPEZADO A EJECUTARSE ****', tiempoInicio, tiempoInicio.getMilliseconds())

    //le quito la key (F1...F8) a los basic_counts corregidos y me quedo solo con el valor para montar las matrices al que le llamo suArrayDataCorrected
    const subArraysDataCorrected = [];
    for (let i = 0; i < valoresCorregidos.length; i += 10) {
        const subArray = valoresCorregidos.slice(i, i + 10);
        subArraysDataCorrected.push(subArray);
    }
    // Hay que multiplicar subArraysDataCorrected de 10matrices de 10f x 1c por matrizSpectral de 271f x 10c cada submatriz de subArraysDataCorrected por matrizSpectral
    //recorro el subArrayDataCorrected y le añado a cada Array el nombre matrix + (un numero) del 1 a cada submatriz
    for (let i = 0; i < subArraysDataCorrected.length; i++) {
        const variableName = `matrix${i + 1}`;
        const matrixData = subArraysDataCorrected[i];
        matrices[variableName] = matrixData;
    }

    //creo estas variables locales para comprobar posteriormente si se pueden multiplicar las matrices
    const filas_matrixArray = matrizSpectral.length;
    const column_matrixArray = matrizSpectral[0].length;
    const filas_matrix1 = matrices.matrix1.length;
    const column_matrix1 = 1;

    // Comprobar si las matrices pueden multiplicarse
    if (column_matrixArray != filas_matrix1) {
        console.log("No se pueden multiplicar las matrices");
    } else {
        //* MULTIPLICAR MATRICES subArraysDataCorrected X matrizSpectral PARA OBTENER LA MATRIZ SPECTRAL RECONSTRUCTION (COLUMNA N DEL EXCEL, pagina demostration Calculations.)
        resultMatrices = {};
        // Hacer la multiplicación para cada una de las 10 matrices.
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
        const tiempoFin = new Date()
        console.log('****** la spectralReconstruccion FINALIZA A LAS: ****', tiempoFin, tiempoFin.getMilliseconds())
    }
    //necesito recortar las matrices de resultMatrices para que contengan el mismo número de filas que matrizCie1931:
    const numFilasDeseadas = matrizCie1931.length
    for (const variableName in resultMatrices) {
        if (resultMatrices.hasOwnProperty(variableName)) {
            resultMatrices[variableName] = resultMatrices[variableName].slice(0, numFilasDeseadas);
        }
    }
    console.log('resultMatrices DESPUES', resultMatrices)
    return { resultMatrices, matrizCie1931 }
}
//* *********************************************************************
//* *****        FUNCION MULTIPLICAR MATRICES   COLUMNAS R,S,T    *******
//* *********************************************************************
//Cada uno de los tres valores de la fila 1 de la matrizCie1931 se multiplica por el primer valor de la matriz SpectralRecontrucción, la segunda fila por el segundo valor y así sucesivamente.
async function resultMatricesXmatrizCie1931(resultMatrices, matrizCie1931) {
    const tiempoInicio = new Date();
    console.log('****** resultMatricesXmatrizCie1931 HA EMPEZADO A EJECUTARSE ****', tiempoInicio, tiempoInicio.getMilliseconds())
        // Recorre cada matriz en resultMatrices y realiza la multiplicación con matrizCie1931
    for (const variableName in matrices) {
        if (matrices.hasOwnProperty(variableName)) {
            const currentMatrix = matrices[variableName];
            for (let i = 0; i < currentMatrix.length; i++) {
                const filaResultante = multiplicarFilaPorConstante(matrizCie1931[i], currentMatrix[i][0]);
                matrizResultante.push(filaResultante);
            }
            matricesResultantesXYZ[variableName] = matrizResultante;
        }
    }

    const tiempoFin = new Date()
    console.log('****** resultMatricesXmatrizCie1931 FINALIZA A LAS: ****', tiempoFin, tiempoFin.getMilliseconds())
}
//* **************************************************************************
//* ***** FUNCION SUMAR LAS COLUMNAS DE LAS MATRIZ  CELDAS W10,W11,W12 *******
//* **************************************************************************
//Son el resultado de sumar la columna R para la SumX, S para la SumY y T para la SumZ
async function sumarColumnasMatrixXYZ() {
    const tiempoInicio = new Date();
    console.log('****** sumarColumnasMatrixXYZ HA EMPEZADO A EJECUTARSE ****', tiempoInicio, tiempoInicio.getMilliseconds())

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
    const tiempoFin = new Date()
    console.log('****** sumarColumnasMatrixXYZ FINALIZA A LAS: ****', tiempoFin, tiempoFin.getMilliseconds())
    return sumMatrices;
}

//* ***************************************************************************
//* *********     FUNCION x y z Normalizados  CELDAS W14, W15, W16   **********
//* ***************************************************************************
//para x_ = SumX/(SumX+SumY+SumZ) ; para la y_ = SumY/(SumX+SumY+SumZ); para la z_ = SumZ/(SumX+SumY+SumZ)
async function obtener_xyzNorm(resultadosXYZ) {
    const tiempoInicio = new Date();
    console.log('****** obtener_xyzNorm HA EMPEZADO A EJECUTARSE ****', tiempoInicio, tiempoInicio.getMilliseconds())
        //convierto en array el objeto resultadosXYZ
    const arraySumMatrices = Object.entries(resultadosXYZ)

    const valoresXYZsumados = {};
    console.log('Array = ', arraySumMatrices.length);

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
    const tiempoFin = new Date()
    console.log('****** obtener_xyzNorm FINALIZA A LAS: ****', tiempoFin, tiempoFin.getMilliseconds())

    return valoresXYZsumados;
}

//* *************************************************************
//* *********     FUNCION OBTENER LX  CELDA W17   ***************
//* *************************************************************
// Es el resultado de multiplicar la SumY por la variable calcLx
async function obtenerLx(valor, luminosidad) {
    const tiempoInicio = new Date();
    console.log('****** obtenerLx HA EMPEZADO A EJECUTARSE ****', tiempoInicio, tiempoInicio.getMilliseconds())

    // Vaciar el array dataXYLx antes de agregar nuevos elementos
    colorValues = []

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
            colorValues.push([valor[color].x_, valor[color].y_, yValorXCalcLx, text, idContador++])
        }
    }
    const tiempoFin = new Date()
    console.log('****** obtenerLx FINALIZA A LAS: ****', tiempoFin, tiempoFin.getMilliseconds())
    return colorValues


}
//* *******************************************************
//* *********     FUNCION CONVERTIR EN RGB       **********
//* *******************************************************
async function loadColors() {
    const tiempoInicio = new Date();
    console.log('****** loadColors HA EMPEZADO A EJECUTARSE ****', tiempoInicio, tiempoInicio.getMilliseconds())
        //borro los elementos creados en el navegador
    clearChildElements(testColorColumn);
    clearChildElements(targetColorColumn);

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
        console.log('COLORDIV', colorDiv)
    }
    const tiempoFin = new Date()
    console.log('****** loadColors FINALIZA A LAS: ****', tiempoFin, tiempoFin.getMilliseconds())
}


//* =================================================
//* ====  FUNCION ASINCRONA PARA CARGAR LAS FUNCIONES
//* =================================================


async function main() {
    const tiempoInicio = new Date();
    console.log('****** main HA EMPEZADO A EJECUTARSE ****', tiempoInicio, tiempoInicio.getMilliseconds())

    const calcLx = 683 * lx; // Valor actualizado de calcLx

    colorValues = [];
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
        console.log('colorValues antes obtenerlx', colorValues);
        await obtenerLx(valoresXYZsumados, calcLx);
        console.log('colorValues despues obtenerlx', colorValues);
        await convertXYBriToRGB();
        await loadColors();
        const tiempoFin = new Date()
        console.log('****** main FINALIZA A LAS: ****', tiempoFin, tiempoFin.getMilliseconds())
    } catch (error) {
        console.error('Ocurrió un error:', error);
    }
}

main().catch(error => {
    console.error(`Ocurrió un error:`, error);
});
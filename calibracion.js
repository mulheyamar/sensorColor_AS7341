//* 1º CALCULAR LOS BASIC_COUNTS. (COLUMNA C)
// usamos el archivo sensorData.js y lo guardo en variable <dataSensor>

//* 2º CALCULAR DATA SENSOR CORRECT (COLUMNA F)
// usamos la matriz offset Compensation per Channel: variable <offsetCompensation>
// y usamos también la matriz Correction vector per Channel: variable <factorSensor>

//* 3º CALCULAR DATA SENSOR CORRECT NORMALIZADOS (COLUMNA G)

//* 4º CONSTRUIMOS LA MATRIZ SPECTRAL (COLUMNA N)
// copiamos el excel en el archivo spectralMatrix.csv, lo procesamos con el spectralMatrixFormat.js 
//para formatearlo y exportar la matriz a matrixRow.csv guardandola en esta variable: <spectralMatrix>

//* 5º CALCULAMOS LA MATRIZ XYZ (COLUMNAS R,S,T)
// usamos la matriz CIE1931 que primero pegamos del excel al archivo standardValuesMatrix_CIE1931.csv y 
//luego mediante el spectralMatrixFormat.js la formateamos y guardamos en standardValuesFormated_CIE1931 que guardamos en la variable: <matrizFormateadaCie1931>

//* 6º CALCULAMOS LA X,Y,Z CIE1931 BASADA EN LA GOLDEN UNIT SPECTRAL CALIBRATION MATRIX. (COLUMNA W)
// es la suma de cada una de las columnas R,S,T

//* 7º CALCULAMOS LA x_,y_,z_ NORMALIZADAS (COLUMNA W)

//* 8º CALCULAMOS Lx y exportamos datos x,y,lx al archivo data.csv


const fs = require('fs');

//*************************** */
//*************************** */
//**      D E C L A R  A C I O N   D E  V A R I A B L  E S               ** */
//*************************** */
//*************************** */

//VARIABLES GAIN, TINT Y LX(CONTROLADAS POR LOS SELECTORES WEB)
let tint = 182;
let gain = 512;
let lx = 1;
let calcLx = 683 * lx;




function cargarDatosIniciales() {
    //VARIABLES DE DATOS DEL SENSOR
    console.log('1a. FUNCION IMPORTAR  DATOS EJECUTADA....')
    const datosSensor = require('./sensorData');

    //VARIABLES DE CORRECCION DEL BASIC_COUNT
    const offsetCompensation = require('./constants').offsetCompensation;
    const factorSensor = require('./constants').factorSensor;

    // Verificar los datos de offsetCompensation
    for (const key in offsetCompensation) {
        if (offsetCompensation.hasOwnProperty(key)) {
            if (!isNumber(offsetCompensation[key])) {
                console.error(`Valor no válido en offsetCompensation[${key}]`);
            }
        }
    }
    // Verificar los datos de factorSensor
    for (const key in factorSensor) {
        if (factorSensor.hasOwnProperty(key)) {
            if (!isNumber(factorSensor[key])) {
                console.error(`Valor no válido en factorSensor[${key}]`);
            }
        }
    }
    return { datosSensor, offsetCompensation, factorSensor };
}

//*FUNCION ASYNC QUE EJECUTA LAS FUNCIONES POR ORDEN
async function main() {
    const { datosSensor, offsetCompensation, factorSensor } = await cargarDatosIniciales();
    console.log('factorSensor', factorSensor)
        //cálculo de basic Counts con los valores del sensor, de tint y de gain:
    const basicCounts = await calcularBasicCounts(datosSensor, tint, gain);
    //llamando a la funcion que corrige y normaliza los datos basic_count:

    const correctedAndNormalizedData = await calculateCorrectedData(basicCounts, factorSensor, offsetCompensation);

    try {
        //funcion matriz especral
        const { resultMatrices, matrizCie1931 } = await spectralReconstruccion()

        //funcion para otener la matriz calculatedXYZ
        await resultMatricesXmatrizCie1931(resultMatrices, matrizCie1931);

        const sumMatrices = await sumarColumnasMatrixXYZ();;
        const valoresXYZsumados = await obtener_xyzNorm(sumMatrices)
        await obtenerLx(valoresXYZsumados);

    } catch (error) {
        console.error(`Ocurrió un error:`, error);
    }
}

main().catch(error => {
    console.error(`Ocurrió un error:`, error);
});


//VARIABLE DE MATRIZ ESPECTRAL GENERAL. 

// Lee el archivo CSV 
const spectralMatrix = fs.readFileSync('matrixRow.csv', 'utf-8');
//console.log(spectralMatrix)

//VARIABLE MATRIZ CIE 1931
const matrizFormateadaCie1931 = fs.readFileSync('standardValuesFormated_CIE1931.csv', 'utf-8')

//*--------------------------------
//* comprobación de datos válidos :
//*--------------------------------

// Función para verificar si un valor es un número válido
function isNumber(value) {
    return typeof value === 'number' && !isNaN(value);
}

//*************************** */
//*                          F U N C I O N E S                                  */
//*************************** */

//** FUNCION PARA CALCULAR LOS BASIC COUNTS DE CADA LONGITUD DE ONDA ** */
function calcularBasicCounts(datosSensor, tint, gain) {
    console.log('3a. FUNCION CALCULAR BASIC COUNTS DATOS EJECUTADA....')
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
//** FUNCION PARA CORREGIR LOS BASIC COUNTS DE CADA LONGITUD DE ONDA ** */

var valoresCorregidos = []

function calculateCorrectedData(basicCounts, factorSensor, offsetCompensation) {
    console.log('4a. FUNCION CALCULAR CORRECCION BASIC COUNTS EJECUTADA....')

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



//** FUNCION PARA CALCULAR LA RECOSNTRUCCION ESPECTRAL (SPECTRAL RECONSTRUCTION EXCEL COLUMN N -Demonstration Calculations page)*

//convierto los datos de matrixRow en una matriz de 271x10
matrixArray = []
const matrices = {};
const resultMatrices = {};

function spectralReconstruccion() {
    console.log('5a. FUNCION SPECTRAL RECONSTRUCCION EJECUTADA....')

    function formatearMatrix(matrix) {
        // dividir la cadena en lineas
        const rows = matrix.trim().split('\n');
        //convertir cada fila en un array de números
        const matrArray = rows.map(row => {
            const values = row.split(',').map(value => parseFloat(value));
            return values;
        })
        return matrArray;
    }
    matrixArray = formatearMatrix(spectralMatrix)
        //convierto los datos de standardValuesFormated_CIE1931 en una matriz de 271x3
    matrizCie1931 = formatearMatrix(matrizFormateadaCie1931)

    //le quito la key (f1...f8) y me quedo solo con el valor para montar las matrices.
    const subArraysDataCorrected = [];
    for (let i = 0; i < valoresCorregidos.length; i += 10) {
        const subArray = valoresCorregidos.slice(i, i + 10);
        subArraysDataCorrected.push(subArray);
    }

    console.log('subArraysDataCorrected: ', (subArraysDataCorrected.slice(0, 3)));
    console.log('matrixArray:', (matrixArray.slice(0, 3)));

    // Hay que multiplicar subArraysDataCorrected de 10matrices de 10f x 1c por matrixArray de 271f x 10c
    // Multiplicación de matrices


    // Multiplicar cada submatriz de subArraysDataCorrected por matrixArray



    for (let i = 0; i < subArraysDataCorrected.length; i++) {
        const variableName = `matrix${i + 1}`;
        const matrixData = subArraysDataCorrected[i];
        matrices[variableName] = matrixData;
    }
    const filas_matrixArray = matrixArray.length;
    const column_matrixArray = matrixArray[0].length;

    const filas_matrix1 = matrices.matrix1.length;
    const column_matrix1 = 1;

    console.log(`matriz m1: ${filas_matrixArray} filas x ${column_matrixArray} columnas`);
    console.log(`matrices.matrix1: ${filas_matrix1} filas x ${column_matrix1} columnas`);

    // Verificar si las matrices pueden multiplicarse
    if (column_matrixArray != filas_matrix1) {
        console.log("No se pueden multiplicar las matrices");
    } else {
        console.log(`La matriz resultante es de ${filas_matrixArray} x ${column_matrix1}`);

        //* MULTIPLICAR MATRICES subArraysDataCorrected X matrixArray PARA OBTENER LA MATRIZ SPECTRAL RECONSTRUCTION (COLUMNA N DEL EXCEL, pagina demostration Calculations.)

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
    console.log('Matrices resultantes:', resultMatrices.matrix1);
    console.log('MatrizCie1931', matrizCie1931)
        //necesito recortar las matrices de resultMatrices para que contengan el mismo número de filas que matrizCie1931:
    const numFilasDeseadas = matrizCie1931.length
    for (const variableName in resultMatrices) {
        if (resultMatrices.hasOwnProperty(variableName)) {
            resultMatrices[variableName] = resultMatrices[variableName].slice(0, numFilasDeseadas);
        }
    }
    return { resultMatrices, matrizCie1931 }
}

// Función para multiplicar cada valor de una fila por una constante
function multiplicarFilaPorConstante(fila, constante) {
    return fila.map(valor => valor * constante);
}

// Crear una matriz para almacenar las matrices resultantes XYZ
const matricesResultantesXYZ = {};

//* FUNCION PARA OBTENER LA MATRIZ CALCULATED XYZ (columnas R,S,T del excel, pagina Demonstation Calculations.)
function resultMatricesXmatrizCie1931(matrices, matrizCie1931) {
    // Recorre cada matriz en resultMatrices y realiza la multiplicación con matrizCie1931
    console.log('6º- FUNCION resultMatricesXmatrizCie1931 EJECUTADA')
    console.log('resultMatrices:', resultMatrices)
    console.log('matrizCie1931:', matrizCie1931)
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
//* FUNCION PARA SUMAR LAS COLUMNAS DE LAS MATRICES Y OBTENER X,Y,Z (Columna W del excel, pagina Demonstration Calculation)

// Función para sumar los valores de una columna en una matriz
function sumColumn(matrix, columnIndex) {
    return matrix.reduce((acc, row) => acc + row[columnIndex], 0);
}

function sumarColumnasMatrixXYZ() {
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

    console.log('sumMatrices--*-', sumMatrices);
    return sumMatrices;

}

//* FUNCION PARA OBTENER LAS x_ , y_ , z_ normalizadas (columna W del excel, pagina demonstration Calculation)

function obtener_xyzNorm(resultadosXYZ) {
    arraySumMatrices = Object.entries(resultadosXYZ)

    const valoresXYZsumados = {};
    console.log('Array = ', arraySumMatrices);

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
    console.log('valoresXYZsumados', valoresXYZsumados)
    return valoresXYZsumados;
}



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

//* FUNCION PARA OBTENER LX 
function obtenerLx(valor) {
    for (const color in valor) {
        if (valor.hasOwnProperty(color)) {
            const yValor = valor[color].sumY;

            let yValorXCalcLx = (yValor * calcLx);
            //pongo condicional para asegurarme que si el valor de Lx es cercano a 0 en positivo o en negativo el valor será 0
            if ((yValorXCalcLx) > -1 && (yValorXCalcLx) < 1) {
                yValorXCalcLx = 0;
            } else if (yValorXCalcLx >= 1) {
                yValorXCalcLx = parseInt(yValor * calcLx);
            } else {
                console.log('revisar el lux de alguno de los colores, posiblemente esté dando un valor negativo')
            }

            const text = idToText[idContador];
            dataXYLx.push([valor[color].x_, valor[color].y_, yValorXCalcLx, text, idContador++])
        }
    }
    console.log('dataXYLx', dataXYLx)
        // Exportar los datos a un archivo CSV
        /*
    const csvData = dataXYLx.map(row => row.join(',')).join('\n');
    fs.writeFileSync('data.csv', csvData, 'utf-8');
    */
    return dataXYLx
}
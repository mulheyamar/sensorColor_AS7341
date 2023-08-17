//* Este es un archivo auxiliar.
// Su función es rescatar los csv spectralMatrix.csv /standardValuesMatrix_CIE1931.csv  y lo formatea para luego exportarlo a un archivo csv que se llama matrixRow.csv
const fs = require('fs'); // Importo módulo de Node.js para poder interactuar con el sistema de archivos del sistema operativo.

// IMPORTAR LA SPECTRALMATRIX.CSV FORMATEANDO SUS DATOS PARA TRANSFORMARLA EN UN OBJETO:
function importarCsv() {

    //* 1 -LEER ARCHIVOS CSV
    // spectralMatrix.csv
    const spectralMatrix = fs.readFileSync('spectralMatrix.csv', 'utf-8');
    const standardValuesMatrixCie1931 = fs.readFileSync('standardValuesMatrix_CIE1931.csv', 'utf-8')


    //* 2- DIVIDIR LOS CONTENIDOS DE LOS ARCHIVOS EN FILAS:

    const rows = spectralMatrix.trim().split('\n');
    const rows2 = standardValuesMatrixCie1931.trim().split('\n');

    //* 3- PROECESA CADA FILA PARA CREAR LA MATRIZ DE MATRICES:
    const matrixArray = rows.map(row => {
        const values = row.split('\t');
        const matrixRow = values.map(value => parseFloat(value.replace(',', '.')));
        return matrixRow;
    });

    const standardValuesArray = rows2.map(row => {
        const values = row.split('\t');
        const matrixRow = values.map(value => parseFloat(value.replace(',', '.')));
        return matrixRow
    })

    //* 4- EXPORTAR LA SPECTRALMATRIX.CSV
    const csvContent = matrixArray.map(row => row.join(',')).join('\n');
    const csvContent2 = standardValuesArray.map(row => row.join(',')).join('\n');

    fs.writeFileSync('matrixRow.csv', csvContent, 'utf-8');
    fs.writeFileSync('standardValuesFormated_CIE1931.csv', csvContent2, 'utf-8');
    console.log('MatrixRow exportada correctamente');
}

// Llamar a la función para iniciar el proceso
importarCsv();
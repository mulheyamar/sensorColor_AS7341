//* Este es un archivo auxiliar.
// Su función es rescatar el csv spectralMatrix.csv y lo formatea para luego exportarlo a un archivo csv que se llama matrixRow.csv
const fs = require('fs'); // Importo módulo de Node.js para poder interactuar con el sistema de archivos del sistema operativo.

// IMPORTAR LA SPECTRALMATRIX.CSV FORMATEANDO SUS DATOS PARA TRANSFORMARLA EN UN OBJETO:
function importarCsv() {
    // Lee el archivo CSV 
    const spectralMatrix = fs.readFileSync('spectralMatrix.csv', 'utf-8');
    // Divide el contenido del archivo en filas:
    const rows = spectralMatrix.trim().split('\n');
    // Procesa cada fila para crear la matriz de matrices:
    const matrixArray = rows.map(row => {
        const values = row.split('\t');
        const matrixRow = values.map(value => parseFloat(value.replace(',', '.')));
        return matrixRow;
    });

    // EXPORTAR LA SPECTRALMATRIX.CSV
    const csvContent = matrixArray.map(row => row.join(',')).join('\n');

    fs.writeFileSync('matrixRow.csv', csvContent, 'utf-8');
    console.log('MatrixRow exportada correctamente');
}

// Llamar a la función para iniciar el proceso
importarCsv();
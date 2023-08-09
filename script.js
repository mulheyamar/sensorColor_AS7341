// Definición de una variable para almacenar los datos de las pruebas
let colorValues = [];

// Cargar los datos del archivo CSV y agregarlos a la variable colorValues
cargarDatos()

function cargarDatos() {
    let datosEstaticos = false;
    if (datosEstaticos) {
        console.log('cargando Datos estáticos');
        //pruebas en estático
        colorValues = [
            [0.18677, 0.10668, 32, 'violeta', 1],
            [0.1640, 0.1106, 35, 'azul', 2],
            [0.19417, 0.2269, 101, 'cyan', 3],
            [0.34072, 0.72568, 122, 'verde', 4],
            [0.38342, 0.65997, 137, 'verde-lima', 5],
            [0.47858, 0.57631, 122, 'amarillo', 6],
            [0.66501, 0.53029, 59, 'naranja', 7],
            [0.75243, 0.53556, 45, 'rojo', 8],
            [0.28269, 0.30641, 196, 'blanco', 9],
            [0.01981, -0.07323, 2, 'negro', 10],
        ];
        console.log('Color values:', colorValues);
        for (const colorEntry of colorValues) {
            console.log('Color Entry:');
            for (let i = 0; i < colorEntry.length; i++) {
                console.log(`  Key ${i}:`, colorEntry[i]);
            }
        }
    } else {
        console.log('cargando Datos dinámicoss')
        fetch('./data.csv')
            .then(response => response.text())
            .then(data => {
                console.log('CSV data loaded successfully');
                // Dividir los datos en filas
                const rows = data.split('\n');
                for (const row of rows) {
                    const values = row.split(',');

                    // Verificar si la fila tiene el formato esperado (x, y, bri, color, id)
                    if (values.length === 5) {

                        const x = parseFloat(values[0]);
                        const y = parseFloat(values[1]);
                        const bri = parseInt(values[2]);
                        const color = values[3];
                        const id = parseInt(values[4]);

                        // Agregar los datos a la lista colorValues
                        colorValues.push([x, y, bri, color, id]);
                    }
                }
                // Realizar operaciones con colorValues para obtener los valores RGB
                console.log('Color values:', colorValues);
                for (const colorEntry of colorValues) {
                    console.log('Color Entry:');
                    for (let i = 0; i < colorEntry.length; i++) {
                        console.log(`  Key ${i}:`, colorEntry[i]);
                    }
                }
                convertXYBriToRGB();
                loadColors();
            })
            .catch(error => {
                console.error('Error loading CSV:', error);
            });
    }
}
// Definición de colores de referencia
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

// Obtener los elementos contenedores de colores objetivo y pruebas
const targetColorColumn = document.getElementById('target-colors');
const testColorColumn = document.getElementById('test-colors');

// Función para obtener el valor corregido de gamma inversa
function getReversedGammaCorrectedValue(value) {
    return value <= 0.0031308 ? 12.92 * value : (1.0 + 0.055) * Math.pow(value, 1.0 / 2.4) - 0.055;
}

// Función para convertir coordenadas xy y brillo en valores RGB
function convertXYBriToRGB(x, y, bri) {
    //comprobar si los valores son numeros para poder operar
    console.log('funcion convertXYBBriToRGB loaded: x= ', x)

    // ... cálculos para obtener valores r, g, b ...
    console.log('x:', x)
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
    console.log('RGB values:', r, g, b);
    return {
        r: Math.floor(r * 255),
        g: Math.floor(g * 255),
        b: Math.floor(b * 255),
    };

}

// Función para crear un cuadro de color con etiqueta
function createColorDiv(color, label, colorId) {

    // ... creación de un div con color y etiqueta en el html ...
    const div = document.createElement('div');
    div.style.backgroundColor = `rgb(${color.r}, ${color.g}, ${color.b})`;
    div.innerHTML = `<p class="${colorId === 1 || colorId === 2 || colorId === 7 || colorId === 8 || colorId === 10 ? 'white-label' : ''}">${label}</p>`;
    return div;

}

// Función para cargar colores en los contenedores
function loadColors() {
    console.log('Colors loaded successfully');
    // Borrar los contenidos anteriores de los contenedores
    targetColorColumn.innerHTML = '';
    testColorColumn.innerHTML = '';

    // Cargar colores de prueba en el contenedor correspondiente
    for (const colorEntry of colorValues) {
        // ... obtener valores x,y, bri y colorId ...

        const x = colorEntry[0];
        const y = colorEntry[1];
        const bri = colorEntry[2];

        // ... convertir a RGB ...
        const rgb = convertXYBriToRGB(x, y, bri); //const rgb = convertXYBriToRGB(xy[0], xy[1], bri);
        const colorDiv = createColorDiv(rgb, `${colorEntry[3]}`);

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
        const colorDiv = createColorDiv(rgb, targetEntry[3]);
        // ... crear un cuadro de color con etiqueta ...
        targetColorColumn.appendChild(colorDiv); // Agregar al contenedor de objetivos
    }
}

// Cargar los colores al cargar la página
loadColors();
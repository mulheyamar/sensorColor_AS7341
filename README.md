## sensorColor_AS7341
***
Calibración del sensor de color AS7341. 

![sensor AS7341](https://i.ibb.co/rd0Kkv5/as7341.png)

[adafruit AS7341 10-Channel Light](https://learn.adafruit.com/adafruit-as7341-10-channel-light-color-sensor-breakout/overview)
*De momento solo funciona la calibración por variables del sensor. Abre el archivo **index.html** en el navegador y puedes jugar a calibrar las variables que definen los colores de test.*

### OBJETIVO DEL PROYECTO
***
<p>Conseguir leer los colores de los objetos, pasar el proyecto a Arduino para ejecutar unas instrucciones según el color que ha detectado</p>

### ANTECEDENTES
***
<p> Ni mi amigo Raúl ni yo nos habíamos enfrentado antes a un reto similar, jugando con los niños en la playa decidimos inventar un artilugio para que detectara los colores. Sí, ya sabemos que existen en el mercado, pero nuestra intención era personalizarlo para un fin concreto. Empezamos a divagar ideas abstractas, todo por pasar el rato, pero en cuanto llegué a casa compré el sensor TCS230. Nada más recibir en casa el sensor, lo probé con Arduino. Me decepcioné un poco ya que si te salías de los colores vivos del círculo cromático la eficiencia era casi nula...o por lo menos yo no supe como mejorarla. Al día siguiente, compré un nuevo sensor y volqué mis esperanzas en el AS7341. Uf! la primera impresión fue buena, me devolvía 10 valores en cada lectura....la cosa prometía, y aquí comenzó la aventura</p>

### PRIMEROS PASOS
***
- #### ENTENDER EL FUNCIONAMIENTO

> "Todo lo que no se comprende, envenena" (Eugeni d´Ors)
<p>La ignorancia es atrevida. Cuando vi la cantidad de valores que detectaba el sensor AS7341 aluciné, pues muestra 8 longitudes de onda del espectro desde F1 a F8 y dos parámetros más uno que le llama Clear y otro IR.</p>
<p>Creía que con eso bastaba, que con una simple función me daría el color exacto y listo. Pues no, cuando me leí el manual del sensor e investigué por la red me percaté de lo lejos que estaba de obtener lo que yo buscaba un sencillo RGB...</p>

[Datasheet](https://github.com/mulheyamar/sensorColor_AS7341/blob/main/Manual_TCS3430_calibration_AN000571_1-00.pdf)

[Manual de calibración](https://github.com/mulheyamar/sensorColor_AS7341/blob/main/DOCUMENTO_CALIBRACION_AS7341_AN000633_2-00.pdf)

[Toda la documentación del fabricante](https://ams.com/as7341#tab/documents)


<p>Tras un primer vistazo al manual (Datasheet) del producto me di cuenta de lo perdido que estaba. Demasiados datos técnicos que no entendía. Era veneno para mis ojos y ácido para mi cerebro. No comprendía bien cómo debía de proceder al cálculo para obtener datos fiables. Abrí el excel que encontré también en la web del fabricante</p>

[Excel para aplicar los datos](https://www.google.com/url?sa=t&rct=j&q=&esrc=s&source=web&cd=&ved=2ahUKEwjU2Zm-5fSAAxUMXaQEHcX8DlQQFnoECA0QAQ&url=https%3A%2F%2Fams.com%2Fdocuments%2F20143%2F36005%2FAS7341_AD000198_3-00.xlsx&usg=AOvVaw3wo3EWLiuPEaJHz1fv_zYs&opi=89978449)

<p>He de reconocer que abrir un excel que no conoces, y lleno de cálculos, es tedioso y más si desconoces de donde salen todos esos números, pero siempre será mucho más sencillo seguir el rastro de las fórmulas.</p>
<p>¿Por donde empieza el excel? ¿Cómo introducía en las tablas los datos que había obtenido del sensor?></p>

- #### DATOS DE PARTIDA

<p>Tenía claro que era crucial partir de unos datos "fiables" así que busqué por la red y encontré unos valores rgb para cada uno de los colores del espectro, que serían mi <b>TARGET</b></p>

![TARGET](https://i.ibb.co/512Zf1Y/datos-de-partida.jpg)

<p>Con esos colores como objetivo los fui leyendo directamente con el sensor sobre la pantalla del monitor y los datos los represento en la siguiente tabla:</p>

![DATOS DEL SENSOR](https://i.ibb.co/nsNVXnC/datos-sensor.jpg)

<p>Era momento de abrir el excel e introducir mis datos de cada color, pero los datos de partida del excel que venían de ejemplo no se parecían en nada a los que yo obtuve del sensor, debía sustituir los valores de la columna de "Basic counts from protocol file" <p>

![DATOS DE PARTIDA EXCEL](https://i.ibb.co/VSBVVK9/basic-Counts.jpg)

- #### CALCULO DE CALIBRACION

<p>Recordé haber leído en el documento de calibración algo sobre los Basic Counts. En el punto 2.1 especifíca como calcula los basic counts mediante dos variables. Gain y Tint</p>

~~~
Basic_Counts = Raw_Counts / (Gain x Tint) 
Raw_Counts = Datos del sensor
~~~
<p>Como dato de partida a Gain le daría como valor máximo 512 y Tint 182 para usar lo mismo que viene en el ejemplo. De todas formas pensaba jugar con estas dos variables para ver como afectaban al color más tarde</p>

<p>La siguiente columna del excel a resolver era el <b>Corr Sensor Offset</b> seguida de <b>Corr Sensor Factor</b>. Estos datos vienen dados como una constante para cada valor del espectro. Están en las respectivas matrices llamada <i>Offset Compensation per Channel</i> y <i>Correction vector per Channel</i> de la hoja "used Correction Values"</p>

![constantes](https://i.ibb.co/nDqPQNL/Sin-t-tulo.jpg)

<p>En el proyecto decido guardar estas matrices en el modulo de js <b>contants.js</b><p>
<p>El siguiente paso era resolver la columna de <b>Data Sensor (Corr)</b> </p>

~~~
        Data Sensor (Corr) = Corr Sensor Factor x (Basic_Counts - Corr Sensor Offset)
~~~

<p>Y ya solo queda el último dato de la tabla Channel Data que es el de la columna de Data Sensor (Corr/Nor), es simplemente normalizar el dato anterior.</p>

~~~
        Data Sensor (Corr/Nor) = Data Sensor (Corr) / Max (Data Sensor (Corr))
~~~
<p>A partir de aquí el excel tomaba dos caminos, uno simple y otro más complejo para obtener la CIE1931* basada en Golden Unit XYZ calibration Matrix. ¿Adivinas cuál elegí? Pues eso, el complejo, solo porque decía que era más preciso, pero al fin y al cabo es una ligera diferencia que apenas podrás apreciar (a mi parecer), pero claro, esto lo sé a posteriori...</p>

![Espacio CIE1931](https://i.ibb.co/d6XCkLX/300px-CIExy1931.png)
> ***CIE1931:***
*Es uno de los primeros espacios de color definidos matemáticamente.*
<p>Tampoco es nada del otro mundo, el camino complejo son solo dos pasos. El primero es una multiplicación de la General Spectral Correction Matrix pr Channel - Step size 1nm  de 721 filas x 10 columnas por Data Sensor (Corr) de 10 filas x 1 columna. De lo que como resultado se obtiene la matriz de 721 filas x 1 columna que se llama <b>Spectral Reconstruction</b> y está en la columna N</p>
~~~
        Spectral Reconstruction = General Spectral Correction Matrix X Data Sensor (Corr)
~~~

<p>El siguiente paso es calcular la matriz Calculated XYZ que se obtiene de multiplicar cada una de las filas de la matriz obtenida en el paso anterior Spectral Reconctruction X cada uno de los tres valores de la fila correspondiente de la Matriz CIE1931. El resultado nos devolverá una matriz de 401 filas x 3 columnas (X,Y,Z) </p>
~~~
        Calculated XYZ = Spectral Reconstruction filaN X Matriz CIE1031 filaN
~~~

- #### COORDENADAS CIE1931
<p>Ya estamos en condiciones de obtener la X, Y, Z CIE1931 ¿Cómo? Sencillísimo. Sumamos cada una de las columnas de la Matriz Calculated XYZ del punto anterior. La suma de la primera columna corresponderá al valor de X, la segunda columna para la Y, la tercera columna para la Z</p>

<p>Nos queda solamente obtener la x,y,z y Lx. Que también sale de una fórmula muy sencilla </p>

~~~
        x = X / (X+Y+Z)  ; y = X / (X+Y+Z) ; z = X / (X+Y+Z) ; Lx = Y * constante Lx
        constante Lx = 683;
~~~

- #### TRANSFORMACION DE COORDENADAS CIE1931 A RGB
<p>Covertir las coordenadas X,Y,Z es cuestión de aplicar una matriz de las varias que existen para transformar los datos a RGB, como particularidad he querido que los 9 valores de la matriz para calcular el rgb sean variables a ajustar por la web</p>

- ### RESULTADO DEL TEST
***
<p>El primer resultado con estos cálculos que obtuve  se acercaba al objetivo bastante...pero era insuficiente</p>

![TEST1](https://i.ibb.co/Kmqrxhc/TEST1.png)
*Imagen.Resultado Test 1 con valor de Gain en 512 y Tint 182*

- ### AJUSTE DE VARIABLES
<p>Evidentemente iba por buen camino, pero necesitaba más precisión. No podía recrear estos cálculos a mano con un excel para ir ajustando los colores, debía automatizarlo así que se me ocurrió usar un navegador y mostrar las variables de forma dinámica para ajustar el color preciso.</p>

![web](https://i.ibb.co/W5Q1kF7/web.jpg)
<!--
**********************************************************
function xy_to_rgb() {
    for (var i = 1; i <= 3; i++) {
        var X = Sheet1.Cells(i, 1);
        var Y = Sheet1.Cells(i, 2);
        var Z = Sheet1.Cells(i, 3);

        var nt_R = (X * 3.2406 + Y * -1.5372 + Z * -0.4986) / 100;
        var nt_G = (X * -0.9689 + Y * 1.8758 + Z * 0.0415) / 100;
        var nt_B = (X * 0.0557 + Y * -0.2040 + Z * 1.0570) / 100;

        if (nt_R > 0.0031308) {
            nt_R = 1.055 * Math.pow(nt_R, 1 / 2.4) - 0.055;
        } else {
            nt_R = 12.92 * nt_R;
        }
        if (nt_G > 0.0031308) {
            nt_G = 1.055 * Math.pow(nt_G, 1 / 2.4) - 0.055;
        } else {
            nt_G = 12.92 * nt_G;
        }
        if (nt_B > 0.0031308) {
            nt_B = 1.055 * Math.pow(nt_B, 1 / 2.4) - 0.055;
        } else {
            nt_B = 12.92 * nt_B;
        }

        nt_R = Math.min(255, Math.max(0, nt_R * 255));
        nt_G = Math.min(255, Math.max(0, nt_G * 255));
        nt_B = Math.min(255, Math.max(0, nt_B * 255));

        Sheet1.Cells(i, 4) = nt_R;
        Sheet1.Cells(i, 5) = nt_G;
        Sheet1.Cells(i, 6) = nt_B;
    }
}
***********************************************************
 AS7341 presence demo initialization data file
[Config]
# Correction factor of raw values - normalization of raw counts to see colors 
similar to human eyes - corection values were done by a LED based white screen
# results of these correction values are calculated XYZ valus in GUI which are 
transformed into RGB by conversion matrix - see next lines
# change and adapt the correction values in case of wrong colors on screen based 
on sensor devie deviations
# F1;F2;F3;F4;F5;F6;F7;F8
CorrectionFactor= 4.1;2.7;4.4;2.0;1.7;1.7;1.28;1.0
# XYZ to RGB conversion matrix - used to print out a color by a windows based GUI 
- the matrix insert general matching factors - do not change them 
# RX;RY;RZ;GX;GY;GZ;BX;BY;BZ
ConversionXYZ2RGB= 10.03558000;-6.16536100;-
0.54215400;1.36935900;1.00541900;0.57871000;1.15414200;-0.59024700;2.14952500
# Integration time [ms] - the higher TINT the more sensitive is the sensor 
TInt= 500
>
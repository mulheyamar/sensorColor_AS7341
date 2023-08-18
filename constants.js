// constants.js que vienen de las tablas: OffSet Compensation per Channel y Correction per Channel respectivamente, dentro de la hoja de used Correction Values del excel AS7341_Calibracion.xls

// Offset compensation values

export const offsetCompensation = {
    F1: 0.00196979,
    F2: 0.00724927,
    F3: 0.00319381,
    F4: 0.001314659,
    F5: 0.001468153,
    F6: 0.001858105,
    F7: 0.001762778,
    F8: 0.00521704,
    clear: 0.003,
    IR: 0.001
};


// Factor sensor values
export const factorSensor = {
    F1: 1.0281124497992,
    F2: 1.03149253731343,
    F3: 1.03142493638677,
    F4: 1.03124702295894,
    F5: 1.03389697823704,
    F6: 1.03444940076315,
    F7: 1.03508344499939,
    F8: 1.03359418669648,
    clear: 1.23383990622122,
    IR: 1.26941570639527
};



/*
module.exports = {
    offsetCompensation,
    factorSensor
};
*/
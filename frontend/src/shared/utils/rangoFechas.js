// Formatea usando los componentes de fecha LOCALES (no UTC), para que no se corra un día
// en husos horarios negativos como Argentina (toISOString() convierte a UTC primero).
export const formatearFechaLocal = (fecha) => {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
};

export const calcularRangoFechas = (escala) => {
    const hasta = new Date();
    const desde = new Date();
    desde.setDate(desde.getDate() - (escala === 'mes' ? 29 : 6));

    return { desde: formatearFechaLocal(desde), hasta: formatearFechaLocal(hasta) };
};

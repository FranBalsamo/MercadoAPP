// Convierte una fecha ISO "YYYY-MM-DD" (formato en el que viaja desde el backend)
// al formato visual "DD-MM-YYYY" usado en toda la interfaz y en los PDF exportados.
export const formatearFechaVisual = (fechaISO) => {
    if (!fechaISO) return '-';
    const [anio, mes, dia] = fechaISO.split('-');
    if (!anio || !mes || !dia) return fechaISO;
    return `${dia}-${mes}-${anio}`;
};

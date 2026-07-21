import { useState, useEffect } from 'react';
import { HiOutlineCalendarDays } from 'react-icons/hi2';
import { formatearFechaLocal } from '@/shared/utils/rangoFechas';

const formatearMoneda = (valor) => (valor ?? 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

const obtenerMesAnio = (fechaISO) => fechaISO?.slice(0, 7);
const formatearMesAnio = (fecha) => formatearFechaLocal(fecha).slice(0, 7);

const calcularVariacion = (actual, anterior) => {
    if (anterior === 0) return actual === 0 ? 0 : 100;
    return ((actual - anterior) / anterior) * 100;
};

function ComparativaMensual() {
    const [datos, setDatos] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const cargarDatos = async () => {
            setCargando(true);
            setError('');
            try {
                const hoy = new Date();
                const fechaMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
                const mesActualStr = formatearMesAnio(hoy);
                const mesAnteriorStr = formatearMesAnio(fechaMesAnterior);

                // Acotamos la consulta al primer día del mes anterior en adelante, en vez de traer todo el historico.
                const parametros = new URLSearchParams({
                    desde: formatearFechaLocal(fechaMesAnterior),
                    hasta: formatearFechaLocal(hoy),
                });
                const respuesta = await fetch(`http://localhost:8080/api/planilla/rango?${parametros}`);
                if (!respuesta.ok) {
                    throw new Error(`Error del servidor: ${respuesta.status}`);
                }
                const planillas = (await respuesta.json()).filter(p => p.estadoPlanilla === 'CERRADA');

                const agregar = (mesStr) => planillas
                    .filter(p => obtenerMesAnio(p.fecha) === mesStr)
                    .reduce((acumulado, p) => ({
                        ingresos: acumulado.ingresos + (p.ingresoTotal || 0),
                        deuda: acumulado.deuda + (p.deudaTotal || 0),
                        planillas: acumulado.planillas + 1
                    }), { ingresos: 0, deuda: 0, planillas: 0 });

                setDatos({
                    actual: agregar(mesActualStr),
                    anterior: agregar(mesAnteriorStr),
                });
            } catch (e) {
                console.error('Error al cargar la comparativa mensual:', e);
                setError('No se pudo cargar la comparativa mensual.');
            } finally {
                setCargando(false);
            }
        };

        cargarDatos();
    }, []);

    const renderIndicador = (variacion) => {
        const positivo = variacion >= 0;
        return (
            <span style={{ color: positivo ? 'var(--success)' : 'var(--danger)', fontSize: '0.8rem', fontWeight: 'bold' }}>
                {positivo ? '▲' : '▼'} {Math.abs(variacion).toFixed(1)}%
            </span>
        );
    };

    const filas = datos ? [
        { titulo: 'Ingresos', actual: datos.actual.ingresos, anterior: datos.anterior.ingresos, color: 'var(--success)' },
        { titulo: 'Deuda', actual: datos.actual.deuda, anterior: datos.anterior.deuda, color: 'var(--danger)' },
        { titulo: 'Planillas cerradas', actual: datos.actual.planillas, anterior: datos.anterior.planillas, color: 'var(--info)', esNumero: true },
    ] : [];

    return (
        <div>
            <h4 style={{ margin: '0 0 15px 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}><HiOutlineCalendarDays /> Mes actual vs. mes anterior</h4>

            {error && <p style={{ color: 'var(--danger)', fontSize: '0.9rem' }}>{error}</p>}

            {cargando ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Cargando...</p>
            ) : (
                <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
                    {filas.map(fila => {
                        const variacion = calcularVariacion(fila.actual, fila.anterior);
                        return (
                            <div key={fila.titulo} style={{ flex: 1, minWidth: '160px' }}>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 'bold' }}>{fila.titulo}</span>
                                <h3 style={{ margin: '4px 0 0 0', color: fila.color }}>
                                    {fila.esNumero ? fila.actual : formatearMoneda(fila.actual)}
                                </h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                                    {renderIndicador(variacion)}
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        vs {fila.esNumero ? fila.anterior : formatearMoneda(fila.anterior)} el mes pasado
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default ComparativaMensual;

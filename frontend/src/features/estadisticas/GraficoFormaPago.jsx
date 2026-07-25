import { useState, useEffect } from 'react';
import { calcularRangoFechas } from '@/shared/utils/rangoFechas';
import ToggleEscalaTiempo from './ToggleEscalaTiempo';
import { HiOutlineCreditCard } from 'react-icons/hi2';
import MensajeError from '@/shared/ui/MensajeError';

const COLORES_FORMA_PAGO = {
    EFECTIVO: '#2ecc71',
    MERCADO_PAGO: '#3498db',
    TRANSFERENCIA_BANCARIA: '#9b59b6',
    OTROS: '#95a5a6',
};

const NOMBRES_FORMA_PAGO = {
    EFECTIVO: 'Efectivo',
    MERCADO_PAGO: 'Mercado Pago',
    TRANSFERENCIA_BANCARIA: 'Transferencia Bancaria',
    OTROS: 'Otros',
};

function GraficoFormaPago({ diametroTorta = 150 }) {
    const [escala, setEscala] = useState('semana');
    const [datos, setDatos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const cargarDatos = async () => {
            setCargando(true);
            setError('');
            try {
                const { desde, hasta } = calcularRangoFechas(escala);
                const parametros = new URLSearchParams({ desde, hasta });
                const respuesta = await fetch(`http://localhost:8080/api/boleta/estadisticas/forma-pago?${parametros}`);
                if (!respuesta.ok) {
                    throw new Error(`Error del servidor: ${respuesta.status}`);
                }
                setDatos(await respuesta.json());
            } catch (e) {
                console.error('Error al cargar distribución de forma de pago:', e);
                setError('No se pudo cargar el gráfico de forma de pago.');
            } finally {
                setCargando(false);
            }
        };

        cargarDatos();
    }, [escala]);

    let acumulado = 0;
    const segmentos = datos.map(d => {
        const inicio = acumulado;
        acumulado += d.porcentaje;
        return { ...d, inicio, fin: acumulado };
    });

    const gradiente = segmentos.length > 0
        ? `conic-gradient(${segmentos.map(s => `${COLORES_FORMA_PAGO[s.formaPago] || '#bdc3c7'} ${s.inicio}% ${s.fin}%`).join(', ')})`
        : '#eee';

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                <h4 style={{ margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}><HiOutlineCreditCard /> Forma de pago más usada</h4>
                <ToggleEscalaTiempo escala={escala} onCambiar={setEscala} />
            </div>

            <MensajeError mensaje={error} />

            {cargando ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Cargando...</p>
            ) : datos.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    No hay boletas pagadas en {escala === 'semana' ? 'la última semana' : 'el último mes'}.
                </p>
            ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '30px', flexWrap: 'wrap' }}>
                    <div style={{
                        width: `${diametroTorta}px`, height: `${diametroTorta}px`, borderRadius: '50%',
                        background: gradiente, flexShrink: 0
                    }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {segmentos.map(s => (
                            <div key={s.formaPago} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: COLORES_FORMA_PAGO[s.formaPago] || '#bdc3c7', flexShrink: 0 }} />
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', minWidth: '150px' }}>{NOMBRES_FORMA_PAGO[s.formaPago] || s.formaPago}</span>
                                <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{s.porcentaje.toFixed(1)}%</strong>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({s.cantidad})</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default GraficoFormaPago;

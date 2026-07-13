import { useState, useEffect } from 'react';
import { calcularRangoFechas } from '../../utils/rangoFechas';
import ToggleEscalaTiempo from './ToggleEscalaTiempo';
import { HiOutlineTicket } from 'react-icons/hi2';

const formatearMoneda = (valor) => (valor ?? 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

function TicketPromedio() {
    const [escala, setEscala] = useState('semana');
    const [datos, setDatos] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const cargarDatos = async () => {
            setCargando(true);
            setError('');
            try {
                const { desde, hasta } = calcularRangoFechas(escala);
                const parametros = new URLSearchParams({ desde, hasta });
                const respuesta = await fetch(`http://localhost:8080/api/boleta/estadisticas/ticket-promedio?${parametros}`);
                if (!respuesta.ok) {
                    throw new Error(`Error del servidor: ${respuesta.status}`);
                }
                setDatos(await respuesta.json());
            } catch (e) {
                console.error('Error al cargar el ticket promedio:', e);
                setError('No se pudo cargar el ticket promedio.');
            } finally {
                setCargando(false);
            }
        };

        cargarDatos();
    }, [escala]);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                <h4 style={{ margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}><HiOutlineTicket /> Ticket promedio por boleta</h4>
                <ToggleEscalaTiempo escala={escala} onCambiar={setEscala} />
            </div>

            {error && <p style={{ color: 'var(--danger)', fontSize: '0.9rem' }}>{error}</p>}

            {cargando ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Cargando...</p>
            ) : !datos || datos.cantidadBoletas === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    No hay boletas pagadas en {escala === 'semana' ? 'la última semana' : 'el último mes'}.
                </p>
            ) : (
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '140px' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 'bold' }}>Boletas pagadas</span>
                        <h3 style={{ margin: '4px 0 0 0', color: 'var(--text-primary)' }}>{datos.cantidadBoletas}</h3>
                    </div>
                    <div style={{ flex: 1, minWidth: '140px' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 'bold' }}>Total facturado</span>
                        <h3 style={{ margin: '4px 0 0 0', color: 'var(--success)' }}>{formatearMoneda(datos.totalFacturado)}</h3>
                    </div>
                    <div style={{ flex: 1, minWidth: '140px' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 'bold' }}>Ticket promedio</span>
                        <h3 style={{ margin: '4px 0 0 0', color: 'var(--info)' }}>{formatearMoneda(datos.promedio)}</h3>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TicketPromedio;

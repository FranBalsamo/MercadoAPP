import { useState, useEffect } from 'react';
import { calcularRangoFechas } from '@/shared/utils/rangoFechas';
import ToggleEscalaTiempo from './ToggleEscalaTiempo';
import { HiOutlineChartBar } from 'react-icons/hi2';
import '@/shared/styles/Botones.css';

const COLORES_BARRAS = ['#3498db', '#2ecc71', '#f1c40f', '#e67e22', '#9b59b6', '#1abc9c', '#e74c3c', '#34495e'];

function GraficoProductosVendidos({ limite = null, mostrarBotonExpandir = false, onExpandir, alturaBarras = 160, ajustarAlAncho = false }) {
    const [escala, setEscala] = useState('semana');
    const [productos, setProductos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const cargarDatos = async () => {
            setCargando(true);
            setError('');
            try {
                const { desde, hasta } = calcularRangoFechas(escala);
                const parametros = new URLSearchParams({ desde, hasta, limite: String(limite || 1000) });
                const respuesta = await fetch(`http://localhost:8080/api/venta/top-productos?${parametros}`);
                if (!respuesta.ok) {
                    throw new Error(`Error del servidor: ${respuesta.status}`);
                }
                setProductos(await respuesta.json());
            } catch (e) {
                console.error('Error al cargar productos más vendidos:', e);
                setError('No se pudo cargar el gráfico de productos vendidos.');
            } finally {
                setCargando(false);
            }
        };

        cargarDatos();
    }, [escala, limite]);

    const cantidadMaxima = productos.reduce((max, p) => Math.max(max, p.cantidadVendida), 0) || 1;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                <h4 style={{ margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}><HiOutlineChartBar /> Productos más vendidos</h4>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <ToggleEscalaTiempo escala={escala} onCambiar={setEscala} />

                    {mostrarBotonExpandir && (
                        <button className="btn-global btn-secundario" onClick={onExpandir} style={{ fontSize: '0.85rem', padding: '6px 12px' }}>
                            Ver estadísticas →
                        </button>
                    )}
                </div>
            </div>

            {error && <p style={{ color: 'var(--danger)', fontSize: '0.9rem' }}>{error}</p>}

            {cargando ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Cargando...</p>
            ) : productos.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    No se vendieron productos en {escala === 'semana' ? 'la última semana' : 'el último mes'}.
                </p>
            ) : (
                <div style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: ajustarAlAncho ? '8px' : '16px',
                    justifyContent: ajustarAlAncho ? 'space-around' : 'flex-start',
                    height: `${alturaBarras + 50}px`,
                    padding: '0 5px',
                    overflowX: ajustarAlAncho ? 'hidden' : 'auto'
                }}>
                    {productos.map((p, i) => (
                        <div key={p.idProducto} style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
                            height: '100%',
                            ...(ajustarAlAncho ? { flex: '1 1 0', minWidth: 0 } : { minWidth: '60px' })
                        }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '4px' }}>
                                {p.cantidadVendida % 1 === 0 ? p.cantidadVendida : p.cantidadVendida.toFixed(1)}
                            </span>
                            <div style={{
                                width: ajustarAlAncho ? '70%' : '36px',
                                maxWidth: '36px',
                                height: `${Math.max(4, (p.cantidadVendida / cantidadMaxima) * alturaBarras)}px`,
                                backgroundColor: COLORES_BARRAS[i % COLORES_BARRAS.length],
                                borderRadius: '4px 4px 0 0'
                            }} />
                            <span style={{
                                fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize', marginTop: '6px',
                                textAlign: 'center', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                            }} title={p.nombre}>
                                {p.nombre}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default GraficoProductosVendidos;

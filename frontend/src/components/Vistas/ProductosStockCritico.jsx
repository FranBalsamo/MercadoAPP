import { useState, useEffect } from 'react';

const capitalizar = (texto) => texto ? texto.replace(/\b\w/g, (letra) => letra.toUpperCase()) : '';

function ProductosStockCritico({ limite = 6 }) {
    const [productos, setProductos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const cargarDatos = async () => {
            setCargando(true);
            setError('');
            try {
                const respuesta = await fetch(`http://localhost:8080/api/stock/estadisticas/stock-critico?limite=${limite}`);
                if (!respuesta.ok) {
                    throw new Error(`Error del servidor: ${respuesta.status}`);
                }
                setProductos(await respuesta.json());
            } catch (e) {
                console.error('Error al cargar productos con inventario crítico:', e);
                setError('No se pudo cargar el listado de inventario crítico.');
            } finally {
                setCargando(false);
            }
        };

        cargarDatos();
    }, [limite]);

    const maximo = productos.reduce((max, p) => Math.max(max, p.vecesAgotado), 0) || 1;

    return (
        <div>
            <h4 style={{ margin: '0 0 5px 0', color: '#2c3e50' }}>⚠️ Productos con inventario crítico recurrente</h4>
            <p style={{ margin: '0 0 15px 0', color: '#7f8c8d', fontSize: '0.85rem' }}>
                Cantidad de planillas cerradas en las que el producto terminó agotado (inventario disponible en 0).
            </p>

            {error && <p style={{ color: '#e74c3c', fontSize: '0.9rem' }}>{error}</p>}

            {cargando ? (
                <p style={{ textAlign: 'center', color: '#888', fontSize: '0.9rem' }}>Cargando...</p>
            ) : productos.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#888', fontSize: '0.9rem' }}>Ningún producto se quedó sin inventario todavía.</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {productos.map(p => (
                        <div key={p.idProducto} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{
                                width: '120px', fontSize: '0.85rem', color: '#2c3e50', textTransform: 'capitalize', flexShrink: 0,
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                            }} title={capitalizar(p.nombre)}>
                                {capitalizar(p.nombre)}
                            </span>
                            <div style={{ flexGrow: 1, backgroundColor: '#f4f6f8', borderRadius: '4px', overflow: 'hidden', height: '18px' }}>
                                <div style={{
                                    width: `${(p.vecesAgotado / maximo) * 100}%`,
                                    height: '100%',
                                    backgroundColor: '#e74c3c',
                                    borderRadius: '4px'
                                }} />
                            </div>
                            <strong style={{ fontSize: '0.85rem', color: '#c0392b', minWidth: '20px', textAlign: 'right' }}>{p.vecesAgotado}</strong>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default ProductosStockCritico;

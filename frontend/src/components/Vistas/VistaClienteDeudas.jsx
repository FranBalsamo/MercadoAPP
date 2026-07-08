import { useState, useEffect } from 'react';
import '../Estilos/Botones.css';

function VistaClienteDeudas({ cliente, volver }) {
    const [boletas, setBoletas] = useState([]);
    const [catalogoProductos, setCatalogoProductos] = useState([]);
    const [planillas, setPlanillas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const cargarDeudas = async () => {
            if (!cliente || !cliente.id) return;

            try {
                const [resBol, resProd, resPla] = await Promise.all([
                    fetch(`http://localhost:8080/api/boleta/cliente/${cliente.id}/deudas`),
                    fetch('http://localhost:8080/api/productos/All'),
                    fetch('http://localhost:8080/api/planilla/All')
                ]);

                if (!resBol.ok) {
                    throw new Error(`Error del servidor: ${resBol.status}`);
                }

                if (resProd.ok) setCatalogoProductos(await resProd.json());
                if (resPla.ok) setPlanillas(await resPla.json());

                const datosBoletas = await resBol.json();
                setBoletas(datosBoletas);
            } catch (e) {
                console.error("Error al cargar las deudas del cliente:", e);
                setError('Error al conectar con el servidor.');
            } finally {
                setCargando(false);
            }
        };

        cargarDeudas();
    }, [cliente]);

    if (!cliente) return <p>No se seleccionó ningún cliente...</p>;

    const nombreProducto = (id) => {
        const p = catalogoProductos.find(prod => String(prod.id) === String(id));
        return p ? p.nombre : `Prod #${id}`;
    };

    const fechaPlanilla = (id_planilla) => {
        const p = planillas.find(pla => String(pla.id) === String(id_planilla));
        return p ? p.fecha : '-';
    };

    const formatearMoneda = (val) => {
        return (val ?? 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
    };

    const boletasOrdenadas = [...boletas].sort((a, b) => {
        const fechaA = fechaPlanilla(a.id_planilla);
        const fechaB = fechaPlanilla(b.id_planilla);
        return fechaA < fechaB ? 1 : fechaA > fechaB ? -1 : 0;
    });

    const totalDeuda = boletas.reduce((acumulado, boleta) => acumulado + (boleta.total || 0), 0);

    return (
        <main style={{ padding: '20px', backgroundColor: '#f4f6f8', minHeight: 'calc(100vh - 70px)', display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* ENCABEZADO Y BOTÓN VOLVER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '15px 20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <div>
                    <h2 style={{ margin: 0, color: '#2c3e50', textTransform: 'capitalize' }}>💰 Deudas de {cliente.nombre}</h2>
                    <p style={{ margin: '5px 0 0 0', color: '#7f8c8d' }}>
                        CUIT/L: <strong>{cliente.documento}</strong>
                        {cliente.telefono ? <> | Tel: <strong>{cliente.telefono}</strong></> : null}
                        {cliente.direccion ? <> | Dirección: <strong>{cliente.direccion}</strong></> : null}
                    </p>
                </div>
                <button className="btn-global btn-secundario" onClick={volver} style={{ fontSize: '1rem' }}>
                    ← Volver a Clientes
                </button>
            </div>

            {error && <p style={{ color: '#e74c3c', fontWeight: 'bold', margin: 0 }}>{error}</p>}

            {/* CAJITA DE DEUDA TOTAL */}
            <div style={{ maxWidth: '300px', backgroundColor: 'white', padding: '15px', borderRadius: '8px', borderLeft: '5px solid #e74c3c', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <span style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>Deuda Total</span>
                <h3 style={{ margin: '5px 0 0 0', fontSize: '1.5rem', color: '#e74c3c' }}>
                    {formatearMoneda(totalDeuda)}
                </h3>
            </div>

            {/* LISTADO DE BOLETAS IMPAGAS */}
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', flexGrow: 1 }}>
                <h3 style={{ marginTop: 0, color: '#2c3e50', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                    🧾 Boletas Pendientes de Pago
                </h3>

                {cargando ? (
                    <p style={{ textAlign: 'center', color: '#888' }}>Cargando deudas...</p>
                ) : boletasOrdenadas.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#888', padding: '20px' }}>
                        Este cliente no tiene boletas pendientes de pago en planillas cerradas.
                    </p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
                        {boletasOrdenadas.map((boleta) => (
                            <div key={boleta.id} style={{ border: '1px solid #eee', borderRadius: '8px', padding: '15px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <span style={{ fontWeight: 'bold', color: '#2c3e50' }}>
                                        📅 Fecha: {fechaPlanilla(boleta.id_planilla)}
                                    </span>
                                    <span style={{ fontWeight: 'bold', fontSize: '1.05rem', color: '#c0392b' }}>
                                        {formatearMoneda(boleta.total)}
                                    </span>
                                </div>
                                <ul style={{ margin: 0, paddingLeft: '20px', listStyleType: 'square', color: '#34495e' }}>
                                    {(boleta.ventas || []).map((itemProd, i) => (
                                        <li key={i} style={{ marginBottom: '3px', textTransform: 'capitalize' }}>
                                            <strong>{itemProd.cantidad}x</strong> {nombreProducto(itemProd.id_producto)}
                                            <span style={{ color: '#7f8c8d', fontSize: '0.85rem' }}> (Precio: {formatearMoneda(itemProd.precio_unitario)})</span>
                                            <span style={{ color: '#7f8c8d', fontSize: '0.85rem' }}>
                                                {' '}- Vacío: {itemProd.precio_vacio > 0 ? formatearMoneda(itemProd.precio_vacio) : 'suelto'}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </main>
    );
}

export default VistaClienteDeudas;

import { useState, useEffect } from 'react';
import '../Estilos/Botones.css';

function VistaPlanillaCerrada({ planilla, volver }) {
    const [catalogoProductos, setCatalogoProductos] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [boletas, setBoletas] = useState([]);
    
    useEffect(() => {        
        cargarBoletas();
        cargarDatos();
        planilla.boleta = boletas;
    }, []);

    const cargarBoletas = async () => {
        try {
            const resBol = await fetch(`http://localhost:8080/api/boleta/planilla/${planilla.id}`)
            if (resBol.ok) setBoletas(await resBol.json());
            console.log("boletas encontradas: ", boletas);
            
        } catch (error) {
            console.log("Error al cargar las boletas en vista cerrada: ", error);
        }
    };

    const cargarDatos = async () => {
        try {
            // Traemos productos y clientes para traducir los IDs a nombres reales

            const [resProd, resCli] = await Promise.all([
                fetch(`http://localhost:8080/api/productos/All`),
                fetch(`http://localhost:8080/api/clientes/All`)
            ]);

            if (resProd.ok) setCatalogoProductos(await resProd.json());
            if (resCli.ok) setClientes(await resCli.json());
        } catch (error) {
            console.error("Error cargando catálogos en vista cerrada:", error);
        } finally {
            setCargando(false);
        }
    };


    if (!planilla) return <p>No se seleccionó ninguna planilla...</p>;

    // Funciones traductoras
    const nombreCliente = (id) => {
        const c = clientes.find(cli => String(cli.id) === String(id));
        return c ? c.nombre : `Cliente #${id}`;
    };

    const nombreProducto = (id) => {
        const p = catalogoProductos.find(prod => String(prod.id) === String(id));
        return p ? p.nombre : `Prod #${id}`;
    };

    const formatearMoneda = (val) => {
        return (val ?? 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
    };

    return (
        <main style={{ padding: '20px', backgroundColor: '#f4f6f8', minHeight: 'calc(100vh - 70px)', display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* ENCABEZADO Y BOTÓN VOLVER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '15px 20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <div>
                    <h2 style={{ margin: 0, color: '#2c3e50' }}>🔒 Resumen de Planilla Cerrada</h2>
                    <p style={{ margin: '5px 0 0 0', color: '#7f8c8d' }}>
                        Fecha: <strong>{planilla.fecha}</strong> | Estado: <span style={{ color: '#c0392b', fontWeight: 'bold' }}>{planilla.estadoPlanilla}</span>
                    </p>
                </div>
                <button className="btn-global btn-secundario" onClick={volver} style={{ fontSize: '1rem' }}>
                    ← Volver al Listado
                </button>
            </div>

            {/* SECCIÓN 1: MÉTRICAS Y STOCK SOBRANTE */}
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>

                {/* Cajita de Ingresos */}
                <div style={{ flex: 1, minWidth: '200px', backgroundColor: 'white', padding: '15px', borderRadius: '8px', borderLeft: '5px solid #27ae60', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <span style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>Ingresos Totales (Pagado)</span>
                    <h3 style={{ margin: '5px 0 0 0', fontSize: '1.5rem', color: '#27ae60' }}>
                        {formatearMoneda(planilla.ingresoTotal)}
                    </h3>
                </div>

                {/* Cajita de Deudas */}
                <div style={{ flex: 1, minWidth: '200px', backgroundColor: 'white', padding: '15px', borderRadius: '8px', borderLeft: '5px solid #e74c3c', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <span style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>Deudas Pendientes</span>
                    <h3 style={{ margin: '5px 0 0 0', fontSize: '1.5rem', color: '#e74c3c' }}>
                        {formatearMoneda(planilla.deudaTotal)}
                    </h3>
                </div>

                {/* Cajita de Stock Sobrante del Día */}
                <div style={{ flex: 2, minWidth: '300px', backgroundColor: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>📦 Stock que sobró al cierre del día</h4>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', maxHeight: '80px', overflowY: 'auto' }}>
                        {(planilla.stockProductos || []).map(item => {
                            const sobrante = item.stock - item.stock_vendido;
                            return (
                                <span key={item.id} style={{ backgroundColor: '#f0f3f4', padding: '4px 10px', borderRadius: '15px', fontSize: '0.85rem', fontWeight: '500', textTransform: 'capitalize' }}>
                                    {nombreProducto(item.id_producto)}: <strong style={{ color: sobrante > 0 ? '#27ae60' : '#e74c3c' }}>{sobrante} un.</strong>
                                </span>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* SECCIÓN 2: TABLA DETALLADA DE BOLETAS */}
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', flexGrow: 1 }}>
                <h3 style={{ marginTop: 0, color: '#2c3e50', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                    🧾 Detalle de Boletas Emitidas
                </h3>

                {cargando ? (
                    <p style={{ textAlign: 'center', color: '#888' }}>Cargando detalles...</p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
                            <thead style={{ backgroundColor: '#2c3e50', color: 'white' }}>
                                <tr>
                                    <th style={{ padding: '12px' }}>#</th>
                                    <th style={{ padding: '12px' }}>Cliente</th>
                                    <th style={{ padding: '12px' }}>Estado Pago</th>
                                    <th style={{ padding: '12px' }}>Estado Retiro</th>
                                    <th style={{ padding: '12px', width: '35%' }}>Productos Vendidos</th>
                                    <th style={{ padding: '12px', textAlign: 'right' }}>Total Boleta</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(!planilla.boletas || planilla.boletas.length === 0) ? (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                                            No se registraron boletas este día.
                                        </td>
                                    </tr>
                                ) : (
                                    planilla.boletas.map((boleta, idx) => (
                                        <tr key={boleta.id} style={{ borderBottom: '1px solid #eee', backgroundColor: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                                            <td style={{ padding: '12px', color: '#888', verticalAlign: 'top' }}>{boleta.id}</td>
                                            <td style={{ padding: '12px', fontWeight: 'bold', textTransform: 'capitalize', verticalAlign: 'top' }}>
                                                {nombreCliente(boleta.id_cliente)}
                                            </td>

                                            {/* Estado Pago */}
                                            <td style={{ padding: '12px', verticalAlign: 'top' }}>
                                                <span style={{
                                                    padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold',
                                                    backgroundColor: boleta.estadoPago === 'PAGADO' ? '#d4efdf' : '#fadbd8',
                                                    color: boleta.estadoPago === 'PAGADO' ? '#27ae60' : '#c0392b'
                                                }}>
                                                    {boleta.estadoPago}
                                                </span>
                                            </td>

                                            {/* Estado Retiro */}
                                            <td style={{ padding: '12px', verticalAlign: 'top' }}>
                                                <span style={{
                                                    padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold',
                                                    backgroundColor: boleta.estadoRetiro === 'RETIRADO' ? '#d6eaf8' : '#fadbd8',
                                                    color: boleta.estadoRetiro === 'RETIRADO' ? '#2980b9' : '#c0392b'
                                                }}>
                                                    {boleta.estadoRetiro}
                                                </span>
                                            </td>

                                            {/* Lista de Productos dentro de la boleta */}
                                            <td style={{ padding: '12px', verticalAlign: 'top' }}>
                                                <ul style={{ margin: 0, paddingLeft: '15px', listStyleType: 'square', color: '#34495e' }}>
                                                    {(boleta.detalles || boleta.productos || []).map((itemProd, i) => (
                                                        <li key={i} style={{ marginBottom: '3px', textTransform: 'capitalize' }}>
                                                            <strong>{itemProd.cantidad}x</strong> {nombreProducto(itemProd.id_producto)}
                                                            <span style={{ color: '#7f8c8d', fontSize: '0.85rem' }}> ({formatearMoneda(itemProd.precioUnitario)})</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </td>

                                            {/* Total */}
                                            <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', fontSize: '1.05rem', color: '#2c3e50', verticalAlign: 'top' }}>
                                                {formatearMoneda(boleta.total)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

        </main>
    );
}

export default VistaPlanillaCerrada;
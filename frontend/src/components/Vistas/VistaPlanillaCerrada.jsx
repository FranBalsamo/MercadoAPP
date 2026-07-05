import { useState, useEffect } from 'react';
import ModalModificarBoleta from '../Modals/ModalModificarBoleta';
import '../Estilos/Botones.css';

function VistaPlanillaCerrada({ planilla, volver }) {
    const [catalogoProductos, setCatalogoProductos] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [boletas, setBoletas] = useState([]);
    const [busquedaCliente, setBusquedaCliente] = useState('');
    const [filtroPago, setFiltroPago] = useState('');
    const [filtroRetiro, setFiltroRetiro] = useState('');
    const [configOrden, setConfigOrden] = useState({ columna: null, direccion: 'asc' });
    const [totalesPlanilla, setTotalesPlanilla] = useState({
        ingresoTotal: planilla?.ingresoTotal,
        deudaTotal: planilla?.deudaTotal,
        stockProductos: planilla?.stockProductos || []
    });
    const [boletaAEditar, setBoletaAEditar] = useState(null);
    const [mostrarModalEditar, setMostrarModalEditar] = useState(false);

    useEffect(() => {
        const cargarDatos = async () => {
            if (!planilla || !planilla.id) return;
            
            try {
                const [resProd, resCli, resBol] = await Promise.all([
                    fetch('http://localhost:8080/api/productos/All'),
                    fetch('http://localhost:8080/api/clientes/All'),
                    fetch(`http://localhost:8080/api/boleta/planilla/${planilla.id}`)
                ]);

                if (resProd.ok) setCatalogoProductos(await resProd.json());
                if (resCli.ok) setClientes(await resCli.json());
                if (resBol.ok) {
                    const datosBoletas = await resBol.json();
                    setBoletas(datosBoletas);
                    console.log("✅ Boletas cargadas para esta planilla:", datosBoletas);
                }
            } catch (error) {
                console.error("Error cargando datos en vista cerrada:", error);
            } finally {
                setCargando(false);
            }
        };
        
        cargarDatos();
    }, [planilla]);

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

    const refrescarTotalesPlanilla = async () => {
        try {
            const respuesta = await fetch(`http://localhost:8080/api/planilla/${planilla.id}`);
            if (respuesta.ok) {
                const planillaActualizada = await respuesta.json();
                setTotalesPlanilla({
                    ingresoTotal: planillaActualizada.ingresoTotal,
                    deudaTotal: planillaActualizada.deudaTotal,
                    stockProductos: planillaActualizada.stockProductos || []
                });
            }
        } catch (error) {
            console.error("Error al refrescar los totales de la planilla:", error);
        }
    };

    const abrirEdicionBoleta = (boleta) => {
        setBoletaAEditar(boleta);
        setMostrarModalEditar(true);
    };

    const handleBoletaEditada = async (boletaActualizada) => {
        if (boletaActualizada) {
            setBoletas(prevBoletas =>
                prevBoletas.map(b => b.id === boletaActualizada.id ? boletaActualizada : b)
            );
            await refrescarTotalesPlanilla();
        }
    };

    const solicitarOrden = (columna) => {
        let direccion = 'asc';
        if (configOrden.columna === columna && configOrden.direccion === 'asc') {
            direccion = 'desc';
        }
        setConfigOrden({ columna, direccion });
    };

    const obtenerIconoOrden = (columna) => {
        if (configOrden.columna !== columna) return ' ↕️';
        return configOrden.direccion === 'asc' ? ' ⬇️' : ' ⬆️';
    };

    const boletasProcesadas = boletas
        .filter((boleta) => {
            const coincideCliente = !busquedaCliente || nombreCliente(boleta.id_cliente).toLowerCase().includes(busquedaCliente.toLowerCase());
            const coincidePago = !filtroPago || boleta.estadoPago === filtroPago;
            const coincideRetiro = !filtroRetiro || boleta.estadoRetiro === filtroRetiro;
            return coincideCliente && coincidePago && coincideRetiro;
        })
        .sort((a, b) => {
            if (!configOrden.columna) return 0;

            if (configOrden.columna === 'cliente') {
                const nombreA = nombreCliente(a.id_cliente).toLowerCase();
                const nombreB = nombreCliente(b.id_cliente).toLowerCase();
                return configOrden.direccion === 'asc'
                    ? nombreA.localeCompare(nombreB)
                    : nombreB.localeCompare(nombreA);
            }

            if (configOrden.columna === 'pago') {
                const pesoA = a.estadoPago === 'PAGADO' ? 1 : 0;
                const pesoB = b.estadoPago === 'PAGADO' ? 1 : 0;
                return configOrden.direccion === 'asc' ? pesoB - pesoA : pesoA - pesoB;
            }

            if (configOrden.columna === 'retiro') {
                const pesoA = a.estadoRetiro === 'RETIRADO' ? 1 : 0;
                const pesoB = b.estadoRetiro === 'RETIRADO' ? 1 : 0;
                return configOrden.direccion === 'asc' ? pesoB - pesoA : pesoA - pesoB;
            }

            return 0;
        });

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
                        {formatearMoneda(totalesPlanilla.ingresoTotal)}
                    </h3>
                </div>

                {/* Cajita de Deudas */}
                <div style={{ flex: 1, minWidth: '200px', backgroundColor: 'white', padding: '15px', borderRadius: '8px', borderLeft: '5px solid #e74c3c', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <span style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>Deudas Pendientes</span>
                    <h3 style={{ margin: '5px 0 0 0', fontSize: '1.5rem', color: '#e74c3c' }}>
                        {formatearMoneda(totalesPlanilla.deudaTotal)}
                    </h3>
                </div>

                {/* Cajita de Stock Sobrante del Día */}
                <div style={{ flex: 2, minWidth: '300px', backgroundColor: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>📦 Stock que sobró al cierre del día</h4>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', maxHeight: '80px', overflowY: 'auto' }}>
                        {(totalesPlanilla.stockProductos || []).map(item => {
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

                {/* FILTROS */}
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', margin: '15px 0' }}>
                    <input
                        type="text"
                        placeholder="Filtrar por cliente..."
                        value={busquedaCliente}
                        onChange={(e) => setBusquedaCliente(e.target.value)}
                        style={{ flex: 1, minWidth: '200px', border: '1px solid #ccc', borderRadius: '8px', padding: '8px 12px', outline: 'none', fontSize: '0.95rem' }}
                    />
                    <select
                        value={filtroPago}
                        onChange={(e) => setFiltroPago(e.target.value)}
                        style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '8px 12px', outline: 'none', fontSize: '0.95rem' }}
                    >
                        <option value="">Todos los pagos</option>
                        <option value="PAGADO">Pagado</option>
                        <option value="NO_PAGADO">No Pagado</option>
                    </select>
                    <select
                        value={filtroRetiro}
                        onChange={(e) => setFiltroRetiro(e.target.value)}
                        style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '8px 12px', outline: 'none', fontSize: '0.95rem' }}
                    >
                        <option value="">Todos los retiros</option>
                        <option value="RETIRADO">Retirado</option>
                        <option value="NO_RETIRADO">No Retirado</option>
                    </select>
                </div>

                {cargando ? (
                    <p style={{ textAlign: 'center', color: '#888' }}>Cargando detalles...</p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
                            <thead style={{ backgroundColor: '#2c3e50', color: 'white' }}>
                                <tr>
                                    <th
                                        onClick={() => solicitarOrden('cliente')}
                                        style={{ padding: '12px', cursor: 'pointer', userSelect: 'none' }}
                                        title="Ordenar por Cliente"
                                    >
                                        Cliente {obtenerIconoOrden('cliente')}
                                    </th>
                                    <th
                                        onClick={() => solicitarOrden('pago')}
                                        style={{ padding: '12px', cursor: 'pointer', userSelect: 'none' }}
                                        title="Ordenar por Estado de Pago"
                                    >
                                        Estado Pago {obtenerIconoOrden('pago')}
                                    </th>
                                    <th
                                        onClick={() => solicitarOrden('retiro')}
                                        style={{ padding: '12px', cursor: 'pointer', userSelect: 'none' }}
                                        title="Ordenar por Estado de Retiro"
                                    >
                                        Estado Retiro {obtenerIconoOrden('retiro')}
                                    </th>
                                    <th style={{ padding: '12px', width: '35%' }}>Productos Vendidos</th>
                                    <th style={{ padding: '12px', textAlign: 'right' }}>Total Boleta</th>
                                    <th style={{ padding: '12px', textAlign: 'center' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {boletasProcesadas.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                                            {boletas.length === 0
                                                ? "No se registraron boletas este día."
                                                : "No se encontró ninguna boleta con esos filtros."}
                                        </td>
                                    </tr>
                                ) : (
                                    boletasProcesadas.map((boleta, idx) => (
                                        <tr key={boleta.id} style={{ borderBottom: '1px solid #eee', backgroundColor: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
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
                                                    {(boleta.ventas || []).map((itemProd, i) => (
                                                        <li key={i} style={{ marginBottom: '3px', textTransform: 'capitalize' }}>
                                                            <strong>{itemProd.cantidad}x</strong> {nombreProducto(itemProd.id_producto)}
                                                            <span style={{ color: '#7f8c8d', fontSize: '0.85rem' }}> ({formatearMoneda(itemProd.precio_unitario)})</span>
                                                            <span style={{ color: '#7f8c8d', fontSize: '0.85rem' }}>
                                                                {' '}- Vacío: {itemProd.precio_vacio > 0 ? formatearMoneda(itemProd.precio_vacio) : 'suelto'}
                                                            </span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </td>

                                            {/* Total */}
                                            <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', fontSize: '1.05rem', color: '#2c3e50', verticalAlign: 'top' }}>
                                                {formatearMoneda(boleta.total)}
                                            </td>

                                            {/* Acciones */}
                                            <td style={{ padding: '12px', textAlign: 'center', verticalAlign: 'top' }}>
                                                <button
                                                    className="btn-global btn-primario"
                                                    onClick={() => abrirEdicionBoleta(boleta)}
                                                    style={{ fontSize: '0.85rem', padding: '4px 10px' }}
                                                    title="Editar Boleta"
                                                >
                                                    Editar
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {mostrarModalEditar && (
                <ModalModificarBoleta
                    boleta={boletaAEditar}
                    cliente={nombreCliente(boletaAEditar?.id_cliente)}
                    planilla={planilla}
                    catalogoProductos={catalogoProductos}
                    cerrarModal={() => {
                        setMostrarModalEditar(false);
                        setBoletaAEditar(null);
                    }}
                    onBoletaEditada={handleBoletaEditada}
                />
            )}

        </main>
    );
}

export default VistaPlanillaCerrada;
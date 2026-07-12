import { useState, useEffect } from 'react';
import ModalBuscarCliente from '../Modals/ModalBuscarCliente';
import '../Estilos/Botones.css';

const NOMBRES_FORMA_PAGO = {
    EFECTIVO: 'Efectivo',
    MERCADO_PAGO: 'Mercado Pago',
    TRANSFERENCIA_BANCARIA: 'Transferencia Bancaria',
    OTROS: 'Otros',
};

const formaPagoLegible = (boleta) => {
    if (boleta.estadoPago === 'NO_PAGADO') return '-';
    return NOMBRES_FORMA_PAGO[boleta.formaPago] || '-';
};

function VistaBuscarBoletas() {
    const [metodoFiltro, setMetodoFiltro] = useState('cliente');
    const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
    const [mostrarModalBuscarCliente, setMostrarModalBuscarCliente] = useState(false);
    const [desde, setDesde] = useState('');
    const [hasta, setHasta] = useState('');
    const [filtroPago, setFiltroPago] = useState('');
    const [filtroRetiro, setFiltroRetiro] = useState('');

    const [boletas, setBoletas] = useState([]);
    const [catalogoProductos, setCatalogoProductos] = useState([]);
    const [planillas, setPlanillas] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState('');
    const [busquedaRealizada, setBusquedaRealizada] = useState(false);

    useEffect(() => {
        const cargarCatalogos = async () => {
            try {
                const [resProd, resPla, resCli] = await Promise.all([
                    fetch('http://localhost:8080/api/productos/All'),
                    fetch('http://localhost:8080/api/planilla/All'),
                    fetch('http://localhost:8080/api/clientes/All'),
                ]);
                if (resProd.ok) setCatalogoProductos(await resProd.json());
                if (resPla.ok) setPlanillas(await resPla.json());
                if (resCli.ok) setClientes(await resCli.json());
            } catch (e) {
                console.error('Error al cargar catálogos:', e);
            }
        };
        cargarCatalogos();
    }, []);

    const nombreProducto = (id) => {
        const p = catalogoProductos.find(prod => String(prod.id) === String(id));
        return p ? p.nombre : `Prod #${id}`;
    };

    const nombreCliente = (id_cliente) => {
        const c = clientes.find(cliente => String(cliente.id) === String(id_cliente));
        return c ? c.nombre : `Cliente #${id_cliente}`;
    };

    const fechaPlanilla = (id_planilla) => {
        const p = planillas.find(pla => String(pla.id) === String(id_planilla));
        return p ? p.fecha : '-';
    };

    const formatearMoneda = (val) => (val ?? 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

    const buscarPorCliente = async (cliente) => {
        setCargando(true);
        setError('');
        setBusquedaRealizada(true);
        try {
            const respuesta = await fetch(`http://localhost:8080/api/boleta/cliente/${cliente.id}`);
            if (!respuesta.ok) throw new Error(`Error del servidor: ${respuesta.status}`);
            setBoletas(await respuesta.json());
        } catch (e) {
            console.error('Error al buscar boletas por cliente:', e);
            setError('No se pudieron cargar las boletas de este cliente.');
            setBoletas([]);
        } finally {
            setCargando(false);
        }
    };

    const buscarPorFecha = async () => {
        if (!desde || !hasta) {
            setError('Elegí una fecha de inicio y una de fin.');
            return;
        }
        if (desde > hasta) {
            setError('La fecha "desde" no puede ser posterior a la fecha "hasta".');
            return;
        }

        setCargando(true);
        setError('');
        setBusquedaRealizada(true);
        try {
            const parametros = new URLSearchParams({ desde, hasta });
            const respuesta = await fetch(`http://localhost:8080/api/boleta/buscar/fecha?${parametros}`);
            if (!respuesta.ok) throw new Error(`Error del servidor: ${respuesta.status}`);
            setBoletas(await respuesta.json());
        } catch (e) {
            console.error('Error al buscar boletas por fecha:', e);
            setError('No se pudieron cargar las boletas en ese rango de fechas.');
            setBoletas([]);
        } finally {
            setCargando(false);
        }
    };

    const handleClienteEncontrado = (cliente) => {
        setClienteSeleccionado(cliente);
        setMostrarModalBuscarCliente(false);
        buscarPorCliente(cliente);
    };

    const cambiarMetodoFiltro = (metodo) => {
        setMetodoFiltro(metodo);
        setBoletas([]);
        setBusquedaRealizada(false);
        setError('');
        setClienteSeleccionado(null);
        setDesde('');
        setHasta('');
        setFiltroPago('');
        setFiltroRetiro('');
    };

    const boletasFiltradas = boletas.filter(boleta =>
        (!filtroPago || boleta.estadoPago === filtroPago) &&
        (!filtroRetiro || boleta.estadoRetiro === filtroRetiro)
    );

    return (
        <main style={{ padding: '20px', backgroundColor: '#f4f6f8', minHeight: 'calc(100vh - 70px)', display: 'flex', flexDirection: 'column', gap: '20px' }}>

            <div style={{ backgroundColor: 'white', padding: '15px 20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <h2 style={{ margin: 0, color: '#2c3e50' }}>🔎 Buscar Boletas</h2>
            </div>

            {/* FILTROS */}
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '15px' }}>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                    <h4 style={{ margin: 0, color: '#2c3e50', fontSize: '1rem' }}>Filtrar por:</h4>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                        <input
                            type="radio"
                            name="metodoFiltroBoletas"
                            checked={metodoFiltro === 'cliente'}
                            onChange={() => cambiarMetodoFiltro('cliente')}
                        />
                        Cliente
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                        <input
                            type="radio"
                            name="metodoFiltroBoletas"
                            checked={metodoFiltro === 'fecha'}
                            onChange={() => cambiarMetodoFiltro('fecha')}
                        />
                        Rango de Fechas
                    </label>

                    <select
                        value={filtroPago}
                        onChange={(e) => setFiltroPago(e.target.value)}
                        style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '8px 12px', outline: 'none', fontSize: '0.95rem', marginLeft: 'auto' }}
                    >
                        <option value="">Todos los pagos</option>
                        <option value="PAGADO">Pagadas</option>
                        <option value="NO_PAGADO">No Pagadas</option>
                    </select>

                    <select
                        value={filtroRetiro}
                        onChange={(e) => setFiltroRetiro(e.target.value)}
                        style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '8px 12px', outline: 'none', fontSize: '0.95rem' }}
                    >
                        <option value="">Todos los retiros</option>
                        <option value="RETIRADO">Retiradas</option>
                        <option value="NO_RETIRADO">No Retiradas</option>
                    </select>
                </div>

                {metodoFiltro === 'cliente' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button className="btn-global btn-primario" onClick={() => setMostrarModalBuscarCliente(true)}>
                            {clienteSeleccionado ? 'Cambiar Cliente' : 'Seleccionar Cliente'}
                        </button>
                        {clienteSeleccionado && (
                            <span style={{ textTransform: 'capitalize', fontWeight: 'bold', color: '#2c3e50' }}>
                                {clienteSeleccionado.nombre}
                            </span>
                        )}
                    </div>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
                        <div className="form-group">
                            <label>Desde:</label>
                            <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>Hasta:</label>
                            <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
                        </div>
                        <button className="btn-global btn-primario" onClick={buscarPorFecha} style={{ height: 'fit-content' }}>
                            Buscar
                        </button>
                    </div>
                )}

                {error && <p style={{ color: '#e74c3c', fontWeight: 'bold', margin: 0, fontSize: '0.9rem' }}>{error}</p>}
            </div>

            {/* RESULTADOS */}
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', flexGrow: 1 }}>
                <h3 style={{ marginTop: 0, color: '#2c3e50', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                    🧾 Boletas Encontradas
                </h3>

                {cargando ? (
                    <p style={{ textAlign: 'center', color: '#888' }}>Buscando...</p>
                ) : !busquedaRealizada ? (
                    <p style={{ textAlign: 'center', color: '#888', padding: '20px' }}>
                        Elegí un cliente o un rango de fechas para empezar a buscar.
                    </p>
                ) : boletasFiltradas.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#888', padding: '20px' }}>
                        No se encontraron boletas con esos filtros.
                    </p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
                            <thead style={{ backgroundColor: '#2c3e50', color: 'white' }}>
                                <tr>
                                    <th style={{ padding: '12px' }}>Fecha</th>
                                    <th style={{ padding: '12px' }}>Cliente</th>
                                    <th style={{ padding: '12px' }}>Estado Pago</th>
                                    <th style={{ padding: '12px' }}>Estado Retiro</th>
                                    <th style={{ padding: '12px' }}>Forma de Pago</th>
                                    <th style={{ padding: '12px', width: '30%' }}>Productos Vendidos</th>
                                    <th style={{ padding: '12px', textAlign: 'right' }}>Total Boleta</th>
                                </tr>
                            </thead>
                            <tbody>
                                {boletasFiltradas.map((boleta, idx) => (
                                    <tr key={boleta.id} style={{ borderBottom: '1px solid #eee', backgroundColor: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                                        <td style={{ padding: '12px', verticalAlign: 'top', fontWeight: 'bold', color: '#2c3e50' }}>
                                            {fechaPlanilla(boleta.id_planilla)}
                                        </td>
                                        <td style={{ padding: '12px', verticalAlign: 'top', fontWeight: 'bold', textTransform: 'capitalize' }}>
                                            {nombreCliente(boleta.id_cliente)}
                                        </td>
                                        <td style={{ padding: '12px', verticalAlign: 'top' }}>
                                            <span style={{
                                                padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold',
                                                backgroundColor: boleta.estadoPago === 'PAGADO' ? '#d4efdf' : '#fadbd8',
                                                color: boleta.estadoPago === 'PAGADO' ? '#27ae60' : '#c0392b'
                                            }}>
                                                {boleta.estadoPago}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px', verticalAlign: 'top' }}>
                                            <span style={{
                                                padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold',
                                                backgroundColor: boleta.estadoRetiro === 'RETIRADO' ? '#d6eaf8' : '#fadbd8',
                                                color: boleta.estadoRetiro === 'RETIRADO' ? '#2980b9' : '#c0392b'
                                            }}>
                                                {boleta.estadoRetiro}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px', verticalAlign: 'top', fontSize: '0.9rem', color: '#2c3e50' }}>
                                            {formaPagoLegible(boleta)}
                                        </td>
                                        <td style={{ padding: '12px', verticalAlign: 'top' }}>
                                            <ul style={{ margin: 0, paddingLeft: '15px', listStyleType: 'square', color: '#34495e' }}>
                                                {(boleta.ventas || []).map((itemProd, i) => (
                                                    <li key={i} style={{ marginBottom: '3px', textTransform: 'capitalize' }}>
                                                        <strong>{itemProd.cantidad}x</strong> {nombreProducto(itemProd.id_producto)}
                                                        <span style={{ color: '#7f8c8d', fontSize: '0.85rem' }}> ({formatearMoneda(itemProd.precio_unitario)} c/u)</span>
                                                        <span style={{ color: '#7f8c8d', fontSize: '0.85rem' }}>
                                                            {' '}- Vacío: {itemProd.precio_vacio > 0 ? formatearMoneda(itemProd.precio_vacio) : 'Sin Vacio'}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', fontSize: '1.05rem', color: '#2c3e50', verticalAlign: 'top' }}>
                                            {formatearMoneda(boleta.total)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {mostrarModalBuscarCliente && (
                <ModalBuscarCliente
                    cerrarModal={() => setMostrarModalBuscarCliente(false)}
                    onClienteEncontrado={handleClienteEncontrado}
                />
            )}

        </main>
    );
}

export default VistaBuscarBoletas;

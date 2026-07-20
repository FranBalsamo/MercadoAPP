import { useState, useEffect } from 'react';
import ModalBuscarCliente from '../Modals/ModalBuscarCliente';
import ModalVerCobro from '../Modals/ModalVerCobro';
import ModalVerBoleta from '../Modals/ModalVerBoleta';
import { formatearFechaVisual } from '../../utils/formatoFecha';
import { HiOutlineBanknotes, HiOutlineMagnifyingGlass } from 'react-icons/hi2';
import SelectorFecha from '../UI/SelectorFecha';
import '../Estilos/Botones.css';
import '../Estilos/Formularios.css';

const NOMBRES_FORMA_PAGO = {
    EFECTIVO: 'Efectivo',
    MERCADO_PAGO: 'Mercado Pago',
    TRANSFERENCIA_BANCARIA: 'Transferencia Bancaria',
    OTROS: 'Otros',
};

function VistaBuscarOperaciones() {
    const [metodoFiltro, setMetodoFiltro] = useState('cliente');
    const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
    const [mostrarModalBuscarCliente, setMostrarModalBuscarCliente] = useState(false);
    const [desde, setDesde] = useState('');
    const [hasta, setHasta] = useState('');

    const [cobros, setCobros] = useState([]);
    const [planillas, setPlanillas] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [catalogoProductos, setCatalogoProductos] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState('');
    const [busquedaRealizada, setBusquedaRealizada] = useState(false);
    const [cobroAVer, setCobroAVer] = useState(null);
    const [boletaAVer, setBoletaAVer] = useState(null);

    useEffect(() => {
        const cargarCatalogos = async () => {
            try {
                const [resPla, resCli, resProd] = await Promise.all([
                    fetch('http://localhost:8080/api/planilla/All'),
                    fetch('http://localhost:8080/api/clientes/All'),
                    fetch('http://localhost:8080/api/productos/All'),
                ]);
                if (resPla.ok) setPlanillas(await resPla.json());
                if (resCli.ok) setClientes(await resCli.json());
                if (resProd.ok) setCatalogoProductos(await resProd.json());
            } catch (e) {
                console.error('Error al cargar catálogos:', e);
            }
        };
        cargarCatalogos();
    }, []);

    const nombreCliente = (id_cliente) => {
        const c = clientes.find(cliente => String(cliente.id) === String(id_cliente));
        return c ? c.nombre : `Cliente #${id_cliente}`;
    };

    const nombreProducto = (id_producto) => {
        const p = catalogoProductos.find(prod => String(prod.id) === String(id_producto));
        return p ? p.nombre : `Prod #${id_producto}`;
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
            const respuesta = await fetch(`http://localhost:8080/api/cobro/cliente/${cliente.id}`);
            if (!respuesta.ok) throw new Error(`Error del servidor: ${respuesta.status}`);
            setCobros(await respuesta.json());
        } catch (e) {
            console.error('Error al buscar operaciones por cliente:', e);
            setError('No se pudieron cargar las operaciones de este cliente.');
            setCobros([]);
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
            const respuesta = await fetch(`http://localhost:8080/api/cobro/buscar/fecha?${parametros}`);
            if (!respuesta.ok) throw new Error(`Error del servidor: ${respuesta.status}`);
            setCobros(await respuesta.json());
        } catch (e) {
            console.error('Error al buscar operaciones por fecha:', e);
            setError('No se pudieron cargar las operaciones en ese rango de fechas.');
            setCobros([]);
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
        setCobros([]);
        setBusquedaRealizada(false);
        setError('');
        setClienteSeleccionado(null);
        setDesde('');
        setHasta('');
    };

    const cobrosOrdenados = [...cobros].sort((a, b) => {
        return a.fecha === b.fecha ? 0 : (a.fecha < b.fecha ? 1 : -1); // más reciente primero
    });

    return (
        <main style={{ padding: '20px', backgroundColor: 'var(--bg)', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '20px' }}>

            <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', padding: '15px 20px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
                <h2 style={{ margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}><HiOutlineMagnifyingGlass /> Buscar Operaciones</h2>
            </div>

            {/* FILTROS */}
            <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', padding: '20px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: '15px' }}>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                    <h4 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1rem' }}>Filtrar por:</h4>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                        <input
                            type="radio"
                            className="radio-personalizado"
                            name="metodoFiltroOperaciones"
                            checked={metodoFiltro === 'cliente'}
                            onChange={() => cambiarMetodoFiltro('cliente')}
                        />
                        Cliente
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                        <input
                            type="radio"
                            className="radio-personalizado"
                            name="metodoFiltroOperaciones"
                            checked={metodoFiltro === 'fecha'}
                            onChange={() => cambiarMetodoFiltro('fecha')}
                        />
                        Rango de Fechas
                    </label>
                </div>

                {metodoFiltro === 'cliente' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button className="btn-global btn-primario" onClick={() => setMostrarModalBuscarCliente(true)}>
                            {clienteSeleccionado ? 'Cambiar Cliente' : 'Seleccionar Cliente'}
                        </button>
                        {clienteSeleccionado && (
                            <span style={{ textTransform: 'capitalize', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                {clienteSeleccionado.nombre}
                            </span>
                        )}
                    </div>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
                        <div className="form-group">
                            <label>Rango de fechas:</label>
                            <SelectorFecha
                                desde={desde}
                                hasta={hasta}
                                onCambiar={({ desde: d, hasta: h }) => { setDesde(d); setHasta(h); }}
                                style={{ width: '260px' }}
                            />
                        </div>
                        <button className="btn-global btn-primario" onClick={buscarPorFecha} style={{ height: 'fit-content' }}>
                            Buscar
                        </button>
                    </div>
                )}

                {error && <p style={{ color: 'var(--danger)', fontWeight: 'bold', margin: 0, fontSize: '0.9rem' }}>{error}</p>}
            </div>

            {/* RESULTADOS */}
            <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', padding: '20px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ marginTop: 0, color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <HiOutlineBanknotes /> Operaciones Encontradas
                </h3>

                {cargando ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Buscando...</p>
                ) : !busquedaRealizada ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
                        Elegí un cliente o un rango de fechas para empezar a buscar.
                    </p>
                ) : cobrosOrdenados.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
                        No se encontraron operaciones con esos filtros.
                    </p>
                ) : (
                    <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                        <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
                            <thead style={{ backgroundColor: 'var(--surface-inverse)', color: 'var(--text-on-inverse)', position: 'sticky', top: 0, zIndex: 1 }}>
                                <tr>
                                    <th style={{ padding: '12px', width: '110px' }}>Fecha</th>
                                    <th style={{ padding: '12px' }}>Cliente</th>
                                    <th style={{ padding: '12px' }}>Tipo de Operación</th>
                                    <th style={{ padding: '12px' }}>Forma de Pago</th>
                                    <th style={{ padding: '12px', textAlign: 'right' }}>Monto Ingresado</th>
                                    <th style={{ padding: '12px', textAlign: 'right' }}>Deuda Pagada</th>
                                    <th style={{ padding: '12px', textAlign: 'center', width: '120px' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cobrosOrdenados.map((cobro, idx) => {
                                    const esAporteACuenta = cobro.montoTotalBoletas <= 0;
                                    return (
                                        <tr key={cobro.id} style={{ borderBottom: '1px solid var(--border)', backgroundColor: idx % 2 === 0 ? 'var(--surface)' : 'var(--surface-2)' }}>
                                            <td style={{ padding: '12px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                                {formatearFechaVisual(cobro.fecha)}
                                            </td>
                                            <td style={{ padding: '12px', fontWeight: 'bold', textTransform: 'capitalize', color: 'var(--text-primary)' }}>
                                                {nombreCliente(cobro.id_cliente)}
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                <span style={{
                                                    padding: '4px 8px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 'bold',
                                                    backgroundColor: esAporteACuenta ? 'var(--warning-soft)' : 'var(--success-soft)',
                                                    color: esAporteACuenta ? 'var(--warning-soft-text)' : 'var(--success-soft-text)'
                                                }}>
                                                    {esAporteACuenta ? 'Aporte a cuenta' : 'Pago de deuda'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                                                {NOMBRES_FORMA_PAGO[cobro.formaPago] || '-'}
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                                {formatearMoneda(cobro.montoEntregado)}
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: 'var(--success)' }}>
                                                {formatearMoneda(cobro.montoTotalBoletas)}
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                <button
                                                    className="btn-global btn-secundario"
                                                    onClick={() => setCobroAVer(cobro)}
                                                    style={{ fontSize: '0.85rem', padding: '4px 10px' }}
                                                >
                                                    Ver más
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
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

            {cobroAVer && (
                <ModalVerCobro
                    cobro={cobroAVer}
                    nombreCliente={nombreCliente(cobroAVer.id_cliente)}
                    fechaPlanilla={fechaPlanilla}
                    formatearMoneda={formatearMoneda}
                    formatearFecha={formatearFechaVisual}
                    cerrarModal={() => setCobroAVer(null)}
                    onVerBoleta={(boleta) => setBoletaAVer(boleta)}
                />
            )}

            {boletaAVer && (
                <ModalVerBoleta
                    boleta={boletaAVer}
                    nombreCliente={nombreCliente(boletaAVer.id_cliente)}
                    nombreProducto={nombreProducto}
                    formatearMoneda={formatearMoneda}
                    fecha={formatearFechaVisual(fechaPlanilla(boletaAVer.id_planilla))}
                    cerrarModal={() => setBoletaAVer(null)}
                />
            )}

        </main>
    );
}

export default VistaBuscarOperaciones;

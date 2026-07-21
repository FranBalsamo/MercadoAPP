import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import ModalBuscarCliente from '../Modals/ModalBuscarCliente';
import ModalVerCobro from '../Modals/ModalVerCobro';
import ModalVerBoleta from '../Modals/ModalVerBoleta';
import { formatearFechaVisual } from '../../utils/formatoFecha';
import { HiOutlineBanknotes, HiOutlineMagnifyingGlass } from 'react-icons/hi2';
import SelectorFecha from '../UI/SelectorFecha';
import Paginador from '../UI/Paginador';
import '../Estilos/Botones.css';
import '../Estilos/Formularios.css';

const TAMANIO_PAGINA = 50;

const NOMBRES_FORMA_PAGO = {
    EFECTIVO: 'Efectivo',
    MERCADO_PAGO: 'Mercado Pago',
    TRANSFERENCIA_BANCARIA: 'Transferencia Bancaria',
    OTROS: 'Otros',
};

const formatearMoneda = (val) => (val ?? 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

// Fila memoizada (mismo patron que FilaBoleta en VistaBuscarBoletas): evita re-renderizar
// las filas de la pagina cuando solo cambia un estado ajeno (ej. abrir un modal).
const FilaCobro = memo(function FilaCobro({ cobro, idx, nombreCliente, onVerMas }) {
    const esAporteACuenta = cobro.montoTotalBoletas <= 0;
    return (
        <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: idx % 2 === 0 ? 'var(--surface)' : 'var(--surface-2)' }}>
            <td style={{ padding: '12px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                {formatearFechaVisual(cobro.fecha)}
            </td>
            <td style={{ padding: '12px', fontWeight: 'bold', textTransform: 'capitalize', color: 'var(--text-primary)' }}>
                {nombreCliente}
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
                    onClick={() => onVerMas(cobro)}
                    style={{ fontSize: '0.85rem', padding: '4px 10px' }}
                >
                    Ver más
                </button>
            </td>
        </tr>
    );
});

function VistaBuscarOperaciones() {
    const [metodoFiltro, setMetodoFiltro] = useState('cliente');
    const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
    const [mostrarModalBuscarCliente, setMostrarModalBuscarCliente] = useState(false);
    const [desde, setDesde] = useState('');
    const [hasta, setHasta] = useState('');

    const [cobros, setCobros] = useState([]);
    const [pagina, setPagina] = useState(0);
    const [totalPaginas, setTotalPaginas] = useState(0);
    const [totalElementos, setTotalElementos] = useState(0);
    const [busquedaActiva, setBusquedaActiva] = useState(null);

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

    // Mapas en vez de un .find() (O(n)) por fila en cada render: busqueda O(1) por id.
    const mapaClientes = useMemo(() => new Map(clientes.map((c) => [String(c.id), c])), [clientes]);
    const mapaProductos = useMemo(() => new Map(catalogoProductos.map((p) => [String(p.id), p])), [catalogoProductos]);
    const mapaPlanillas = useMemo(() => new Map(planillas.map((p) => [String(p.id), p])), [planillas]);

    const nombreCliente = (id_cliente) => mapaClientes.get(String(id_cliente))?.nombre || `Cliente #${id_cliente}`;
    const nombreProducto = (id_producto) => mapaProductos.get(String(id_producto))?.nombre || `Prod #${id_producto}`;
    const fechaPlanilla = (id_planilla) => mapaPlanillas.get(String(id_planilla))?.fecha || '-';

    const ejecutarBusqueda = async (descriptor, paginaSolicitada) => {
        setCargando(true);
        setError('');
        try {
            const params = new URLSearchParams({ page: String(paginaSolicitada), size: String(TAMANIO_PAGINA) });
            let url;
            if (descriptor.tipo === 'cliente') {
                url = `http://localhost:8080/api/cobro/cliente/${descriptor.cliente.id}/paginado?${params}`;
            } else {
                params.set('desde', descriptor.desde);
                params.set('hasta', descriptor.hasta);
                url = `http://localhost:8080/api/cobro/buscar/fecha/paginado?${params}`;
            }

            const respuesta = await fetch(url);
            if (!respuesta.ok) throw new Error(`Error del servidor: ${respuesta.status}`);
            const data = await respuesta.json();

            setCobros(Array.isArray(data.content) ? data.content : []);
            setTotalPaginas(data.totalPages ?? 0);
            setTotalElementos(data.totalElements ?? 0);
            setPagina(paginaSolicitada);
            setBusquedaActiva(descriptor);
        } catch (e) {
            console.error('Error al buscar operaciones:', e);
            setError('No se pudieron cargar las operaciones.');
            setCobros([]);
        } finally {
            setCargando(false);
        }
    };

    const buscarPorCliente = (cliente) => {
        setBusquedaRealizada(true);
        ejecutarBusqueda({ tipo: 'cliente', cliente }, 0);
    };

    const buscarPorFecha = () => {
        if (!desde || !hasta) {
            setError('Elegí una fecha de inicio y una de fin.');
            return;
        }
        if (desde > hasta) {
            setError('La fecha "desde" no puede ser posterior a la fecha "hasta".');
            return;
        }
        setBusquedaRealizada(true);
        ejecutarBusqueda({ tipo: 'fecha', desde, hasta }, 0);
    };

    const cambiarPagina = (nuevaPagina) => {
        if (busquedaActiva) ejecutarBusqueda(busquedaActiva, nuevaPagina);
    };

    const handleClienteEncontrado = (cliente) => {
        setClienteSeleccionado(cliente);
        setMostrarModalBuscarCliente(false);
        buscarPorCliente(cliente);
    };

    const cambiarMetodoFiltro = (metodo) => {
        setMetodoFiltro(metodo);
        setCobros([]);
        setPagina(0);
        setTotalPaginas(0);
        setTotalElementos(0);
        setBusquedaActiva(null);
        setBusquedaRealizada(false);
        setError('');
        setClienteSeleccionado(null);
        setDesde('');
        setHasta('');
    };

    const abrirVerCobro = useCallback((cobro) => setCobroAVer(cobro), []);

    // La API ya devuelve la pagina ordenada por fecha desc; solo se re-ordena si llegara
    // a haber empates que el backend no desempata (edge case, bajo costo).
    const cobrosOrdenados = useMemo(() => {
        return [...cobros].sort((a, b) => (a.fecha === b.fecha ? 0 : (a.fecha < b.fecha ? 1 : -1)));
    }, [cobros]);

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
                    <>
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
                                {cobrosOrdenados.map((cobro, idx) => (
                                    <FilaCobro
                                        key={cobro.id}
                                        cobro={cobro}
                                        idx={idx}
                                        nombreCliente={nombreCliente(cobro.id_cliente)}
                                        onVerMas={abrirVerCobro}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <Paginador
                        pagina={pagina}
                        totalPaginas={totalPaginas}
                        totalElementos={totalElementos}
                        onCambiarPagina={cambiarPagina}
                        cargando={cargando}
                    />
                    </>
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

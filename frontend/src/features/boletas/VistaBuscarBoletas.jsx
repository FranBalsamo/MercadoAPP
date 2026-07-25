import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import ModalBuscarCliente from '@/features/clientes/ModalBuscarCliente';
import ModalVerBoleta from './ModalVerBoleta';
import ModalModificarBoleta from './ModalModificarBoleta';
import { formatearFechaVisual } from '@/shared/utils/formatoFecha';
import { HiOutlineMagnifyingGlass, HiOutlineTicket } from 'react-icons/hi2';
import SelectPersonalizado from '@/shared/ui/SelectPersonalizado';
import SelectorFecha from '@/shared/ui/SelectorFecha';
import MenuAccionesInline from '@/shared/ui/MenuAccionesInline';
import Paginador from '@/shared/ui/Paginador';
import '@/shared/styles/Botones.css';
import '@/shared/styles/Formularios.css';
import MensajeError from '@/shared/ui/MensajeError';

const TAMANIO_PAGINA = 50;

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

// Funcion pura (no depende de props/estado): se define afuera del componente para que
// tenga identidad estable entre renders, en vez de recrearse cada vez.
const formatearMoneda = (val) => (val ?? 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

// Fila memoizada: al pasarle solo props primitivas/datos ya resueltos (nada de funciones
// recreadas en cada render del padre, salvo las que son estables via useCallback/setState),
// React.memo puede saltear el re-render de una fila cuando el mouse pasa por OTRA fila
// (evita que el hover de una tabla larga re-renderice todas las filas en cada scroll).
const FilaBoleta = memo(function FilaBoleta({ boleta, idx, resaltada, onHoverStart, onHoverEnd, onVer, onModificar }) {
    return (
        <tr
            style={{ borderBottom: '1px solid var(--border)', backgroundColor: idx % 2 === 0 ? 'var(--surface)' : 'var(--surface-2)' }}
            onMouseEnter={() => onHoverStart(boleta.id)}
            onMouseLeave={onHoverEnd}
        >
            <td style={{ padding: '12px', verticalAlign: 'top', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                {formatearFechaVisual(boleta._fecha)}
            </td>
            <td style={{ padding: '12px', verticalAlign: 'top', fontWeight: 'bold', textTransform: 'capitalize', color: 'var(--text-primary)' }}>
                {boleta._nombreCliente}
            </td>
            <td style={{ padding: '12px', verticalAlign: 'top' }}>
                <span style={{
                    padding: '4px 8px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 'bold',
                    backgroundColor: boleta.estadoPago === 'PAGADO' ? 'var(--success-soft)' : 'var(--danger-soft)',
                    color: boleta.estadoPago === 'PAGADO' ? 'var(--success-soft-text)' : 'var(--danger-soft-text)'
                }}>
                    {boleta.estadoPago}
                </span>
            </td>
            <td style={{ padding: '12px', verticalAlign: 'top' }}>
                <span style={{
                    padding: '4px 8px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 'bold',
                    backgroundColor: boleta.estadoEntrega === 'ENTREGADO' ? 'var(--success-soft)' : boleta.estadoEntrega === 'PARCIAL' ? 'var(--warning-soft)' : 'var(--danger-soft)',
                    color: boleta.estadoEntrega === 'ENTREGADO' ? 'var(--success-soft-text)' : boleta.estadoEntrega === 'PARCIAL' ? 'var(--warning-soft-text)' : 'var(--danger-soft-text)'
                }}>
                    {boleta.estadoEntrega}
                </span>
            </td>
            <td style={{ padding: '12px', verticalAlign: 'top', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                {formaPagoLegible(boleta)}
            </td>
            <td style={{ padding: '12px', verticalAlign: 'top' }}>
                <ul style={{ margin: 0, paddingLeft: '15px', listStyleType: 'square', color: 'var(--text-secondary)' }}>
                    {boleta._ventasConNombre.map((itemProd, i) => (
                        <li key={i} style={{ marginBottom: '3px', textTransform: 'capitalize' }}>
                            <strong>{itemProd.cantidad}x</strong> {itemProd._nombreProducto}
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}> ({formatearMoneda(itemProd.precio_unitario)} c/u)</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                {' '}- Vacío: {itemProd.precio_vacio > 0 ? formatearMoneda(itemProd.precio_vacio) : 'Sin Vacio'}
                            </span>
                        </li>
                    ))}
                </ul>
            </td>
            <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', fontSize: '1.05rem', color: 'var(--text-primary)', verticalAlign: 'top' }}>
                {formatearMoneda(boleta.total)}
            </td>
            <td style={{ padding: '12px', textAlign: 'center', verticalAlign: 'top' }}>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <MenuAccionesInline
                        mostrarPorHover={resaltada}
                        acciones={[
                            { label: 'Ver', onClick: () => onVer(boleta) },
                            { label: 'Modificar', onClick: () => onModificar(boleta), variante: 'primario' },
                        ]}
                    />
                </div>
            </td>
        </tr>
    );
});

function VistaBuscarBoletas() {
    const [metodoFiltro, setMetodoFiltro] = useState('cliente');
    const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
    const [mostrarModalBuscarCliente, setMostrarModalBuscarCliente] = useState(false);
    const [desde, setDesde] = useState('');
    const [hasta, setHasta] = useState('');
    const [filtroPago, setFiltroPago] = useState('');
    const [filtroEntrega, setFiltroEntrega] = useState('');

    const [boletas, setBoletas] = useState([]);
    const [pagina, setPagina] = useState(0);
    const [totalPaginas, setTotalPaginas] = useState(0);
    const [totalElementos, setTotalElementos] = useState(0);
    // Que busqueda repetir al cambiar de pagina o de filtro pago/entrega (sin esto no hay forma
    // de saber si hay que re-pedir por cliente o por rango de fechas).
    const [busquedaActiva, setBusquedaActiva] = useState(null);
    const [catalogoProductos, setCatalogoProductos] = useState([]);
    const [planillas, setPlanillas] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState('');
    const [busquedaRealizada, setBusquedaRealizada] = useState(false);
    const [boletaAVer, setBoletaAVer] = useState(null);
    const [boletaAEditar, setBoletaAEditar] = useState(null);
    const [filaSobreCursor, setFilaSobreCursor] = useState(null);

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

    // Mapas en vez de repetir un .find() (O(n)) por cada boleta/producto en cada render:
    // con muchas boletas/clientes/productos, esto es una busqueda O(1) por id.
    const mapaClientes = useMemo(() => new Map(clientes.map((c) => [String(c.id), c])), [clientes]);
    const mapaProductos = useMemo(() => new Map(catalogoProductos.map((p) => [String(p.id), p])), [catalogoProductos]);
    const mapaPlanillas = useMemo(() => new Map(planillas.map((p) => [String(p.id), p])), [planillas]);

    const nombreProducto = (id) => mapaProductos.get(String(id))?.nombre || `Prod #${id}`;
    const nombreCliente = (id_cliente) => mapaClientes.get(String(id_cliente))?.nombre || `Cliente #${id_cliente}`;
    const fechaPlanilla = (id_planilla) => mapaPlanillas.get(String(id_planilla))?.fecha || '-';
    const planillaDeBoleta = (id_planilla) => mapaPlanillas.get(String(id_planilla));

    const handleBoletaEditada = (boletaActualizada) => {
        if (boletaActualizada) {
            setBoletas(prev => prev.map(b => b.id === boletaActualizada.id ? boletaActualizada : b));
        }
    };

    // Referencias estables (no se recrean en cada render) para que React.memo en FilaBoleta
    // pueda saltear el re-render de las filas no afectadas por un cambio de hover.
    const limpiarHover = useCallback(() => setFilaSobreCursor(null), []);

    // Recibe el descriptor de busqueda y los filtros pago/entrega como parametros explicitos
    // (no los lee del estado por closure) para no pisarlos con valores viejos: un setState
    // (ej. setFiltroPago) todavia no se reflejaria en el 'filtroPago' de esta funcion si se
    // llamara justo despues en el mismo evento.
    const ejecutarBusqueda = async (descriptor, paginaSolicitada, filtros) => {
        setCargando(true);
        setError('');
        try {
            const params = new URLSearchParams({ page: String(paginaSolicitada), size: String(TAMANIO_PAGINA) });
            if (filtros.estadoPago) params.set('estadoPago', filtros.estadoPago);
            if (filtros.estadoEntrega) params.set('estadoEntrega', filtros.estadoEntrega);

            let url;
            if (descriptor.tipo === 'cliente') {
                url = `http://localhost:8080/api/boleta/cliente/${descriptor.cliente.id}/paginado?${params}`;
            } else {
                params.set('desde', descriptor.desde);
                params.set('hasta', descriptor.hasta);
                url = `http://localhost:8080/api/boleta/buscar/fecha/paginado?${params}`;
            }

            const respuesta = await fetch(url);
            if (!respuesta.ok) throw new Error(`Error del servidor: ${respuesta.status}`);
            const data = await respuesta.json();

            setBoletas(Array.isArray(data.content) ? data.content : []);
            setTotalPaginas(data.totalPages ?? 0);
            setTotalElementos(data.totalElements ?? 0);
            setPagina(paginaSolicitada);
            setBusquedaActiva(descriptor);
        } catch (e) {
            console.error('Error al buscar boletas:', e);
            setError('No se pudieron cargar las boletas.');
            setBoletas([]);
        } finally {
            setCargando(false);
        }
    };

    const buscarPorCliente = (cliente) => {
        setBusquedaRealizada(true);
        ejecutarBusqueda({ tipo: 'cliente', cliente }, 0, { estadoPago: filtroPago, estadoEntrega: filtroEntrega });
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
        ejecutarBusqueda({ tipo: 'fecha', desde, hasta }, 0, { estadoPago: filtroPago, estadoEntrega: filtroEntrega });
    };

    const cambiarPagina = (nuevaPagina) => {
        if (!busquedaActiva) return;
        ejecutarBusqueda(busquedaActiva, nuevaPagina, { estadoPago: filtroPago, estadoEntrega: filtroEntrega });
    };

    const cambiarFiltroPago = (nuevoValor) => {
        setFiltroPago(nuevoValor);
        if (busquedaActiva) ejecutarBusqueda(busquedaActiva, 0, { estadoPago: nuevoValor, estadoEntrega: filtroEntrega });
    };

    const cambiarFiltroEntrega = (nuevoValor) => {
        setFiltroEntrega(nuevoValor);
        if (busquedaActiva) ejecutarBusqueda(busquedaActiva, 0, { estadoPago: filtroPago, estadoEntrega: nuevoValor });
    };

    const handleClienteEncontrado = (cliente) => {
        setClienteSeleccionado(cliente);
        setMostrarModalBuscarCliente(false);
        buscarPorCliente(cliente);
    };

    const cambiarMetodoFiltro = (metodo) => {
        setMetodoFiltro(metodo);
        setBoletas([]);
        setPagina(0);
        setTotalPaginas(0);
        setTotalElementos(0);
        setBusquedaActiva(null);
        setBusquedaRealizada(false);
        setError('');
        setClienteSeleccionado(null);
        setDesde('');
        setHasta('');
        setFiltroPago('');
        setFiltroEntrega('');
    };

    // Se recalcula solo cuando cambian los datos reales (antes se filtraba, ordenaba y
    // resolvian nombres de cliente/producto en CADA render, incluidos los que disparaba el
    // hover de una fila al scrollear con el mouse encima). El filtro por pago/entrega ahora
    // se hace en el servidor (junto con el paginado); aca solo se resuelve fecha/nombre de
    // cliente/nombres de producto UNA vez por boleta, y se ordena la pagina actual.
    const boletasProcesadas = useMemo(() => {
        return boletas
            .map(boleta => ({
                ...boleta,
                _fecha: fechaPlanilla(boleta.id_planilla),
                _nombreCliente: nombreCliente(boleta.id_cliente),
                _ventasConNombre: (boleta.ventas || []).map(v => ({ ...v, _nombreProducto: nombreProducto(v.id_producto) })),
            }))
            .sort((a, b) => (a._fecha === b._fecha ? 0 : (a._fecha < b._fecha ? 1 : -1))); // más reciente primero
    }, [boletas, mapaPlanillas, mapaClientes, mapaProductos]);

    return (
        <main style={{ padding: '20px', backgroundColor: 'var(--bg)', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '20px' }}>

            <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', padding: '15px 20px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
                <h2 style={{ margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}><HiOutlineMagnifyingGlass /> Buscar Boletas</h2>
            </div>

            {/* FILTROS */}
            <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', padding: '20px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: '15px' }}>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                    <h4 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1rem' }}>Filtrar por:</h4>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                        <input
                            type="radio"
                            className="radio-personalizado"
                            name="metodoFiltroBoletas"
                            checked={metodoFiltro === 'cliente'}
                            onChange={() => cambiarMetodoFiltro('cliente')}
                        />
                        Cliente
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                        <input
                            type="radio"
                            className="radio-personalizado"
                            name="metodoFiltroBoletas"
                            checked={metodoFiltro === 'fecha'}
                            onChange={() => cambiarMetodoFiltro('fecha')}
                        />
                        Rango de Fechas
                    </label>

                    <SelectPersonalizado
                        value={filtroPago}
                        onChange={(e) => cambiarFiltroPago(e.target.value)}
                        opciones={[
                            { value: '', label: 'Todos los pagos' },
                            { value: 'PAGADO', label: 'Pagadas' },
                            { value: 'NO_PAGADO', label: 'No Pagadas' },
                        ]}
                        style={{ marginLeft: 'auto', width: '160px' }}
                    />

                    <SelectPersonalizado
                        value={filtroEntrega}
                        onChange={(e) => cambiarFiltroEntrega(e.target.value)}
                        opciones={[
                            { value: '', label: 'Todas las entregas' },
                            { value: 'ENTREGADO', label: 'Entregadas' },
                            { value: 'PARCIAL', label: 'Entregas Parciales'},
                            { value: 'NO_ENTREGADO', label: 'No Entregadas' },
                        ]}
                        style={{ width: '190px' }}
                    />
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

                <MensajeError mensaje={error} />
            </div>

            {/* RESULTADOS */}
            <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', padding: '20px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ marginTop: 0, color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <HiOutlineTicket /> Boletas Encontradas
                </h3>

                {cargando ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Buscando...</p>
                ) : !busquedaRealizada ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
                        Elegí un cliente o un rango de fechas para empezar a buscar.
                    </p>
                ) : boletasProcesadas.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
                        No se encontraron boletas con esos filtros.
                    </p>
                ) : (
                    <>
                    <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
                            <thead style={{ backgroundColor: 'var(--surface-inverse)', color: 'var(--text-on-inverse)', position: 'sticky', top: 0, zIndex: 1 }}>
                                <tr>
                                    <th style={{ padding: '12px' }}>Fecha</th>
                                    <th style={{ padding: '12px' }}>Cliente</th>
                                    <th style={{ padding: '12px' }}>Estado Pago</th>
                                    <th style={{ padding: '12px' }}>Estado Entrega</th>
                                    <th style={{ padding: '12px' }}>Forma de Pago</th>
                                    <th style={{ padding: '12px', width: '30%' }}>Productos Vendidos</th>
                                    <th style={{ padding: '12px', textAlign: 'right' }}>Total Boleta</th>
                                    <th style={{ padding: '12px', textAlign: 'center', width: '170px' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {boletasProcesadas.map((boleta, idx) => (
                                    <FilaBoleta
                                        key={boleta.id}
                                        boleta={boleta}
                                        idx={idx}
                                        resaltada={filaSobreCursor === boleta.id}
                                        onHoverStart={setFilaSobreCursor}
                                        onHoverEnd={limpiarHover}
                                        onVer={setBoletaAVer}
                                        onModificar={setBoletaAEditar}
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

            {boletaAVer && (
                <ModalVerBoleta
                    boleta={boletaAVer}
                    nombreCliente={nombreCliente(boletaAVer.id_cliente)}
                    nombreProducto={nombreProducto}
                    formatearMoneda={formatearMoneda}
                    cerrarModal={() => setBoletaAVer(null)}
                />
            )}

            {boletaAEditar && (
                <ModalModificarBoleta
                    boleta={boletaAEditar}
                    cliente={nombreCliente(boletaAEditar.id_cliente)}
                    planilla={planillaDeBoleta(boletaAEditar.id_planilla)}
                    catalogoProductos={catalogoProductos}
                    cerrarModal={() => setBoletaAEditar(null)}
                    onBoletaEditada={(boletaActualizada) => {
                        handleBoletaEditada(boletaActualizada);
                        setBoletaAEditar(null);
                    }}
                />
            )}

        </main>
    );
}

export default VistaBuscarBoletas;

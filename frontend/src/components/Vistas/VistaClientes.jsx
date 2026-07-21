import { useState, useEffect, useCallback, useRef, memo } from 'react';
import ModalModificarCliente from '../Modals/ModalModificarCliente';
import ModalModificarSaldoCliente from '../Modals/ModalModificarSaldoCliente';
import { HiOutlineUsers } from 'react-icons/hi2';
import SelectPersonalizado from '@/shared/ui/SelectPersonalizado';
import MenuAccionesInline from '@/shared/ui/MenuAccionesInline';
import Paginador from '@/shared/ui/Paginador';
import '@/shared/styles/Botones.css';
import '@/shared/styles/Formularios.css';

const TAMANIO_PAGINA = 50;

const formatearMoneda = (val) => {
    return (val ?? 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
};

// Fila memoizada: React.memo evita re-renderizar las 20 filas de la pagina cuando solo
// cambia cual fila esta bajo el cursor (mismo patron que FilaBoleta en VistaBuscarBoletas).
const FilaCliente = memo(function FilaCliente({ cliente, resaltada, onHoverStart, onHoverEnd, onModificar, onModificarSaldo, onVerDeudas }) {
    return (
        <tr
            style={{ borderBottom: '1px solid var(--border)' }}
            onMouseEnter={() => onHoverStart(cliente.id)}
            onMouseLeave={onHoverEnd}
        >
            <td style={{ padding: '10px 15px', textTransform: 'capitalize', fontWeight: '500', color: 'var(--text-primary)' }}>
                {cliente.nombre}
            </td>
            <td style={{ padding: '10px 15px', color: 'var(--text-secondary)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 'bold' }}>
                    {cliente.tipoDocumento === 'CUIT_L' ? 'CUIT/L' : 'DNI'}
                </span>{' '}
                {cliente.documento}
            </td>
            <td style={{ padding: '10px 15px', color: 'var(--text-secondary)' }}>
                <span style={{
                    padding: '3px 8px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 'bold',
                    backgroundColor: cliente.tipoCliente === 'SUPERMERCADO' ? 'var(--info-soft)' : 'var(--surface-2)',
                    color: cliente.tipoCliente === 'SUPERMERCADO' ? 'var(--info-soft-text)' : 'var(--text-secondary)'
                }}>
                    {cliente.tipoCliente === 'SUPERMERCADO' ? 'Supermercado' : 'Persona'}
                </span>
            </td>
            <td style={{ padding: '10px 15px', textTransform: 'capitalize', fontWeight: '500', color: 'var(--text-secondary)' }}>
                {cliente.telefono || '-'}
            </td>
            <td style={{ padding: '10px 15px', textTransform: 'capitalize', fontWeight: '500', color: 'var(--text-secondary)' }}>
                {cliente.direcciones.length > 0 ? cliente.direcciones.join(', ') : '-'}
            </td>
            <td style={{ padding: '10px 15px', fontWeight: '500', color: cliente.saldo_a_favor > 0 ? 'var(--success)' : 'var(--text-primary)' }}>
                {formatearMoneda(cliente.saldo_a_favor)}
            </td>
            <td style={{ padding: '10px 15px', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <MenuAccionesInline
                        mostrarPorHover={resaltada}
                        acciones={[
                            { label: 'Modificar', onClick: () => onModificar(cliente), variante: 'primario' },
                            { label: 'Modificar Saldo', onClick: () => onModificarSaldo(cliente) },
                            { label: 'Ver Deudas', onClick: () => onVerDeudas(cliente), variante: 'peligro' },
                        ]}
                    />
                </div>
            </td>
        </tr>
    );
});

function VistaClientes({senalRecarga, abrirModalNuevoCliente, abrirVistaDeudasCliente}) {
    // --- ESTADOS ---
    const [clientes, setClientes] = useState([]);
    const [pagina, setPagina] = useState(0);
    const [totalPaginas, setTotalPaginas] = useState(0);
    const [totalElementos, setTotalElementos] = useState(0);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState('');

    // Estados para los filtros. 'busqueda' es lo que el usuario tipea; 'busquedaDebounced' es
    // lo que realmente se manda al backend, 300ms despues de que deja de tipear (evita pedirle
    // una pagina nueva al servidor en cada tecla).
    const [metodoFiltro, setMetodoFiltro] = useState('nombre');
    const [busqueda, setBusqueda] = useState('');
    const [busquedaDebounced, setBusquedaDebounced] = useState('');

    const [mostrarModalModificar, setMostrarModalModificar] = useState(false);
    const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
    const [mostrarModalSaldo, setMostrarModalSaldo] = useState(false);
    const [clienteParaSaldo, setClienteParaSaldo] = useState(null);
    const [filaSobreCursor, setFilaSobreCursor] = useState(null);

    // Contador de secuencia: si dos busquedas quedan en vuelo, solo se aplica la respuesta
    // de la ultima que se disparo (evita pisar resultados nuevos con una respuesta vieja).
    const idBusquedaRef = useRef(0);

    useEffect(() => {
        const temporizador = setTimeout(() => setBusquedaDebounced(busqueda), 300);
        return () => clearTimeout(temporizador);
    }, [busqueda]);

    // Si cambia el criterio de busqueda, se vuelve a la primera pagina del nuevo resultado.
    useEffect(() => {
        setPagina(0);
    }, [metodoFiltro, busquedaDebounced]);

    const obtenerClientes = useCallback(async () => {
        const idActual = ++idBusquedaRef.current;
        setCargando(true);
        setError('');
        try {
            const params = new URLSearchParams({ page: String(pagina), size: String(TAMANIO_PAGINA) });
            if (busquedaDebounced) {
                if (metodoFiltro === 'nombre') params.set('nombre', busquedaDebounced);
                else if (metodoFiltro === 'documento') params.set('documento', busquedaDebounced);
                else if (metodoFiltro === 'tipo') params.set('tipo', busquedaDebounced);
            }

            const respuesta = await fetch(`http://localhost:8080/api/clientes?${params.toString()}`);
            if (!respuesta.ok) {
                throw new Error(`Error del servidor: ${respuesta.status}`);
            }
            const data = await respuesta.json();
            if (idActual !== idBusquedaRef.current) return;

            const listaClientesFormateado = Array.isArray(data.content)
                ? data.content.map(cliente => ({
                    id: cliente.id,
                    nombre: cliente.nombre,
                    documento: cliente.documento,
                    tipoDocumento: cliente.tipoDocumento,
                    telefono: cliente.telefono,
                    tipoCliente: cliente.tipoCliente,
                    direcciones: cliente.direcciones || [],
                    saldo_a_favor: cliente.saldo_a_favor,
                }))
                : [];

            setClientes(listaClientesFormateado);
            setTotalPaginas(data.totalPages ?? 0);
            setTotalElementos(data.totalElements ?? 0);
        } catch (e) {
            console.error("Hubo un problema con el fetch:", e);
            if (idActual === idBusquedaRef.current) setError('Error al conectar con el servidor.');
        } finally {
            if (idActual === idBusquedaRef.current) setCargando(false);
        }
    }, [pagina, metodoFiltro, busquedaDebounced]);

    useEffect(() => {
        obtenerClientes();
    }, [obtenerClientes, senalRecarga]);

    const abrirModificarCliente = useCallback((cliente) => {
        setClienteSeleccionado(cliente);
        setMostrarModalModificar(true);
    }, []);

    const abrirModificarSaldo = useCallback((cliente) => {
        setClienteParaSaldo(cliente);
        setMostrarModalSaldo(true);
    }, []);

    const limpiarHover = useCallback(() => setFilaSobreCursor(null), []);

    // --- LÓGICA DE INTERFAZ ---
    const placeHolderFilter = () => {
        return metodoFiltro === 'nombre'
            ? "Buscar por Nombre..."
            : "Buscar por Documento...";
    };

    return (
        <main style={{
            padding: '20px',
            backgroundColor: 'var(--bg)',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
        }}>

            {/* 1. HEADER Y FILTROS */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '15px 20px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--surface)',
                boxShadow: 'var(--shadow-sm)'
            }}>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', width: '70%' }}>
                    <h3 style={{ fontSize: '1rem', margin: 0, color: 'var(--text-primary)' }}>Filtrar por:</h3>

                    <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                        <input
                            type="radio"
                            className="radio-personalizado"
                            name="filtroCliente"
                            checked={metodoFiltro === "nombre"}
                            onChange={() => {
                                setMetodoFiltro("nombre");
                                setBusqueda('');
                            }}
                        />
                        Nombre
                    </label>

                    {/* Radio: Documento */}
                    <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                        <input
                            type="radio"
                            className="radio-personalizado"
                            name="filtroCliente"
                            checked={metodoFiltro === "documento"}
                            onChange={() => {
                                setMetodoFiltro("documento");
                                setBusqueda('');
                            }}
                        />
                        Documento
                    </label>

                    {/* Radio: Tipo */}
                    <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                        <input
                            type="radio"
                            className="radio-personalizado"
                            name="filtroCliente"
                            checked={metodoFiltro === "tipo"}
                            onChange={() => {
                                setMetodoFiltro("tipo");
                                setBusqueda('');
                            }}
                        />
                        Tipo
                    </label>

                    {/* Input de Búsqueda (texto, o select cuando el filtro es por Tipo) */}
                    {metodoFiltro === 'tipo' ? (
                        <SelectPersonalizado
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            opciones={[
                                { value: '', label: 'Todos' },
                                { value: 'PERSONA', label: 'Persona' },
                                { value: 'SUPERMERCADO', label: 'Supermercado' },
                            ]}
                            style={{ flex: 1 }}
                        />
                    ) : (
                        <input
                            type="text"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            placeholder={placeHolderFilter()}
                            style={{
                                flex: 1,
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-sm)',
                                padding: '8px 12px',
                                outline: 'none',
                                fontSize: '0.95rem',
                                backgroundColor: 'var(--surface)',
                                color: 'var(--text-primary)'
                            }}
                        />
                    )}
                </div>

                <h3 style={{ fontSize: '1.2rem', margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}><HiOutlineUsers /> Lista Clientes</h3>
            </div>

            {error && <p style={{ color: 'var(--danger)', fontWeight: 'bold', margin: 0 }}>{error}</p>}

            {/* 2. CONTENEDOR DE LA TABLA (Maneja el Scroll) */}
            <div style={{
                flex: 1, //Toma todo el alto restante de la pantalla
                overflowY: 'auto', //Activa el scroll vertical
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-sm)',
                marginBottom:'0px'
            }}>
                <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse:'collapse', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: 'var(--surface-inverse)', position: 'sticky', top: 0, zIndex: 1 }}>
                        <tr style={{ color: 'var(--text-on-inverse)' }}>
                            <th style={{ padding: '12px 15px' }}>Nombre</th>
                            <th style={{ padding: '12px 15px' }}>Documento</th>
                            <th style={{ padding: '12px 15px' }}>Tipo</th>
                            <th style={{ padding: '12px 15px' }}>Telefono</th>
                            <th style={{ padding: '12px 15px' }}>{"Direccion(es)"}</th>
                            <th style={{ padding: '12px 15px' }}>Saldo del Cliente</th>
                            <th style={{ padding: '12px 15px', textAlign: 'center', width: '380px' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {clientes.length === 0 ? (
                            <tr>
                                <td colSpan={7} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    {cargando ? "Cargando clientes..." : "No se encontraron clientes con esa búsqueda."}
                                </td>
                            </tr>
                        ) : (
                            clientes.map((cliente) => (
                                <FilaCliente
                                    key={cliente.id}
                                    cliente={cliente}
                                    resaltada={filaSobreCursor === cliente.id}
                                    onHoverStart={setFilaSobreCursor}
                                    onHoverEnd={limpiarHover}
                                    onModificar={abrirModificarCliente}
                                    onModificarSaldo={abrirModificarSaldo}
                                    onVerDeudas={abrirVistaDeudasCliente}
                                />
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <Paginador
                pagina={pagina}
                totalPaginas={totalPaginas}
                totalElementos={totalElementos}
                onCambiarPagina={setPagina}
                cargando={cargando}
            />

            <div>
                <button
                    className="btn-global btn-primario-green"
                    style={{
                        width: '100%',
                        padding: '10px 8px',
                        fontSize:'1em',
                        boxShadow: 'var(--shadow-md)',
                    }}
                    onClick={abrirModalNuevoCliente}>
                    +Nuevo Cliente
                </button>
            </div>

            {mostrarModalModificar && (
                <ModalModificarCliente
                    cliente={clienteSeleccionado}
                    cerrarModal={() => {
                        setMostrarModalModificar(false);
                        setClienteSeleccionado(null);
                    }}
                    onClienteModificado={obtenerClientes}
                />
            )}

            {mostrarModalSaldo && (
                <ModalModificarSaldoCliente
                    cliente={clienteParaSaldo}
                    cerrarModal={() => {
                        setMostrarModalSaldo(false);
                        setClienteParaSaldo(null);
                    }}
                    onSaldoModificado={obtenerClientes}
                />
            )}

        </main>
    );
}

export default VistaClientes;

import { useState, useEffect, useCallback, useRef, memo } from 'react';
import ModalModificarProducto from '../Modals/ModalModificarProducto';
import { HiOutlineCube } from 'react-icons/hi2';
import Paginador from '@/shared/ui/Paginador';
import '@/shared/styles/Botones.css';

const TAMANIO_PAGINA = 50;

const FilaProducto = memo(function FilaProducto({ producto, onModificar }) {
    return (
        <tr style={{ borderBottom: '1px solid var(--border)' }}>
            <td style={{ padding: '10px 15px', textTransform: 'capitalize', fontWeight: '500', color: 'var(--text-primary)' }}>
                {producto.nombre}
            </td>
            <td style={{ padding: '10px 15px', textTransform: 'capitalize', fontWeight: '500', color: 'var(--text-secondary)' }}>
                {producto.descripcion || '-'}
            </td>
            <td style={{ padding: '10px 15px', textTransform: 'capitalize', fontWeight: '500' }}>
                <button
                    className="btn-global btn-primario"
                    style={{ padding: '4px 4px', fontSize: '0.9rem' }}
                    onClick={() => onModificar(producto)}
                >
                    Modificar
                </button>
            </td>
        </tr>
    );
});

function VistaProductos({ senalRecarga, abrirModalNuevoProducto }) {
    // --- ESTADOS ---
    const [productos, setProductos] = useState([]);
    const [pagina, setPagina] = useState(0);
    const [totalPaginas, setTotalPaginas] = useState(0);
    const [totalElementos, setTotalElementos] = useState(0);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState('');

    const [busqueda, setBusqueda] = useState('');
    const [busquedaDebounced, setBusquedaDebounced] = useState('');

    const [mostrarModalModificar, setMostrarModalModificar] = useState(false);
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);

    const idBusquedaRef = useRef(0);

    useEffect(() => {
        const temporizador = setTimeout(() => setBusquedaDebounced(busqueda), 300);
        return () => clearTimeout(temporizador);
    }, [busqueda]);

    useEffect(() => {
        setPagina(0);
    }, [busquedaDebounced]);

    const obtenerProductos = useCallback(async () => {
        const idActual = ++idBusquedaRef.current;
        setCargando(true);
        setError('');
        try {
            const params = new URLSearchParams({ page: String(pagina), size: String(TAMANIO_PAGINA) });
            if (busquedaDebounced) params.set('nombre', busquedaDebounced);

            const respuesta = await fetch(`http://localhost:8080/api/productos?${params.toString()}`);
            if (!respuesta.ok) {
                throw new Error(`Error del servidor: ${respuesta.status}`);
            }
            const data = await respuesta.json();
            if (idActual !== idBusquedaRef.current) return;

            const listaProductosFormateado = Array.isArray(data.content)
                ? data.content.map(producto => ({
                    id: producto.id,
                    nombre: producto.nombre,
                    descripcion: producto.descripcion,
                }))
                : [];

            setProductos(listaProductosFormateado);
            setTotalPaginas(data.totalPages ?? 0);
            setTotalElementos(data.totalElements ?? 0);
        } catch (e) {
            console.error("Hubo un problema con el fetch:", e);
            if (idActual === idBusquedaRef.current) setError('Error al conectar con el servidor.');
        } finally {
            if (idActual === idBusquedaRef.current) setCargando(false);
        }
    }, [pagina, busquedaDebounced]);

    useEffect(() => {
        obtenerProductos();
    }, [obtenerProductos, senalRecarga]);

    const abrirModificarProducto = useCallback((producto) => {
        setProductoSeleccionado(producto);
        setMostrarModalModificar(true);
    }, []);

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
                        Nombre
                    </label>

                    {/* Input de Búsqueda */}
                    <input
                        type="text"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        placeholder="Buscar por Nombre..."
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
                </div>

                <h3 style={{ fontSize: '1.2rem', margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}><HiOutlineCube /> Lista Productos</h3>
            </div>

            {error && <p style={{ color: 'var(--danger)', fontWeight: 'bold', margin: 0 }}>{error}</p>}

            {/* 2. CONTENEDOR DE LA TABLA (Maneja el Scroll) */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-sm)',
                marginBottom: '0px'
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: 'var(--surface-inverse)', position: 'sticky', top: 0, zIndex: 1 }}>
                        <tr style={{ color: 'var(--text-on-inverse)' }}>
                            <th style={{ padding: '12px 15px' }}>Nombre</th>
                            <th style={{ padding: '12px 15px' }}>Descripcion</th>
                            <th style={{ padding: '12px 15px' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {productos.length === 0 ? (
                            <tr>
                                <td colSpan={3} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    {cargando ? "Cargando productos..." : "No se encontraron productos con esa búsqueda."}
                                </td>
                            </tr>
                        ) : (
                            productos.map((producto) => (
                                <FilaProducto key={producto.id} producto={producto} onModificar={abrirModificarProducto} />
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
                        fontSize: '1em',
                        boxShadow: 'var(--shadow-md)',
                    }}
                    onClick={abrirModalNuevoProducto}>
                    +Nuevo Producto
                </button>
            </div>

            {mostrarModalModificar && (
                <ModalModificarProducto
                    producto={productoSeleccionado}
                    cerrarModal={() => {
                        setMostrarModalModificar(false);
                        setProductoSeleccionado(null);
                    }}
                    onProductoModificado={obtenerProductos}
                />
            )}

        </main>
    );
}

export default VistaProductos;

import React, { useState, useEffect } from 'react';
import ModalModificarProducto from '../Modals/ModalModificarProducto';
import { HiOutlineCube } from 'react-icons/hi2';
import '../Estilos/Botones.css';

function VistaProductos({ senalRecarga, abrirModalNuevoProducto }) {
    // --- ESTADOS ---
    const [productos, setProductos] = useState([]);
    const [error, setError] = useState('');
    const [busqueda, setBusqueda] = useState('');

    const [mostrarModalModificar, setMostrarModalModificar] = useState(false);
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);

    // --- EFECTOS Y FETCH ---
    useEffect(() => {
        obtenerProductos();
    }, [senalRecarga]);

    const obtenerProductos = async () => {
        try {
            const respuesta = await fetch('http://localhost:8080/api/productos/All');

            if (!respuesta.ok) {
                throw new Error(`Error del servidor: ${respuesta.status}`);
            }

            const data = await respuesta.json();

            console.log("Datos crudos de java: ", data);

            const listaProductosFormateado = Array.isArray(data)
                ? data.map(producto => ({
                    id: producto.id,
                    nombre: producto.nombre,
                    descripcion: producto.descripcion,
                }))
                : [];

            setProductos(listaProductosFormateado);
            console.log("Se cargaron los productos con exito...", listaProductosFormateado);

        } catch (e) {
            console.error("Hubo un problema con el fetch:", e);
            setError('Error al conectar con el servidor.');
        }
    };

    const abrirModificarProducto = (producto) => {
        setProductoSeleccionado(producto);
        setMostrarModalModificar(true);
    };

    // Filtramos los productos en tiempo real en base al input
    const productosFiltrados = productos.filter((producto) => {
        if (!busqueda) return true;
        return producto.nombre?.toLowerCase().includes(busqueda.toLowerCase());
    }).sort((a, b) => {
        const nombreA = a.nombre || "";
        const nombreB = b.nombre || "";

        return nombreA.localeCompare(nombreB);
    });

    return (
        <main style={{
            padding: '20px',
            backgroundColor: 'var(--bg)',
            height: '100vh',
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
                        {productosFiltrados.length === 0 ? (
                            <tr>
                                <td colSpan={3} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    {productos.length === 0 ? "Cargando productos..." : "No se encontraron productos con esa búsqueda."}
                                </td>
                            </tr>
                        ) : (
                            productosFiltrados.map((producto) => (
                                <tr key={producto.id} style={{ borderBottom: '1px solid var(--border)' }}>
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
                                            onClick={() => abrirModificarProducto(producto)}
                                        >
                                            Modificar
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
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

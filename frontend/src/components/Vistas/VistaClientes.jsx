import React, { useState, useEffect } from 'react';
import ModalModificarCliente from '../Modals/ModalModificarCliente';
import ModalModificarSaldoCliente from '../Modals/ModalModificarSaldoCliente';
import { HiOutlineUsers } from 'react-icons/hi2';
import '../Estilos/Botones.css';

const formatearMoneda = (val) => {
    return (val ?? 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
};

function VistaClientes({senalRecarga, abrirModalNuevoCliente, abrirVistaDeudasCliente}) {
    // --- ESTADOS ---
    const [clientes, setClientes] = useState([]);
    const [error, setError] = useState('');

    // Estados para los filtros
    const [metodoFiltro, setMetodoFiltro] = useState('nombre');
    const [busqueda, setBusqueda] = useState('');

    const [mostrarModalNuevoCliente, setMostrarModalNuevoCliente] = useState(false);
    const [mostrarModalModificar, setMostrarModalModificar] = useState(false);
    const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
    const [mostrarModalSaldo, setMostrarModalSaldo] = useState(false);
    const [clienteParaSaldo, setClienteParaSaldo] = useState(null);

    // --- EFECTOS Y FETCH ---
    useEffect(() => {
        obtenerClientes();
    }, [senalRecarga]);

    const obtenerClientes = async () => {
        try {
            const respuesta = await fetch('http://localhost:8080/api/clientes/All');

            if (!respuesta.ok) {
                throw new Error(`Error del servidor: ${respuesta.status}`);
            }

            const data = await respuesta.json();
            
            console.log("Datos crudos de java: ", data);

            const listaClientesFormateado = Array.isArray(data)
                ? data.map(cliente => ({
                    id: cliente.id,
                    nombre: cliente.nombre,
                    documento: cliente.documento,
                    telefono: cliente.telefono,
                    tipoCliente: cliente.tipoCliente,
                    direcciones: cliente.direcciones || [],
                    saldo_a_favor: cliente.saldo_a_favor,
                }))
                : [];
            
            setClientes(listaClientesFormateado);
            console.log("Se cargaron los clientes con exito...", listaClientesFormateado);

        } catch (e) {
            console.error("Hubo un problema con el fetch:", e);
            setError('Error al conectar con el servidor.');
        }
    };

    const abrirModificarCliente = (cliente) => {
        setClienteSeleccionado(cliente);
        setMostrarModalModificar(true);
    };

    const abrirModificarSaldo = (cliente) => {
        setClienteParaSaldo(cliente);
        setMostrarModalSaldo(true);
    };

    // --- LÓGICA DE INTERFAZ ---
    const placeHolderFilter = () => {
        return metodoFiltro === 'nombre'
            ? "Buscar por Nombre..."
            : "Buscar por CUIT/L...";
    };

    // Filtramos los clientes en tiempo real en base al input y el método elegido
    const clientesFiltrados = clientes.filter((cliente) => {
        if (!busqueda) return true; // Si no hay búsqueda, mostramos todos

        if (metodoFiltro === 'tipo') {
            return cliente.tipoCliente === busqueda;
        }

        const textoBusqueda = busqueda.toLowerCase();
        if (metodoFiltro === 'nombre') {
            return cliente.nombre?.toLowerCase().includes(textoBusqueda);
        } else {
            return cliente.documento?.includes(textoBusqueda);
        }
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
                        <input
                            type="radio"
                            name="filtroCliente"
                            checked={metodoFiltro === "nombre"}
                            onChange={() => {
                                setMetodoFiltro("nombre");
                                setBusqueda('');
                            }}
                        />
                        Nombre
                    </label>

                    {/* Radio: CUIT */}
                    <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                        <input
                            type="radio"
                            name="filtroCliente"
                            checked={metodoFiltro === "documento"}
                            onChange={() => {
                                setMetodoFiltro("documento");
                                setBusqueda('');
                            }}
                        />
                        CUIT/L
                    </label>

                    {/* Radio: Tipo */}
                    <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                        <input
                            type="radio"
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
                        <select
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
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
                        >
                            <option value="">Todos</option>
                            <option value="PERSONA">Persona</option>
                            <option value="SUPERMERCADO">Supermercado</option>
                        </select>
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
                <table style={{ width: '100%', borderCollapse:'collapse', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: 'var(--surface-inverse)', position: 'sticky', top: 0, zIndex: 1 }}>
                        <tr style={{ color: 'var(--text-on-inverse)' }}>
                            <th style={{ padding: '12px 15px' }}>Nombre</th>
                            <th style={{ padding: '12px 15px' }}>CUIT/L</th>
                            <th style={{ padding: '12px 15px' }}>Tipo</th>
                            <th style={{ padding: '12px 15px' }}>Telefono</th>
                            <th style={{ padding: '12px 15px' }}>{"Direccion(es)"}</th>
                            <th style={{ padding: '12px 15px' }}>Saldo del Cliente</th>
                            <th style={{ padding: '12px 15px' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {clientesFiltrados.length === 0 ? (
                            <tr>
                                <td colSpan={7} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    {clientes.length === 0 ? "Cargando clientes..." : "No se encontraron clientes con esa búsqueda."}
                                </td>
                            </tr>
                        ) : (
                            clientesFiltrados.map((cliente) => (
                                <tr key={cliente.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '10px 15px', textTransform: 'capitalize', fontWeight: '500', color: 'var(--text-primary)' }}>
                                        {cliente.nombre}
                                    </td>
                                    <td style={{ padding: '10px 15px', color: 'var(--text-secondary)' }}>
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
                                    <td style={{ padding: '10px 15px', textTransform: 'capitalize', fontWeight: '500', display: 'flex', gap: '8px' }}>
                                        <button
                                            className="btn-global btn-primario"
                                            style={{padding:'4px 4px', fontSize:'0.9rem'}}
                                            onClick={() => abrirModificarCliente(cliente)}
                                        >
                                            Modificar
                                        </button>
                                        <button
                                            className="btn-global btn-secundario"
                                            style={{padding:'4px 4px', fontSize:'0.9rem'}}
                                            onClick={() => abrirModificarSaldo(cliente)}
                                        >
                                            Modificar Saldo
                                        </button>
                                        <button
                                            className="btn-global btn-peligro"
                                            style={{padding:'4px 4px', fontSize:'0.9rem'}}
                                            onClick={() => abrirVistaDeudasCliente(cliente)}
                                        >
                                            Ver Deudas
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
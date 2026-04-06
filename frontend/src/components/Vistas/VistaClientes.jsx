import React, { useState, useEffect } from 'react';

function VistaClientes({senalRecarga, abrirModalNuevoCliente}) {
    // --- ESTADOS ---
    const [clientes, setClientes] = useState([]);
    const [error, setError] = useState('');

    // Estados para los filtros
    const [metodoFiltro, setMetodoFiltro] = useState('nombre');
    const [busqueda, setBusqueda] = useState(''); 

    const [mostrarModalNuevoCliente, setMostrarModalNuevoCliente] = useState(false);

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
                    direccion: cliente.direccion,
                }))
                : [];
            
            setClientes(listaClientesFormateado);
            console.log("Se cargaron los clientes con exito...", listaClientesFormateado);

        } catch (e) {
            console.error("Hubo un problema con el fetch:", e);
            setError('Error al conectar con el servidor.');
        }
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
            backgroundColor: '#f4f6f8',
            height: 'calc(100vh - 70px)',
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
                border: '1px solid #ddd',
                borderRadius: '10px',
                backgroundColor: '#fff',
                boxShadow: '0 2px 4px #0001'
            }}>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', width: '70%' }}>
                    <h3 style={{ fontSize: '1rem', margin: 0, color: '#2c3e50' }}>Filtrar por:</h3>

                    <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.95rem' }}>
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
                    <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.95rem' }}>
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

                    {/* Input de Búsqueda */}
                    <input
                        type="text"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        placeholder={placeHolderFilter()}
                        style={{
                            flex: 1, 
                            border: '1px solid #ccc',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            outline: 'none',
                            fontSize: '0.95rem'
                        }}
                    />
                </div>

                <h3 style={{ fontSize: '1.2rem', margin: 0, color: '#2c3e50' }}>👥 Lista Clientes</h3>
            </div>

            {error && <p style={{ color: '#e74c3c', fontWeight: 'bold', margin: 0 }}>{error}</p>}

            {/* 2. CONTENEDOR DE LA TABLA (Maneja el Scroll) */}
            <div style={{
                flex: 1, //Toma todo el alto restante de la pantalla
                overflowY: 'auto', //Activa el scroll vertical
                backgroundColor: '#fff',
                border: '1px solid #ddd',
                borderRadius: '10px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                marginBottom:'0px'
            }}>
                <table style={{ width: '100%', borderCollapse:'collapse', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: '#2c3e50', position: 'sticky', top: 0, zIndex: 1 }}>
                        <tr style={{ color: '#fff' }}>
                            <th style={{ padding: '12px 15px' }}>Nombre</th>
                            <th style={{ padding: '12px 15px' }}>CUIT/L</th>
                            <th style={{ padding: '12px 15px' }}>Telefono</th>
                            <th style={{ padding: '12px 15px' }}>Direccion</th>
                            <th style={{ padding: '12px 15px' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {clientesFiltrados.length === 0 ? (
                            <tr>
                                <td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#7f8c8d' }}>
                                    {clientes.length === 0 ? "Cargando clientes..." : "No se encontraron clientes con esa búsqueda."}
                                </td>
                            </tr>
                        ) : (
                            clientesFiltrados.map((cliente) => (
                                <tr key={cliente.id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '10px 15px', textTransform: 'capitalize', fontWeight: '500' }}>
                                        {cliente.nombre}
                                    </td>
                                    <td style={{ padding: '10px 15px' }}>
                                        {cliente.documento}
                                    </td>
                                    <td style={{ padding: '10px 15px', textTransform: 'capitalize', fontWeight: '500' }}>
                                        {cliente.telefono || '-'}
                                    </td>
                                    <td style={{ padding: '10px 15px', textTransform: 'capitalize', fontWeight: '500' }}>
                                        {cliente.direccion || '-'}
                                    </td>
                                    <td style={{ padding: '10px 15px', textTransform: 'capitalize', fontWeight: '500' }}>
                                        Modificar
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <div>
                <button
                    style={{
                        width: '100%',
                        border: 'none',
                        borderRadius: '5px',
                        padding: '10px 8px',
                        fontWeight: 'bold',
                        fontSize:'1em',
                        color: '#ffff',
                        background: '#27ae60',
                        boxShadow:'1px 3px 10px #0008',
                        cursor:'pointer',
                    }}
                    onClick={abrirModalNuevoCliente}>
                    +Nuevo Cliente
                </button>
            </div>

        </main>
    );
}

export default VistaClientes;
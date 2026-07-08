import React, { useState, useEffect } from 'react';
import '../Estilos/Botones.css';

function VistaPlanillas({ abrirPlanilla, abrirPlanillaCerrada }) {
    // --- ESTADOS ---
    const [planillas, setPlanillas] = useState([]);
    const [error, setError] = useState('');

    // Estados para los filtros
    const [metodoFiltro, setMetodoFiltro] = useState('fecha');
    const [busqueda, setBusqueda] = useState('');

    // --- EFECTOS Y FETCH ---
    useEffect(() => {
        obtenerPlanillas();
    }, []);

    const obtenerPlanillas = async () => {
        try {
            const respuesta = await fetch('http://localhost:8080/api/planilla/All');

            if (!respuesta.ok) {
                throw new Error(`Error del servidor: ${respuesta.status}`);
            }

            const data = await respuesta.json();

            console.log("Datos crudos de java: ", data);

            const listaPlanillasFormateado = Array.isArray(data)
                ? data.map(planilla => ({
                    id: planilla.id,
                    fecha: planilla.fecha,
                    estadoPlanilla: planilla.estadoPlanilla,
                    ingresoTotal: planilla.ingresoTotal,
                    deudaTotal: planilla.deudaTotal,
                    stockProductos: planilla.stockProductos || [],
                    boletas: planilla.boletas || []
                }))
                : [];

            setPlanillas(listaPlanillasFormateado);
            console.log("Se cargaron las planillas con exito...", listaPlanillasFormateado);

        } catch (e) {
            console.error("Hubo un problema con el fetch:", e);
            setError('Error al conectar con el servidor.');
        }
    };

    // Filtramos las planillas en tiempo real en base al input y el método elegido
    const planillasFiltradas = planillas.filter((planilla) => {
        if (!busqueda) return true; // Si no hay búsqueda, mostramos todas

        if (metodoFiltro === 'fecha') {
            return planilla.fecha === busqueda;
        } else {
            return planilla.estadoPlanilla === busqueda;
        }
    }).sort((a, b) => {
        if (a.fecha !== b.fecha) {
            return a.fecha < b.fecha ? 1 : -1; // Más reciente primero
        }
        if (a.estadoPlanilla !== b.estadoPlanilla) {
            return a.estadoPlanilla === 'ABIERTA' ? -1 : 1; // Abiertas antes que cerradas
        }
        return 0;
    });

    const formatearMoneda = (valor) => {
        return (valor ?? 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
    };

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
                            name="filtroPlanilla"
                            checked={metodoFiltro === "fecha"}
                            onChange={() => {
                                setMetodoFiltro("fecha");
                                setBusqueda('');
                            }}
                        />
                        Fecha
                    </label>

                    <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.95rem' }}>
                        <input
                            type="radio"
                            name="filtroPlanilla"
                            checked={metodoFiltro === "estado"}
                            onChange={() => {
                                setMetodoFiltro("estado");
                                setBusqueda('');
                            }}
                        />
                        Estado
                    </label>

                    {/* Input de Búsqueda: cambia según el filtro elegido */}
                    {metodoFiltro === 'fecha' ? (
                        <input
                            type="date"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            style={{
                                flex: 1,
                                border: '1px solid #ccc',
                                borderRadius: '8px',
                                padding: '8px 12px',
                                outline: 'none',
                                fontSize: '0.95rem'
                            }}
                        />
                    ) : (
                        <select
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            style={{
                                flex: 1,
                                border: '1px solid #ccc',
                                borderRadius: '8px',
                                padding: '8px 12px',
                                outline: 'none',
                                fontSize: '0.95rem'
                            }}
                        >
                            <option value="">Todas</option>
                            <option value="ABIERTA">Abierta</option>
                            <option value="CERRADA">Cerrada</option>
                        </select>
                    )}
                </div>

                <h3 style={{ fontSize: '1.2rem', margin: 0, color: '#2c3e50' }}>🧾 Lista Planillas</h3>
            </div>

            {error && <p style={{ color: '#e74c3c', fontWeight: 'bold', margin: 0 }}>{error}</p>}

            {/* 2. CONTENEDOR DE LA TABLA (Maneja el Scroll) */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                backgroundColor: '#fff',
                border: '1px solid #ddd',
                borderRadius: '10px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                marginBottom: '0px'
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: '#2c3e50', position: 'sticky', top: 0, zIndex: 1 }}>
                        <tr style={{ color: '#fff' }}>
                            <th style={{ padding: '12px 15px' }}>Fecha Planilla</th>
                            <th style={{ padding: '12px 15px' }}>Estado</th>
                            <th style={{ padding: '12px 15px' }}>Ingreso Total</th>
                            <th style={{ padding: '12px 15px' }}>Deuda Total</th>
                            <th style={{ padding: '12px 15px' }}>----</th>
                        </tr>
                    </thead>
                    <tbody>
                        {planillasFiltradas.length === 0 ? (
                            <tr>
                                <td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: '#7f8c8d' }}>
                                    {planillas.length === 0 ? "Cargando planillas..." : "No se encontraron planillas con esa búsqueda."}
                                </td>
                            </tr>
                        ) : (
                            planillasFiltradas.map((planilla) => (
                                <tr key={planilla.id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '10px 15px', fontWeight: '500' }}>
                                        {planilla.fecha}
                                    </td>
                                    <td style={{ padding: '10px 15px' }}>
                                        <span style={{
                                            padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold',
                                            backgroundColor: planilla.estadoPlanilla === 'ABIERTA' ? '#d4efdf' : '#fadbd8',
                                            color: planilla.estadoPlanilla === 'ABIERTA' ? '#27ae60' : '#c0392b'
                                        }}>
                                            {planilla.estadoPlanilla}
                                        </span>
                                    </td>
                                    <td style={{ padding: '10px 15px', fontWeight: '500' }}>
                                        {formatearMoneda(planilla.ingresoTotal)}
                                    </td>
                                    <td style={{ padding: '10px 15px', fontWeight: '500' }}>
                                        {formatearMoneda(planilla.deudaTotal)}
                                    </td>
                                    <td style={{ padding: '10px 15px', textAlign: 'center' }}>
                                        {planilla.estadoPlanilla === 'ABIERTA' ? (
                                            <button
                                                className="btn-global btn-primario-green"
                                                onClick={() => abrirPlanilla(planilla)}
                                                style={{ padding: '6px 15px', fontSize: '0.85rem' }}
                                            >
                                                Abrir planilla
                                            </button>
                                        ) : (
                                            <button
                                                className="btn-global btn-secundario"
                                                onClick={() => abrirPlanillaCerrada(planilla)}
                                                style={{ padding: '6px 15px', fontSize: '0.85rem', backgroundColor: '#e8f8f5', color: '#16a085', border: '1px solid #a3e4d7' }}
                                            >
                                                Ver Resumen
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

        </main>
    );
}

export default VistaPlanillas;

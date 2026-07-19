import React, { useState, useEffect } from 'react';
import { formatearFechaVisual } from '../../utils/formatoFecha';
import { HiOutlineDocumentText } from 'react-icons/hi2';
import SelectPersonalizado from '../UI/SelectPersonalizado';
import SelectorFecha from '../UI/SelectorFecha';
import '../Estilos/Botones.css';
import '../Estilos/Formularios.css';

function VistaPlanillas({ abrirPlanilla, abrirPlanillaCerrada }) {
    // --- ESTADOS ---
    const [planillas, setPlanillas] = useState([]);
    const [error, setError] = useState('');

    // Estados para los filtros
    const [metodoFiltro, setMetodoFiltro] = useState('fecha');
    const [busqueda, setBusqueda] = useState('');
    const [desde, setDesde] = useState('');
    const [hasta, setHasta] = useState('');

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
        if (metodoFiltro === 'estado') {
            return !busqueda || planilla.estadoPlanilla === busqueda;
        }
        // metodoFiltro === 'fecha': rango desde/hasta (si solo hay un extremo, o
        // desde === hasta, filtra por ese unico dia puntual).
        return (!desde || planilla.fecha >= desde) && (!hasta || planilla.fecha <= hasta);
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
                            name="filtroPlanilla"
                            checked={metodoFiltro === "fecha"}
                            onChange={() => {
                                setMetodoFiltro("fecha");
                                setBusqueda('');
                            }}
                        />
                        Rango de Fechas
                    </label>

                    <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                        <input
                            type="radio"
                            className="radio-personalizado"
                            name="filtroPlanilla"
                            checked={metodoFiltro === "estado"}
                            onChange={() => {
                                setMetodoFiltro("estado");
                                setDesde('');
                                setHasta('');
                            }}
                        />
                        Estado
                    </label>

                    {/* Input de Búsqueda: cambia según el filtro elegido */}
                    {metodoFiltro === 'fecha' ? (
                        <SelectorFecha
                            desde={desde}
                            hasta={hasta}
                            onCambiar={({ desde: d, hasta: h }) => { setDesde(d); setHasta(h); }}
                            style={{ flex: 1 }}
                        />
                    ) : (
                        <SelectPersonalizado
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            opciones={[
                                { value: '', label: 'Todas' },
                                { value: 'ABIERTA', label: 'Abierta' },
                                { value: 'CERRADA', label: 'Cerrada' },
                            ]}
                            style={{ flex: 1 }}
                        />
                    )}
                </div>

                <h3 style={{ fontSize: '1.2rem', margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}><HiOutlineDocumentText /> Lista Planillas</h3>
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
                                <td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    {planillas.length === 0 ? "Cargando planillas..." : "No se encontraron planillas con esa búsqueda."}
                                </td>
                            </tr>
                        ) : (
                            planillasFiltradas.map((planilla) => (
                                <tr key={planilla.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '10px 15px', fontWeight: '500', color: 'var(--text-primary)' }}>
                                        {formatearFechaVisual(planilla.fecha)}
                                    </td>
                                    <td style={{ padding: '10px 15px' }}>
                                        <span style={{
                                            padding: '4px 8px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 'bold',
                                            backgroundColor: planilla.estadoPlanilla === 'ABIERTA' ? 'var(--success-soft)' : 'var(--danger-soft)',
                                            color: planilla.estadoPlanilla === 'ABIERTA' ? 'var(--success-soft-text)' : 'var(--danger-soft-text)'
                                        }}>
                                            {planilla.estadoPlanilla}
                                        </span>
                                    </td>
                                    <td style={{ padding: '10px 15px', fontWeight: '500', color: 'var(--text-primary)' }}>
                                        {formatearMoneda(planilla.ingresoTotal)}
                                    </td>
                                    <td style={{ padding: '10px 15px', fontWeight: '500', color: 'var(--text-primary)' }}>
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
                                                style={{ padding: '6px 15px', fontSize: '0.85rem' }}
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

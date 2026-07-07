import { useState, useEffect } from "react";
import '../Estilos/Botones.css';

function VistaInicio({ abrirModalPlanilla, abrirPlanilla, abrirPlanillaCerrada, planilla }) {
    const [ultimasPlanillas, setUltimasPlanillas] = useState([]);
    const [cargandoPlanillas, setCargandoPlanillas] = useState(true);
    const [clientesDeudores, setClientesDeudores] = useState([]);
    const [cargandoDeudores, setCargandoDeudores] = useState(true);

    useEffect(() => {
        const cargarUltimasPlanillas = async () => {
            try {
                const respuesta = await fetch('http://localhost:8080/api/planilla/All');
                if (respuesta.ok) {
                    const datos = await respuesta.json();
                    const ultimasCerradas = (Array.isArray(datos) ? datos : [])
                        .filter(p => p.estadoPlanilla === 'CERRADA')
                        .sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0))
                        .slice(0, 3);
                    setUltimasPlanillas(ultimasCerradas);
                }
            } catch (error) {
                console.error("Error al cargar las últimas planillas:", error);
            } finally {
                setCargandoPlanillas(false);
            }
        };

        const cargarClientesDeudores = async () => {
            try {
                const respuesta = await fetch('http://localhost:8080/api/clientes/deudores/3');
                if (respuesta.ok) {
                    setClientesDeudores(await respuesta.json());
                }
            } catch (error) {
                console.error("Error al cargar los clientes más deudores:", error);
            } finally {
                setCargandoDeudores(false);
            }
        };

        cargarUltimasPlanillas();
        cargarClientesDeudores();
    }, []);

    const formatearMoneda = (valor) => {
        return (valor ?? 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
    };

    const tarjetaKpiStyle = {
        flex: 1,
        minWidth: '200px',
        backgroundColor: 'white',
        padding: '18px 20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
    };

    const panelStyle = {
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column'
    };

    const tituloPanelStyle = { margin: '0 0 15px 0', color: '#2c3e50', borderBottom: '2px solid #eee', paddingBottom: '10px' };

    return (
        <main style={{ padding: '20px', backgroundColor: '#f4f6f8', minHeight: 'calc(100vh - 70px)', display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* FILA 1: TARJETAS KPI + ACCIÓN RÁPIDA */}
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <div style={tarjetaKpiStyle}>
                    <span style={{ color: '#7f8c8d', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Ventas del mes</span>
                    <span style={{ color: '#bdc3c7', fontSize: '1.1rem', fontStyle: 'italic' }}>Próximamente</span>
                </div>

                <div style={tarjetaKpiStyle}>
                    <span style={{ color: '#7f8c8d', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Deuda total</span>
                    <span style={{ color: '#bdc3c7', fontSize: '1.1rem', fontStyle: 'italic' }}>Próximamente</span>
                </div>

                <div style={tarjetaKpiStyle}>
                    <span style={{ color: '#7f8c8d', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Clientes registrados</span>
                    <span style={{ color: '#bdc3c7', fontSize: '1.1rem', fontStyle: 'italic' }}>Próximamente</span>
                </div>

                {planilla !== null ? (
                    <button
                        className="btn-global btn-primario-green"
                        onClick={() => abrirPlanilla(planilla)}
                        style={{ ...tarjetaKpiStyle, backgroundColor: undefined, alignItems: 'center', justifyContent: 'center', fontSize: '1.05rem' }}
                    >
                        🟢 Abrir Planilla
                    </button>
                ) : (
                    <button
                        className="btn-global btn-primario"
                        onClick={abrirModalPlanilla}
                        style={{ ...tarjetaKpiStyle, backgroundColor: undefined, alignItems: 'center', justifyContent: 'center', fontSize: '1.05rem' }}
                    >
                        ➕ Nueva Planilla
                    </button>
                )}
            </div>

            {/* FILA 2: PANEL GRANDE + PANEL LATERAL */}
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <div style={{ ...panelStyle, flex: 2, minWidth: '320px' }}>
                    <h4 style={tituloPanelStyle}>🧾 Ultimas planillas cargadas</h4>

                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly', gap: '6px', flexGrow: 1, minHeight: 0 }}>
                        {cargandoPlanillas ? (
                            <p style={{ textAlign: 'center', color: '#888', fontSize: '0.9rem' }}>Cargando...</p>
                        ) : ultimasPlanillas.length === 0 ? (
                            <p style={{ textAlign: 'center', color: '#888', fontSize: '0.9rem' }}>Todavía no hay planillas cerradas.</p>
                        ) : (
                            ultimasPlanillas.map(p => (
                                <div key={p.id} style={{
                                    display: 'grid',
                                    gridTemplateColumns: '70px 75px 1fr 1fr auto',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '5px 8px',
                                    border: '1px solid #eee',
                                    borderRadius: '6px'
                                }}>
                                    <strong style={{ fontSize: '0.8rem' }}>{p.fecha}</strong>

                                    <span style={{
                                        justifySelf: 'start',
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontSize: '0.7rem',
                                        fontWeight: 'bold',
                                        backgroundColor: '#fadbd8',
                                        color: '#c0392b'
                                    }}>
                                        {p.estadoPlanilla}
                                    </span>

                                    <span style={{ color: '#27ae60', fontWeight: 'bold', fontSize: '0.75rem', textAlign: 'right' }}>{formatearMoneda(p.ingresoTotal)}</span>
                                    <span style={{ color: '#e74c3c', fontWeight: 'bold', fontSize: '0.75rem', textAlign: 'right', marginRight: '50px' }}>{formatearMoneda(p.deudaTotal)}</span>

                                    <button
                                        className="btn-global btn-secundario"
                                        onClick={() => abrirPlanillaCerrada(p)}
                                        style={{ padding: '4px 8px', fontSize: '0.75rem', backgroundColor: '#e8f8f5', color: '#16a085', border: '1px solid #a3e4d7', whiteSpace: 'nowrap' }}
                                    >
                                        Ver Resumen
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div style={{ ...panelStyle, flex: 1, minWidth: '220px' }}>
                    <h4 style={tituloPanelStyle}>💳 Clientes mas deudores</h4>

                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly', gap: '6px', flexGrow: 1, minHeight: 0 }}>
                        {cargandoDeudores ? (
                            <p style={{ textAlign: 'center', color: '#888', fontSize: '0.9rem' }}>Cargando...</p>
                        ) : clientesDeudores.length === 0 ? (
                            <p style={{ textAlign: 'center', color: '#888', fontSize: '0.9rem' }}>No hay clientes con deuda pendiente.</p>
                        ) : (
                            clientesDeudores.map(c => (
                                <div key={c.id} style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr auto',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '5px 8px',
                                    border: '1px solid #eee',
                                    borderRadius: '6px'
                                }}>
                                    <strong style={{ fontSize: '0.8rem', textTransform: 'capitalize' }}>{c.nombre}</strong>
                                    <span style={{ color: '#e74c3c', fontWeight: 'bold', fontSize: '0.8rem', textAlign: 'right' }}>{formatearMoneda(c.deudaTotal)}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* FILA 3: PANEL ANCHO COMPLETO */}
            <div style={panelStyle}>
                <h4 style={{ margin: 0, color: '#2c3e50' }}>📝 Notas+</h4>
            </div>

        </main>
    );
}

export default VistaInicio;

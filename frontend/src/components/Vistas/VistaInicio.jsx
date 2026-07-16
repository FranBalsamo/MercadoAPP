import { useState, useEffect } from "react";
import {
    HiOutlineBanknotes,
    HiOutlineExclamationTriangle,
    HiOutlinePlusCircle,
    HiOutlineArrowRightCircle,
    HiOutlineDocumentText,
    HiOutlineUserGroup,
} from 'react-icons/hi2';
import CarruselEstadisticas from './CarruselEstadisticas';
import { formatearFechaVisual } from '../../utils/formatoFecha';
import '../Estilos/Botones.css';

function VistaInicio({ abrirModalPlanilla, abrirPlanilla, abrirPlanillaCerrada, planilla }) {
    const [ultimasPlanillas, setUltimasPlanillas] = useState([]);
    const [ventasDelMes, setVentasDelMes] = useState(0);
    const [deudaTotalGeneral, setDeudaTotalGeneral] = useState(0);
    const [cargandoPlanillas, setCargandoPlanillas] = useState(true);
    const [clientesDeudores, setClientesDeudores] = useState([]);
    const [cargandoDeudores, setCargandoDeudores] = useState(true);

    useEffect(() => {
        const cargarUltimasPlanillas = async () => {
            try {
                const respuesta = await fetch('http://localhost:8080/api/planilla/All');
                if (respuesta.ok) {
                    const datos = await respuesta.json();
                    const planillasCerradas = (Array.isArray(datos) ? datos : [])
                        .filter(p => p.estadoPlanilla === 'CERRADA');

                    const mesActual = new Date().toISOString().slice(0, 7); // "YYYY-MM"
                    const totalDelMes = planillasCerradas
                        .filter(p => p.fecha?.slice(0, 7) === mesActual)
                        .reduce((acumulado, p) => acumulado + (p.ingresoTotal || 0), 0);
                    const deudaGeneral = planillasCerradas
                        .reduce((acumulado, p) => acumulado + (p.deudaTotal || 0), 0);

                    setVentasDelMes(totalDelMes);
                    setDeudaTotalGeneral(deudaGeneral);
                    setUltimasPlanillas(
                        [...planillasCerradas]
                            .sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0))
                            .slice(0, 3)
                    );
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
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        padding: '20px',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
    };

    const insigniaIconoStyle = (colorTexto, colorFondo) => ({
        width: '36px',
        height: '36px',
        borderRadius: 'var(--radius-md)',
        backgroundColor: colorFondo,
        color: colorTexto,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.2rem',
        flexShrink: 0
    });

    const etiquetaKpiStyle = {
        color: 'var(--text-secondary)',
        fontSize: '0.78rem',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.04em'
    };

    const panelStyle = {
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        padding: '20px',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column'
    };

    const tituloPanelStyle = {
        margin: '0 0 15px 0',
        color: 'var(--text-primary)',
        fontSize: '1rem',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        borderBottom: '1px solid var(--border)',
        paddingBottom: '12px'
    };

    return (
        <main style={{ padding: '24px', backgroundColor: 'var(--bg)', minHeight: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* FILA 1: TARJETAS KPI + ACCIÓN RÁPIDA */}
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <div style={tarjetaKpiStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={insigniaIconoStyle('var(--success-soft-text)', 'var(--success-soft)')}>
                            <HiOutlineBanknotes />
                        </span>
                        <span style={etiquetaKpiStyle}>Ventas del mes</span>
                    </div>
                    {cargandoPlanillas ? (
                        <span style={{ color: 'var(--text-muted)', fontSize: '1.1rem', fontStyle: 'italic' }}>Cargando...</span>
                    ) : (
                        <span style={{ color: 'var(--text-primary)', fontSize: '1.6rem', fontWeight: '700' }}>{formatearMoneda(ventasDelMes)}</span>
                    )}
                </div>

                <div style={tarjetaKpiStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={insigniaIconoStyle('var(--danger-soft-text)', 'var(--danger-soft)')}>
                            <HiOutlineExclamationTriangle />
                        </span>
                        <span style={etiquetaKpiStyle}>Deuda total</span>
                    </div>
                    {cargandoPlanillas ? (
                        <span style={{ color: 'var(--text-muted)', fontSize: '1.1rem', fontStyle: 'italic' }}>Cargando...</span>
                    ) : (
                        <span style={{ color: 'var(--text-primary)', fontSize: '1.6rem', fontWeight: '700' }}>{formatearMoneda(deudaTotalGeneral)}</span>
                    )}
                </div>

                {planilla !== null ? (
                    <button
                        className="btn-global btn-primario-green"
                        onClick={() => abrirPlanilla(planilla)}
                        style={{
                            ...tarjetaKpiStyle,
                            backgroundColor: undefined,
                            border: 'none',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'row',
                            gap: '10px',
                            fontSize: '1.05rem',
                            boxShadow: 'var(--shadow-md)'
                        }}
                    >
                        <HiOutlineArrowRightCircle style={{ fontSize: '1.4rem' }} />
                        Abrir Planilla
                    </button>
                ) : (
                    <button
                        className="btn-global btn-primario"
                        onClick={abrirModalPlanilla}
                        style={{
                            ...tarjetaKpiStyle,
                            backgroundColor: undefined,
                            border: 'none',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'row',
                            gap: '10px',
                            fontSize: '1.05rem',
                            boxShadow: 'var(--shadow-md)'
                        }}
                    >
                        <HiOutlinePlusCircle style={{ fontSize: '1.4rem' }} />
                        Nueva Planilla
                    </button>
                )}
            </div>

            {/* FILA 2: PANEL GRANDE + PANEL LATERAL */}
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <div style={{ ...panelStyle, flex: 2, minWidth: '320px' }}>
                    <h4 style={tituloPanelStyle}><HiOutlineDocumentText /> Últimas planillas cargadas</h4>

                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly', gap: '8px', flexGrow: 1, minHeight: 0 }}>
                        {cargandoPlanillas ? (
                            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Cargando...</p>
                        ) : ultimasPlanillas.length === 0 ? (
                            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Todavía no hay planillas cerradas.</p>
                        ) : (
                            ultimasPlanillas.map(p => (
                                <div key={p.id} style={{
                                    display: 'grid',
                                    gridTemplateColumns: '70px 75px 1fr 1fr auto',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '8px 10px',
                                    border: '1px solid var(--border)',
                                    borderRadius: 'var(--radius-md)'
                                }}>
                                    <strong style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{formatearFechaVisual(p.fecha)}</strong>

                                    <span style={{
                                        justifySelf: 'start',
                                        padding: '2px 8px',
                                        borderRadius: 'var(--radius-sm)',
                                        fontSize: '0.7rem',
                                        fontWeight: 'bold',
                                        backgroundColor: 'var(--danger-soft)',
                                        color: 'var(--danger-soft-text)'
                                    }}>
                                        {p.estadoPlanilla}
                                    </span>

                                    <span style={{ color: 'var(--success)', fontWeight: 'bold', fontSize: '0.75rem', textAlign: 'right' }}>{formatearMoneda(p.ingresoTotal)}</span>
                                    <span style={{ color: 'var(--danger)', fontWeight: 'bold', fontSize: '0.75rem', textAlign: 'right', marginRight: '50px' }}>{formatearMoneda(p.deudaTotal)}</span>

                                    <button
                                        className="btn-global btn-secundario"
                                        onClick={() => abrirPlanillaCerrada(p)}
                                        style={{ padding: '4px 10px', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                                    >
                                        Ver Resumen
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div style={{ ...panelStyle, flex: 1, minWidth: '220px' }}>
                    <h4 style={tituloPanelStyle}><HiOutlineUserGroup /> Clientes más deudores</h4>

                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly', gap: '8px', flexGrow: 1, minHeight: 0 }}>
                        {cargandoDeudores ? (
                            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Cargando...</p>
                        ) : clientesDeudores.length === 0 ? (
                            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>No hay clientes con deuda pendiente.</p>
                        ) : (
                            clientesDeudores.map(c => (
                                <div key={c.id} style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr auto',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '8px 10px',
                                    border: '1px solid var(--border)',
                                    borderRadius: 'var(--radius-md)'
                                }}>
                                    <strong style={{ fontSize: '0.8rem', textTransform: 'capitalize', color: 'var(--text-primary)' }}>{c.nombre}</strong>
                                    <span style={{ color: 'var(--danger)', fontWeight: 'bold', fontSize: '0.8rem', textAlign: 'right' }}>{formatearMoneda(c.deudaTotal)}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* FILA 3: CARRUSEL DE ESTADÍSTICAS */}
            <div style={panelStyle}>
                <CarruselEstadisticas />
            </div>

        </main>
    );
}

export default VistaInicio;

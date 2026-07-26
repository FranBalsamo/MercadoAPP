import { useState, useEffect, useCallback } from 'react';
import { formatearFechaVisual } from '@/shared/utils/formatoFecha';
import { HiOutlineDocumentText } from 'react-icons/hi2';
import SelectPersonalizado from '@/shared/ui/SelectPersonalizado';
import SelectorFecha from '@/shared/ui/SelectorFecha';
import Paginador from '@/shared/ui/Paginador';
import '@/shared/styles/Botones.css';
import '@/shared/styles/Formularios.css';
import MensajeError from '@/shared/ui/MensajeError';

const TAMANIO_PAGINA = 50;

const formatearMoneda = (valor) => (valor ?? 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

function VistaPlanillas({ abrirPlanilla, abrirPlanillaCerrada }) {
    // --- ESTADOS ---
    const [planillas, setPlanillas] = useState([]);
    const [pagina, setPagina] = useState(0);
    const [totalPaginas, setTotalPaginas] = useState(0);
    const [totalElementos, setTotalElementos] = useState(0);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState('');

    // Estados para los filtros
    const [metodoFiltro, setMetodoFiltro] = useState('fecha');
    const [busqueda, setBusqueda] = useState('');
    const [desde, setDesde] = useState('');
    const [hasta, setHasta] = useState('');

    const obtenerPlanillas = useCallback(async (paginaSolicitada) => {
        setCargando(true);
        setError('');
        try {
            const params = new URLSearchParams({ page: String(paginaSolicitada), size: String(TAMANIO_PAGINA) });
            if (metodoFiltro === 'estado') {
                if (busqueda) params.set('estado', busqueda);
            } else {
                if (desde) params.set('desde', desde);
                if (hasta) params.set('hasta', hasta);
            }

            const respuesta = await fetch(`http://localhost:8080/api/planilla/buscar/paginado?${params.toString()}`);
            if (!respuesta.ok) {
                throw new Error(`Error del servidor: ${respuesta.status}`);
            }
            const data = await respuesta.json();

            const listaPlanillasFormateado = Array.isArray(data.content)
                ? data.content.map(planilla => ({
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
            setTotalPaginas(data.totalPages ?? 0);
            setTotalElementos(data.totalElements ?? 0);
            setPagina(paginaSolicitada);
        } catch (e) {
            console.error("Hubo un problema con el fetch:", e);
            setError('Error al conectar con el servidor.');
        } finally {
            setCargando(false);
        }
    }, [metodoFiltro, busqueda, desde, hasta]);

    // Al montar y cada vez que cambia el criterio de busqueda se vuelve a la primera pagina.
    useEffect(() => {
        obtenerPlanillas(0);
    }, [obtenerPlanillas]);

    const cambiarPagina = (nuevaPagina) => obtenerPlanillas(nuevaPagina);

    return (
        <main style={{
            padding: '20px',
            backgroundColor: 'var(--bg)',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
        }}>

            <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', padding: '15px 20px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
                <h2 style={{ margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}><HiOutlineDocumentText /> Planillas</h2>
            </div>

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

            <MensajeError mensaje={error} />

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
                        {planillas.length === 0 ? (
                            <tr>
                                <td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    {cargando ? "Cargando planillas..." : "No se encontraron planillas con esa búsqueda."}
                                </td>
                            </tr>
                        ) : (
                            planillas.map((planilla) => (
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

            <Paginador
                pagina={pagina}
                totalPaginas={totalPaginas}
                totalElementos={totalElementos}
                onCambiarPagina={cambiarPagina}
                cargando={cargando}
            />

        </main>
    );
}

export default VistaPlanillas;

import { useState, useEffect } from 'react';
import ModalResumenCobro from '../Modals/ModalResumenCobro';
import '../Estilos/Botones.css';

function VistaClienteDeudas({ cliente, volver }) {
    const [boletas, setBoletas] = useState([]);
    const [catalogoProductos, setCatalogoProductos] = useState([]);
    const [planillas, setPlanillas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [mostrarMenuPago, setMostrarMenuPago] = useState(false);
    const [modoSeleccion, setModoSeleccion] = useState(false);
    const [idsSeleccionados, setIdsSeleccionados] = useState([]);
    const [mostrarResumenCobro, setMostrarResumenCobro] = useState(false);

    const cargarDeudas = async () => {
        if (!cliente || !cliente.id) return;

        try {
            const [resBol, resProd, resPla] = await Promise.all([
                fetch(`http://localhost:8080/api/boleta/cliente/${cliente.id}/deudas`),
                fetch('http://localhost:8080/api/productos/All'),
                fetch('http://localhost:8080/api/planilla/All')
            ]);

            if (!resBol.ok) {
                throw new Error(`Error del servidor: ${resBol.status}`);
            }

            if (resProd.ok) setCatalogoProductos(await resProd.json());
            if (resPla.ok) setPlanillas(await resPla.json());

            const datosBoletas = await resBol.json();
            setBoletas(datosBoletas);
        } catch (e) {
            console.error("Error al cargar las deudas del cliente:", e);
            setError('Error al conectar con el servidor.');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarDeudas();
    }, [cliente]);

    if (!cliente) return <p>No se seleccionó ningún cliente...</p>;

    const nombreProducto = (id) => {
        const p = catalogoProductos.find(prod => String(prod.id) === String(id));
        return p ? p.nombre : `Prod #${id}`;
    };

    const fechaPlanilla = (id_planilla) => {
        const p = planillas.find(pla => String(pla.id) === String(id_planilla));
        return p ? p.fecha : '-';
    };

    const formatearMoneda = (val) => {
        return (val ?? 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
    };

    const boletasOrdenadas = [...boletas].sort((a, b) => {
        const fechaA = fechaPlanilla(a.id_planilla);
        const fechaB = fechaPlanilla(b.id_planilla);
        return fechaA < fechaB ? 1 : fechaA > fechaB ? -1 : 0;
    });

    const totalDeuda = boletas.reduce((acumulado, boleta) => acumulado + (boleta.total || 0), 0);

    const boletasSeleccionadas = boletas.filter(b => idsSeleccionados.includes(b.id));
    const totalSeleccionado = boletasSeleccionadas.reduce((acumulado, boleta) => acumulado + (boleta.total || 0), 0);

    const iniciarSeleccionBoletas = () => {
        setMostrarMenuPago(false);
        setIdsSeleccionados([]);
        setModoSeleccion(true);
    };

    const cancelarSeleccionBoletas = () => {
        setModoSeleccion(false);
        setIdsSeleccionados([]);
    };

    const alternarSeleccionBoleta = (id_boleta) => {
        setIdsSeleccionados(prev =>
            prev.includes(id_boleta) ? prev.filter(id => id !== id_boleta) : [...prev, id_boleta]
        );
    };

    const handleCobroConfirmado = async () => {
        setMostrarResumenCobro(false);
        cancelarSeleccionBoletas();
        setCargando(true);
        await cargarDeudas();
    };

    return (
        <main style={{ padding: '20px', backgroundColor: '#f4f6f8', minHeight: 'calc(100vh - 70px)', display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* ENCABEZADO Y BOTÓN VOLVER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '15px 20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <div>
                    <h2 style={{ margin: 0, color: '#2c3e50', textTransform: 'capitalize' }}>💰 Deudas de {cliente.nombre}</h2>
                    <p style={{ margin: '5px 0 0 0', color: '#7f8c8d' }}>
                        CUIT/L: <strong>{cliente.documento}</strong>
                        {cliente.telefono ? <> | Tel: <strong>{cliente.telefono}</strong></> : null}
                        {cliente.direccion ? <> | Dirección: <strong>{cliente.direccion}</strong></> : null}
                    </p>
                </div>
                <button className="btn-global btn-secundario" onClick={volver} style={{ fontSize: '1rem' }}>
                    ← Volver a Clientes
                </button>
            </div>

            {error && <p style={{ color: '#e74c3c', fontWeight: 'bold', margin: 0 }}>{error}</p>}

            {/* CAJITAS DE DEUDA / SALDO A FAVOR + ACCIÓN DE PAGO */}
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'stretch' }}>
                <div style={{ flex: 1, minWidth: '220px', backgroundColor: 'white', padding: '15px', borderRadius: '8px', borderLeft: '5px solid #e74c3c', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <span style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>Deuda Total</span>
                    <h3 style={{ margin: '5px 0 0 0', fontSize: '1.5rem', color: '#e74c3c' }}>
                        {formatearMoneda(totalDeuda)}
                    </h3>
                </div>

                <div style={{ flex: 1, minWidth: '220px', backgroundColor: 'white', padding: '15px', borderRadius: '8px', borderLeft: '5px solid #27ae60', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <span style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>Saldo a Favor</span>
                    <h3 style={{ margin: '5px 0 0 0', fontSize: '1.5rem', color: '#27ae60' }}>
                        {formatearMoneda(cliente.saldo_a_favor)}
                    </h3>
                </div>

                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <button
                        className="btn-global btn-primario"
                        onClick={() => setMostrarMenuPago(prev => !prev)}
                        style={{ fontSize: '1rem', padding: '12px 20px', height: 'fit-content' }}
                    >
                        💵 Cobrar Deudas
                    </button>

                    {mostrarMenuPago && (
                        <div style={{
                            position: 'absolute',
                            top: 'calc(100% + 8px)',
                            right: 0,
                            backgroundColor: 'white',
                            borderRadius: '8px',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                            overflow: 'hidden',
                            zIndex: 10,
                            minWidth: '200px'
                        }}>
                            <button
                                onClick={iniciarSeleccionBoletas}
                                style={{
                                    display: 'block', width: '100%', textAlign: 'left', padding: '12px 16px',
                                    border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '0.95rem', color: '#2c3e50'
                                }}
                            >
                                🧾 Seleccionar Boletas
                            </button>
                            <button
                                onClick={() => setMostrarMenuPago(false)}
                                style={{
                                    display: 'block', width: '100%', textAlign: 'left', padding: '12px 16px',
                                    border: 'none', borderTop: '1px solid #eee', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '0.95rem', color: '#2c3e50'
                                }}
                            >
                                💰 Pago a Cuenta
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* BARRA DE SELECCIÓN DE BOLETAS */}
            {modoSeleccion && (
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    backgroundColor: '#fffbe6', border: '1px solid #f1c40f', borderRadius: '8px',
                    padding: '12px 20px'
                }}>
                    <span style={{ fontWeight: 'bold', color: '#2c3e50' }}>
                        {idsSeleccionados.length} boleta(s) seleccionada(s) — Total a Cobrar: <span style={{ color: '#27ae60' }}>{formatearMoneda(totalSeleccionado)}</span>
                    </span>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn-global btn-secundario" onClick={cancelarSeleccionBoletas}>
                            Cancelar
                        </button>
                        <button
                            className="btn-global btn-primario-green"
                            disabled={idsSeleccionados.length === 0}
                            onClick={() => setMostrarResumenCobro(true)}
                        >
                            Confirmar Selección
                        </button>
                    </div>
                </div>
            )}

            {/* LISTADO DE BOLETAS IMPAGAS */}
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', flexGrow: 1 }}>
                <h3 style={{ marginTop: 0, color: '#2c3e50', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                    🧾 Boletas Pendientes de Pago
                </h3>

                {cargando ? (
                    <p style={{ textAlign: 'center', color: '#888' }}>Cargando deudas...</p>
                ) : boletasOrdenadas.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#888', padding: '20px' }}>
                        Este cliente no tiene boletas pendientes de pago en planillas cerradas.
                    </p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
                        {boletasOrdenadas.map((boleta) => (
                            <div key={boleta.id} style={{
                                display: 'flex', alignItems: 'flex-start', gap: '12px',
                                border: idsSeleccionados.includes(boleta.id) ? '2px solid #27ae60' : '1px solid #eee',
                                borderRadius: '8px', padding: '15px',
                                backgroundColor: idsSeleccionados.includes(boleta.id) ? '#f0fff4' : 'white'
                            }}>
                                {modoSeleccion && (
                                    <input
                                        type="checkbox"
                                        checked={idsSeleccionados.includes(boleta.id)}
                                        onChange={() => alternarSeleccionBoleta(boleta.id)}
                                        style={{ marginTop: '4px', width: '18px', height: '18px', cursor: 'pointer' }}
                                    />
                                )}
                                <div style={{ flexGrow: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                        <span style={{ fontWeight: 'bold', color: '#2c3e50' }}>
                                            📅 Fecha: {fechaPlanilla(boleta.id_planilla)}
                                        </span>
                                        <span style={{ fontWeight: 'bold', fontSize: '1.05rem', color: '#c0392b' }}>
                                            {formatearMoneda(boleta.total)}
                                        </span>
                                    </div>
                                    <ul style={{ margin: 0, paddingLeft: '20px', listStyleType: 'square', color: '#34495e' }}>
                                        {(boleta.ventas || []).map((itemProd, i) => (
                                            <li key={i} style={{ marginBottom: '3px', textTransform: 'capitalize' }}>
                                                <strong>{itemProd.cantidad}x</strong> {nombreProducto(itemProd.id_producto)}
                                                <span style={{ color: '#7f8c8d', fontSize: '0.85rem' }}> (c/u: {formatearMoneda(itemProd.precio_unitario)})</span>
                                                <span style={{ color: '#7f8c8d', fontSize: '0.85rem' }}>
                                                    {' '}- Vacío: {itemProd.precio_vacio > 0 ? formatearMoneda(itemProd.precio_vacio) : 'suelto'}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {mostrarResumenCobro && (
                <ModalResumenCobro
                    cliente={cliente}
                    boletasSeleccionadas={boletasSeleccionadas}
                    nombreProducto={nombreProducto}
                    fechaPlanilla={fechaPlanilla}
                    formatearMoneda={formatearMoneda}
                    cerrarModal={() => setMostrarResumenCobro(false)}
                    onCobroConfirmado={handleCobroConfirmado}
                />
            )}

        </main>
    );
}

export default VistaClienteDeudas;

import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
import ModalResumenCobro from '../Modals/ModalResumenCobro';
import ModalPagoACuenta from '../Modals/ModalPagoACuenta';
import AlertaEmergente from '../Alertas/AlertaEmergente';
import '../Estilos/Botones.css';

const capitalizar = (texto) => {
    if (!texto) return '';
    return texto.replace(/\b\w/g, (letra) => letra.toUpperCase());
};

function PuntoInformativo({ texto }) {
    const [mostrar, setMostrar] = useState(false);

    return (
        <span
            style={{ position: 'relative', display: 'inline-flex' }}
            onMouseEnter={() => setMostrar(true)}
            onMouseLeave={() => setMostrar(false)}
        >
            <span
                style={{
                    cursor: 'help', color: '#95a5a6', fontSize: '0.75rem', fontWeight: 'bold',
                    border: '1px solid #95a5a6', borderRadius: '50%', width: '15px', height: '15px',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                }}
            >
                i
            </span>

            {mostrar && (
                <div style={{
                    position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)',
                    backgroundColor: '#2c3e50', color: 'white', padding: '8px 12px', borderRadius: '6px',
                    fontSize: '0.8rem', fontWeight: '400', whiteSpace: 'normal', width: '220px', textAlign: 'left',
                    lineHeight: '1.4', boxShadow: '0 4px 10px rgba(0,0,0,0.15)', zIndex: 20
                }}>
                    {texto}
                </div>
            )}
        </span>
    );
}

function VistaClienteDeudas({ cliente, volver }) {
    const [clienteActual, setClienteActual] = useState(cliente);
    const [boletas, setBoletas] = useState([]);
    const [catalogoProductos, setCatalogoProductos] = useState([]);
    const [planillas, setPlanillas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [mostrarMenuPago, setMostrarMenuPago] = useState(false);
    const [modoSeleccion, setModoSeleccion] = useState(false);
    const [idsSeleccionados, setIdsSeleccionados] = useState([]);
    const [mostrarResumenCobro, setMostrarResumenCobro] = useState(false);
    const [mostrarPagoACuenta, setMostrarPagoACuenta] = useState(false);
    const [mensajeExport, setMensajeExport] = useState(null);
    const [tipoExport, setTipoExport] = useState('exito');

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

    const refrescarCliente = async () => {
        if (!cliente || !cliente.documento) return;
        try {
            const respuesta = await fetch(`http://localhost:8080/api/clientes/buscar/documento/${cliente.documento}`);
            if (respuesta.ok) setClienteActual(await respuesta.json());
        } catch (e) {
            console.error("Error al refrescar el cliente:", e);
        }
    };

    useEffect(() => {
        setClienteActual(cliente);
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
    const deudaActual = Math.max(0, totalDeuda - (clienteActual.saldo_a_favor || 0));

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

    const todasSeleccionadas = boletasOrdenadas.length > 0 && idsSeleccionados.length === boletasOrdenadas.length;

    const alternarSeleccionarTodas = () => {
        setIdsSeleccionados(todasSeleccionadas ? [] : boletasOrdenadas.map(b => b.id));
    };

    const handleCobroConfirmado = async () => {
        setMostrarResumenCobro(false);
        cancelarSeleccionBoletas();
        setCargando(true);
        await Promise.all([cargarDeudas(), refrescarCliente()]);
    };

    const handlePagoConfirmado = async () => {
        setMostrarPagoACuenta(false);
        setMostrarMenuPago(false);
        setCargando(true);
        await Promise.all([cargarDeudas(), refrescarCliente()]);
    };

    const exportarPDF = async () => {
        const doc = new jsPDF();
        const anchoPagina = doc.internal.pageSize.getWidth();

        doc.setFontSize(16);
        doc.setTextColor(44, 62, 80);
        doc.text('MercadoApp', 14, 18);
        doc.setFontSize(10);
        doc.setTextColor(127, 127, 127);
        doc.text('Deudas del cliente', 14, 24);

        doc.setFontSize(10);
        doc.setTextColor(85, 85, 85);
        doc.text(capitalizar(clienteActual.nombre), anchoPagina - 14, 15, { align: 'right' });
        doc.text(`CUIT/L: ${clienteActual.documento}`, anchoPagina - 14, 20, { align: 'right' });
        doc.setTextColor(150, 150, 150);
        doc.text(`Generado: ${new Date().toLocaleString('es-AR')}`, anchoPagina - 14, 25, { align: 'right' });

        doc.setDrawColor(44, 62, 80);
        doc.setLineWidth(0.5);
        doc.line(14, 29, anchoPagina - 14, 29);

        const anchoCaja = (anchoPagina - 28 - 5) / 2;
        const cajas = [
            { titulo: 'Deuda actual', valor: formatearMoneda(deudaActual), color: [192, 57, 43] },
            { titulo: 'Saldo del Cliente', valor: formatearMoneda(clienteActual.saldo_a_favor), color: [39, 174, 96] },
        ];

        cajas.forEach((caja, i) => {
            const x = 14 + i * (anchoCaja + 5);
            doc.setFillColor(...caja.color);
            doc.rect(x, 34, 1, 14, 'F');
            doc.setDrawColor(224, 224, 224);
            doc.rect(x, 34, anchoCaja, 14);
            doc.setFontSize(8);
            doc.setTextColor(127, 127, 127);
            doc.text(caja.titulo, x + 4, 39);
            doc.setFontSize(11);
            doc.setTextColor(...caja.color);
            doc.text(caja.valor, x + 4, 45);
        });

        const filas = boletasOrdenadas.map(boleta => {
            const productos = (boleta.ventas || [])
                .map(v => `${v.cantidad}x ${capitalizar(nombreProducto(v.id_producto))} - ${formatearMoneda(v.precio_unitario)} c/u / vacío: ${v.precio_vacio > 0 ? formatearMoneda(v.precio_vacio) : 'Sin Vacio'}`)
                .join('\n');

            return [
                fechaPlanilla(boleta.id_planilla),
                productos,
                formatearMoneda(boleta.total),
            ];
        });

        autoTable(doc, {
            startY: 56,
            head: [['Fecha Planilla', 'Productos', 'Total']],
            body: filas,
            styles: { fontSize: 8, cellPadding: 3, valign: 'top' },
            headStyles: { fillColor: [44, 62, 80], textColor: 255 },
            alternateRowStyles: { fillColor: [250, 250, 250] },
            columnStyles: {
                1: { cellWidth: 110 },
                2: { halign: 'right' },
            },
            didDrawPage: () => {
                const alturaPagina = doc.internal.pageSize.getHeight();
                doc.setFontSize(8);
                doc.setTextColor(180, 180, 180);
                doc.text('MercadoApp — reporte generado automáticamente', 14, alturaPagina - 10);
                doc.text(`Página ${doc.internal.getNumberOfPages()}`, anchoPagina - 14, alturaPagina - 10, { align: 'right' });
            },
        });

        doc.setFontSize(11);
        doc.setTextColor(44, 62, 80);
        doc.text(`Deuda actual: ${formatearMoneda(deudaActual)}`, anchoPagina - 14, doc.lastAutoTable.finalY + 8, { align: 'right' });

        const nombreArchivo = `deudas_${(clienteActual.nombre || 'cliente').replace(/\s+/g, '_')}.pdf`;
        const esTauri = typeof window !== 'undefined' && window.__TAURI_INTERNALS__;

        if (!esTauri) {
            doc.save(nombreArchivo);
            setTipoExport('exito');
            setMensajeExport(`PDF descargado como "${nombreArchivo}".`);
            return;
        }

        try {
            const rutaElegida = await save({
                defaultPath: nombreArchivo,
                filters: [{ name: 'PDF', extensions: ['pdf'] }],
            });

            if (!rutaElegida) return;

            const bytesPDF = doc.output('arraybuffer');
            await writeFile(rutaElegida, new Uint8Array(bytesPDF));
            setTipoExport('exito');
            setMensajeExport(`PDF exportado correctamente en: ${rutaElegida}`);
        } catch (error) {
            console.error("Error al exportar el PDF:", error);
            setTipoExport('error');
            setMensajeExport('Hubo un error al exportar el PDF.');
        }
    };

    return (
        <main style={{ padding: '20px', backgroundColor: '#f4f6f8', minHeight: 'calc(100vh - 70px)', display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* ENCABEZADO Y BOTÓN VOLVER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '15px 20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <div>
                    <h2 style={{ margin: 0, color: '#2c3e50', textTransform: 'capitalize' }}>💰 Deudas de {clienteActual.nombre}</h2>
                    <p style={{ margin: '5px 0 0 0', color: '#7f8c8d' }}>
                        CUIT/L: <strong>{clienteActual.documento}</strong>
                        {clienteActual.telefono ? <> | Tel: <strong>{clienteActual.telefono}</strong></> : null}
                        {clienteActual.direccion ? <> | Dirección: <strong>{clienteActual.direccion}</strong></> : null}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn-global btn-primario" onClick={exportarPDF} style={{ fontSize: '1rem' }}>
                        📄 Exportar PDF
                    </button>
                    <button className="btn-global btn-secundario" onClick={volver} style={{ fontSize: '1rem' }}>
                        ← Volver a Clientes
                    </button>
                </div>
            </div>

            {error && <p style={{ color: '#e74c3c', fontWeight: 'bold', margin: 0 }}>{error}</p>}

            {/* CAJITAS DE DEUDA / SALDO A FAVOR + ACCIÓN DE PAGO */}
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'stretch' }}>
                <div style={{ flex: 1, minWidth: '220px', backgroundColor: 'white', padding: '15px', borderRadius: '8px', borderLeft: '5px solid #e74c3c', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <span style={{ color: '#7f8c8d', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        Deuda Total
                        <PuntoInformativo texto="Suma de todas las boletas del cliente que todavía están sin pagar." />
                    </span>
                    <h3 style={{ margin: '5px 0 0 0', fontSize: '1.5rem', color: '#e74c3c' }}>
                        {formatearMoneda(totalDeuda)}
                    </h3>
                </div>

                <div style={{ flex: 1, minWidth: '220px', backgroundColor: 'white', padding: '15px', borderRadius: '8px', borderLeft: '5px solid #27ae60', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <span style={{ color: '#7f8c8d', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        Saldo del Cliente
                        <PuntoInformativo texto="Dinero que el cliente entregó de más y todavía no se usó para pagar deudas. Se descuenta automáticamente del próximo cobro." />
                    </span>
                    <h3 style={{ margin: '5px 0 0 0', fontSize: '1.5rem', color: '#27ae60' }}>
                        {formatearMoneda(clienteActual.saldo_a_favor)}
                    </h3>
                </div>

                <div style={{ flex: 1, minWidth: '220px', backgroundColor: 'white', padding: '15px', borderRadius: '8px', borderLeft: '5px solid #c0392b', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <span style={{ color: '#7f8c8d', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        Deuda Actual
                        <PuntoInformativo texto="Deuda Total menos el Saldo del Cliente. Es lo que realmente falta cobrar." />
                    </span>
                    <h3 style={{ margin: '5px 0 0 0', fontSize: '1.5rem', color: '#c0392b' }}>
                        {formatearMoneda(deudaActual)}
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
                                onClick={() => { setMostrarMenuPago(false); setMostrarPagoACuenta(true); }}
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', color: '#2c3e50', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={todasSeleccionadas}
                                onChange={alternarSeleccionarTodas}
                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            />
                            Seleccionar Todos
                        </label>
                        <span style={{ fontWeight: 'bold', color: '#2c3e50' }}>
                            {idsSeleccionados.length} boleta(s) seleccionada(s) — Total a Cobrar: <span style={{ color: '#27ae60' }}>{formatearMoneda(totalSeleccionado)}</span>
                        </span>
                    </div>
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
                                                    {' '}- Vacío: {itemProd.precio_vacio > 0 ? formatearMoneda(itemProd.precio_vacio) : 'Sin Vacio'}
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
                    cliente={clienteActual}
                    boletasSeleccionadas={boletasSeleccionadas}
                    nombreProducto={nombreProducto}
                    fechaPlanilla={fechaPlanilla}
                    formatearMoneda={formatearMoneda}
                    cerrarModal={() => setMostrarResumenCobro(false)}
                    onCobroConfirmado={handleCobroConfirmado}
                />
            )}

            {mostrarPagoACuenta && (
                <ModalPagoACuenta
                    cliente={clienteActual}
                    fechaPlanilla={fechaPlanilla}
                    formatearMoneda={formatearMoneda}
                    cerrarModal={() => setMostrarPagoACuenta(false)}
                    onPagoConfirmado={handlePagoConfirmado}
                />
            )}

            <AlertaEmergente
                mensaje={mensajeExport}
                tipo={tipoExport}
                onClose={() => setMensajeExport(null)}
            />

        </main>
    );
}

export default VistaClienteDeudas;

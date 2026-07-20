import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
import ModalResumenCobro from '../Modals/ModalResumenCobro';
import ModalPagoACuenta from '../Modals/ModalPagoACuenta';
import ModalVerBoleta from '../Modals/ModalVerBoleta';
import AlertaEmergente from '../Alertas/AlertaEmergente';
import { formatearFechaVisual } from '../../utils/formatoFecha';
import { HiOutlineBanknotes, HiOutlineDocumentArrowDown, HiOutlineTicket, HiOutlineCalendarDays } from 'react-icons/hi2';
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
                    cursor: 'help', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 'bold',
                    border: '1px solid var(--text-muted)', borderRadius: '50%', width: '15px', height: '15px',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                }}
            >
                i
            </span>

            {mostrar && (
                <div style={{
                    position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)',
                    backgroundColor: 'var(--surface-inverse)', color: 'var(--text-on-inverse)', padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem', fontWeight: '400', whiteSpace: 'normal', width: '220px', textAlign: 'left',
                    lineHeight: '1.4', boxShadow: 'var(--shadow-md)', zIndex: 20
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
    const [boletaAVer, setBoletaAVer] = useState(null);
    const [empresa, setEmpresa] = useState(null);

    useEffect(() => {
        const cargarEmpresa = async () => {
            try {
                const respuesta = await fetch('http://localhost:8080/api/empresa');
                if (respuesta.ok) setEmpresa(await respuesta.json());
            } catch (error) {
                console.error("Error cargando datos de la empresa:", error);
            }
        };
        cargarEmpresa();
    }, []);

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

        let xTexto = 14;
        if (empresa?.logoBase64) {
            try {
                doc.addImage(empresa.logoBase64, 'PNG', 14, 7, 18, 18);
                xTexto = 36;
            } catch (error) {
                console.error('No se pudo agregar el logo al PDF:', error);
            }
        }

        // El bloque de datos de la empresa (izquierda) y el del cliente (derecha, alineado)
        // se mantienen cada uno en su mitad de la página para que nunca se solapen entre sí.
        const anchoMaximoTextoEmpresa = anchoPagina / 2 - xTexto - 4;

        const datosExtra = [empresa?.cuit ? `CUIT: ${empresa.cuit}` : null, empresa?.direccion]
            .filter(Boolean).join(' — ');

        doc.setFontSize(16);
        doc.setTextColor(44, 62, 80);
        doc.text(
            doc.splitTextToSize(empresa?.nombre ? capitalizar(empresa.nombre) : 'MercadoApp', anchoMaximoTextoEmpresa)[0],
            xTexto, 18
        );
        doc.setFontSize(10);
        doc.setTextColor(127, 127, 127);
        doc.text('Deudas del cliente', xTexto, 24);

        if (datosExtra) {
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(doc.splitTextToSize(datosExtra, anchoMaximoTextoEmpresa)[0], xTexto, 29);
        }

        doc.setFontSize(10);
        doc.setTextColor(85, 85, 85);
        doc.text(capitalizar(clienteActual.nombre), anchoPagina - 14, 15, { align: 'right' });
        doc.text(`${clienteActual.tipoDocumento === 'CUIT_L' ? 'CUIT/L' : 'DNI'}: ${clienteActual.documento}`, anchoPagina - 14, 20, { align: 'right' });
        doc.setTextColor(150, 150, 150);
        doc.text(`Generado: ${new Date().toLocaleString('es-AR', { hour12: false })}`, anchoPagina - 14, 25, { align: 'right' });

        doc.setDrawColor(44, 62, 80);
        doc.setLineWidth(0.5);
        doc.line(14, 34, anchoPagina - 14, 34);

        const anchoCaja = (anchoPagina - 28 - 5) / 2;
        const cajas = [
            { titulo: 'Deuda actual', valor: formatearMoneda(deudaActual), color: [192, 57, 43] },
            { titulo: 'Saldo del Cliente', valor: formatearMoneda(clienteActual.saldo_a_favor), color: [39, 174, 96] },
        ];

        cajas.forEach((caja, i) => {
            const x = 14 + i * (anchoCaja + 5);
            doc.setFillColor(...caja.color);
            doc.rect(x, 39, 1, 14, 'F');
            doc.setDrawColor(224, 224, 224);
            doc.rect(x, 39, anchoCaja, 14);
            doc.setFontSize(8);
            doc.setTextColor(127, 127, 127);
            doc.text(caja.titulo, x + 4, 44);
            doc.setFontSize(11);
            doc.setTextColor(...caja.color);
            doc.text(caja.valor, x + 4, 50);
        });

        const filas = boletasOrdenadas.map(boleta => {
            const productos = (boleta.ventas || [])
                .map(v => `${v.cantidad}x ${capitalizar(nombreProducto(v.id_producto))} - ${formatearMoneda(v.precio_unitario)} c/u / vacío: ${v.precio_vacio > 0 ? formatearMoneda(v.precio_vacio) : 'Sin Vacio'}`)
                .join('\n');

            return [
                formatearFechaVisual(fechaPlanilla(boleta.id_planilla)),
                productos,
                formatearMoneda(boleta.total),
            ];
        });

        autoTable(doc, {
            startY: 61,
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
                doc.text(`${empresa?.nombre ? capitalizar(empresa.nombre) : 'MercadoApp'} — reporte generado automáticamente`, 14, alturaPagina - 10);
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
        <main style={{ padding: '20px', backgroundColor: 'var(--bg)', height: '100%', display: 'flex', flexDirection: 'column', gap: '20px', overflow: 'hidden' }}>

            {/* ENCABEZADO Y BOTÓN VOLVER */}
            <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', padding: '15px 20px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
                <div>
                    <h2 style={{ margin: 0, color: 'var(--text-primary)', textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: '8px' }}><HiOutlineBanknotes style={{ textTransform: 'none' }} /> Deudas de {clienteActual.nombre}</h2>
                    <p style={{ margin: '5px 0 0 0', color: 'var(--text-secondary)' }}>
                        {clienteActual.tipoDocumento === 'CUIT_L' ? 'CUIT/L' : 'DNI'}: <strong>{clienteActual.documento}</strong>
                        {clienteActual.telefono ? <> | Tel: <strong>{clienteActual.telefono}</strong></> : null}
                        {clienteActual.direcciones?.length > 0 ? <> | Dirección: <strong>{clienteActual.direcciones.join(', ')}</strong></> : null}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn-global btn-primario" onClick={exportarPDF} style={{ fontSize: '1rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <HiOutlineDocumentArrowDown /> Exportar PDF
                    </button>
                    <button className="btn-global btn-secundario" onClick={volver} style={{ fontSize: '1rem' }}>
                        ← Volver a Clientes
                    </button>
                </div>
            </div>

            {error && <p style={{ color: 'var(--danger)', fontWeight: 'bold', margin: 0 }}>{error}</p>}

            {/* CAJITAS DE DEUDA / SALDO A FAVOR + ACCIÓN DE PAGO */}
            <div style={{ flexShrink: 0, display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'stretch' }}>
                <div style={{ flex: 1, minWidth: '220px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', padding: '15px', borderRadius: 'var(--radius-lg)', borderLeft: '5px solid var(--danger)', boxShadow: 'var(--shadow-sm)' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        Deuda Total
                        <PuntoInformativo texto="Suma de todas las boletas del cliente que todavía están sin pagar." />
                    </span>
                    <h3 style={{ margin: '5px 0 0 0', fontSize: '1.5rem', color: 'var(--danger)' }}>
                        {formatearMoneda(totalDeuda)}
                    </h3>
                </div>

                <div style={{ flex: 1, minWidth: '220px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', padding: '15px', borderRadius: 'var(--radius-lg)', borderLeft: '5px solid var(--success)', boxShadow: 'var(--shadow-sm)' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        Saldo del Cliente
                        <PuntoInformativo texto="Dinero que el cliente entregó de más y todavía no se usó para pagar deudas. Se descuenta automáticamente del próximo cobro." />
                    </span>
                    <h3 style={{ margin: '5px 0 0 0', fontSize: '1.5rem', color: 'var(--success)' }}>
                        {formatearMoneda(clienteActual.saldo_a_favor)}
                    </h3>
                </div>

                <div style={{ flex: 1, minWidth: '220px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', padding: '15px', borderRadius: 'var(--radius-lg)', borderLeft: '5px solid var(--danger)', boxShadow: 'var(--shadow-sm)' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        Deuda Actual
                        <PuntoInformativo texto="Deuda Total menos el Saldo del Cliente. Es lo que realmente falta cobrar." />
                    </span>
                    <h3 style={{ margin: '5px 0 0 0', fontSize: '1.5rem', color: 'var(--danger)' }}>
                        {formatearMoneda(deudaActual)}
                    </h3>
                </div>

                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <button
                        className="btn-global btn-primario"
                        onClick={() => setMostrarMenuPago(prev => !prev)}
                        style={{ fontSize: '1rem', padding: '12px 20px', height: 'fit-content', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                        <HiOutlineBanknotes /> Cobrar Deudas
                    </button>

                    {mostrarMenuPago && (
                        <div style={{
                            position: 'absolute',
                            top: 'calc(100% + 8px)',
                            right: 0,
                            backgroundColor: 'var(--surface)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-md)',
                            boxShadow: 'var(--shadow-md)',
                            overflow: 'hidden',
                            zIndex: 10,
                            minWidth: '200px'
                        }}>
                            <button
                                onClick={iniciarSeleccionBoletas}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '8px', width: '100%', textAlign: 'left', padding: '12px 16px',
                                    border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '0.95rem', color: 'var(--text-primary)'
                                }}
                            >
                                <HiOutlineTicket /> Seleccionar Boletas
                            </button>
                            <button
                                onClick={() => { setMostrarMenuPago(false); setMostrarPagoACuenta(true); }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '8px', width: '100%', textAlign: 'left', padding: '12px 16px',
                                    border: 'none', borderTop: '1px solid var(--border)', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '0.95rem', color: 'var(--text-primary)'
                                }}
                            >
                                <HiOutlineBanknotes /> Pago a Cuenta
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* BARRA DE SELECCIÓN DE BOLETAS */}
            {modoSeleccion && (
                <div style={{
                    flexShrink: 0,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    backgroundColor: 'var(--warning-soft)', border: '1px solid var(--warning)', borderRadius: 'var(--radius-lg)',
                    padding: '12px 20px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', color: 'var(--text-primary)', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={todasSeleccionadas}
                                onChange={alternarSeleccionarTodas}
                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            />
                            Seleccionar Todos
                        </label>
                        <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                            {idsSeleccionados.length} boleta(s) seleccionada(s) — Total a Cobrar: <span style={{ color: 'var(--success)' }}>{formatearMoneda(totalSeleccionado)}</span>
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
            <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', padding: '20px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <h3 style={{ flexShrink: 0, marginTop: 0, color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <HiOutlineTicket /> Boletas Pendientes de Pago
                </h3>

                {cargando ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Cargando deudas...</p>
                ) : boletasOrdenadas.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
                        Este cliente no tiene boletas pendientes de pago en planillas cerradas.
                    </p>
                ) : (
                    <div style={{ flex: 1, minHeight: 0, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
                        {boletasOrdenadas.map((boleta) => (
                            <div key={boleta.id} style={{
                                display: 'flex', alignItems: 'flex-start', gap: '12px',
                                border: idsSeleccionados.includes(boleta.id) ? '2px solid var(--success)' : '1px solid var(--border)',
                                borderRadius: 'var(--radius-lg)', padding: '15px',
                                backgroundColor: idsSeleccionados.includes(boleta.id) ? 'var(--success-soft)' : 'var(--surface)'
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
                                        <span style={{ fontWeight: 'bold', color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                            <HiOutlineCalendarDays /> Fecha: {formatearFechaVisual(fechaPlanilla(boleta.id_planilla))}
                                        </span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <button
                                                className="btn-global btn-secundario"
                                                onClick={() => setBoletaAVer(boleta)}
                                                style={{ fontSize: '0.85rem', padding: '4px 10px' }}
                                                title="Ver Boleta"
                                            >
                                                Ver
                                            </button>
                                            <span style={{ fontWeight: 'bold', fontSize: '1.05rem', color: 'var(--danger)' }}>
                                                {formatearMoneda(boleta.total)}
                                            </span>
                                        </div>
                                    </div>
                                    <ul style={{ margin: 0, paddingLeft: '20px', listStyleType: 'square', color: 'var(--text-secondary)' }}>
                                        {(boleta.ventas || []).map((itemProd, i) => (
                                            <li key={i} style={{ marginBottom: '3px', textTransform: 'capitalize' }}>
                                                <strong>{itemProd.cantidad}x</strong> {nombreProducto(itemProd.id_producto)}
                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}> (c/u: {formatearMoneda(itemProd.precio_unitario)})</span>
                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
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

            {boletaAVer && (
                <ModalVerBoleta
                    boleta={boletaAVer}
                    nombreCliente={clienteActual.nombre}
                    nombreProducto={nombreProducto}
                    formatearMoneda={formatearMoneda}
                    fecha={formatearFechaVisual(fechaPlanilla(boletaAVer.id_planilla))}
                    cerrarModal={() => setBoletaAVer(null)}
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

import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
import ModalModificarBoleta from '../Modals/ModalModificarBoleta';
import ModalVerBoleta from '../Modals/ModalVerBoleta';
import AlertaEmergente from '../Alertas/AlertaEmergente';
import { formatearFechaVisual } from '../../utils/formatoFecha';
import { HiOutlineLockClosed, HiOutlineDocumentArrowDown, HiOutlineCube, HiOutlineTicket } from 'react-icons/hi2';
import SelectPersonalizado from '../UI/SelectPersonalizado';
import MenuAccionesInline from '../UI/MenuAccionesInline';
import '../Estilos/Formularios.css';
import '../Estilos/Botones.css';

const capitalizar = (texto) => {
    if (!texto) return '';
    return texto.replace(/\b\w/g, (letra) => letra.toUpperCase());
};

const NOMBRES_FORMA_PAGO = {
    EFECTIVO: 'Efectivo',
    MERCADO_PAGO: 'Mercado Pago',
    TRANSFERENCIA_BANCARIA: 'Transferencia Bancaria',
    OTROS: 'Otros',
};

const formaPagoLegible = (boleta) => {
    if (boleta.estadoPago === 'NO_PAGADO') return '-';
    return NOMBRES_FORMA_PAGO[boleta.formaPago] || '-';
};

function VistaPlanillaCerrada({ planilla, volver }) {
    const [catalogoProductos, setCatalogoProductos] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [boletas, setBoletas] = useState([]);
    const [busquedaCliente, setBusquedaCliente] = useState('');
    const [filtroPago, setFiltroPago] = useState('');
    const [filtroEntrega, setFiltroEntrega] = useState('');
    const [configOrden, setConfigOrden] = useState({ columna: null, direccion: 'asc' });
    const [totalesPlanilla, setTotalesPlanilla] = useState({
        ingresoTotal: planilla?.ingresoTotal,
        deudaTotal: planilla?.deudaTotal,
        stockProductos: planilla?.stockProductos || []
    });
    const [boletaAEditar, setBoletaAEditar] = useState(null);
    const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
    const [boletaAVer, setBoletaAVer] = useState(null);
    const [filaSobreCursor, setFilaSobreCursor] = useState(null);
    const [mensajeExport, setMensajeExport] = useState(null);
    const [tipoExport, setTipoExport] = useState('exito');
    const [empresa, setEmpresa] = useState(null);

    useEffect(() => {
        const cargarDatos = async () => {
            if (!planilla || !planilla.id) return;

            try {
                const [resProd, resCli, resBol] = await Promise.all([
                    fetch('http://localhost:8080/api/productos/All'),
                    fetch('http://localhost:8080/api/clientes/All'),
                    fetch(`http://localhost:8080/api/boleta/planilla/${planilla.id}`)
                ]);

                if (resProd.ok) setCatalogoProductos(await resProd.json());
                if (resCli.ok) setClientes(await resCli.json());
                if (resBol.ok) {
                    const datosBoletas = await resBol.json();
                    setBoletas(datosBoletas);
                    console.log("✅ Boletas cargadas para esta planilla:", datosBoletas);
                }
            } catch (error) {
                console.error("Error cargando datos en vista cerrada:", error);
            } finally {
                setCargando(false);
            }
        };

        cargarDatos();
    }, [planilla]);

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

    if (!planilla) return <p>No se seleccionó ninguna planilla...</p>;

    // Funciones traductoras
    const nombreCliente = (id) => {
        const c = clientes.find(cli => String(cli.id) === String(id));
        return c ? c.nombre : `Cliente #${id}`;
    };

    const nombreProducto = (id) => {
        const p = catalogoProductos.find(prod => String(prod.id) === String(id));
        return p ? p.nombre : `Prod #${id}`;
    };

    const formatearMoneda = (val) => {
        return (val ?? 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
    };

    const refrescarTotalesPlanilla = async () => {
        try {
            const respuesta = await fetch(`http://localhost:8080/api/planilla/${planilla.id}`);
            if (respuesta.ok) {
                const planillaActualizada = await respuesta.json();
                setTotalesPlanilla({
                    ingresoTotal: planillaActualizada.ingresoTotal,
                    deudaTotal: planillaActualizada.deudaTotal,
                    stockProductos: planillaActualizada.stockProductos || []
                });
            }
        } catch (error) {
            console.error("Error al refrescar los totales de la planilla:", error);
        }
    };

    const abrirEdicionBoleta = (boleta) => {
        setBoletaAEditar(boleta);
        setMostrarModalEditar(true);
    };

    const handleBoletaEditada = async (boletaActualizada) => {
        if (boletaActualizada) {
            setBoletas(prevBoletas =>
                prevBoletas.map(b => b.id === boletaActualizada.id ? boletaActualizada : b)
            );
            await refrescarTotalesPlanilla();
        }
    };

    const solicitarOrden = (columna) => {
        let direccion = 'asc';
        if (configOrden.columna === columna && configOrden.direccion === 'asc') {
            direccion = 'desc';
        }
        setConfigOrden({ columna, direccion });
    };

    const obtenerIconoOrden = (columna) => {
        if (configOrden.columna !== columna) return ' ↕️';
        return configOrden.direccion === 'asc' ? ' ⬇️' : ' ⬆️';
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

        // El bloque de datos de la empresa (izquierda) y el de la planilla (derecha, alineado)
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
        doc.text('Resumen de planilla cerrada', xTexto, 24);

        if (datosExtra) {
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(doc.splitTextToSize(datosExtra, anchoMaximoTextoEmpresa)[0], xTexto, 29);
        }

        doc.setFontSize(10);
        doc.setTextColor(85, 85, 85);
        doc.text(`Fecha planilla: ${formatearFechaVisual(planilla.fecha)}`, anchoPagina - 14, 15, { align: 'right' });
        doc.text('Estado: CERRADA', anchoPagina - 14, 20, { align: 'right' });
        doc.setTextColor(150, 150, 150);
        doc.text(`Generado: ${new Date().toLocaleString('es-AR', { hour12: false })}`, anchoPagina - 14, 25, { align: 'right' });

        doc.setDrawColor(44, 62, 80);
        doc.setLineWidth(0.5);
        doc.line(14, 34, anchoPagina - 14, 34);

        const anchoCaja = (anchoPagina - 28 - 10) / 3;
        const cajas = [
            { titulo: 'Ingresos totales', valor: formatearMoneda(totalesPlanilla.ingresoTotal), color: [39, 174, 96] },
            { titulo: 'Deuda pendiente', valor: formatearMoneda(totalesPlanilla.deudaTotal), color: [192, 57, 43] },
            { titulo: 'Boletas emitidas', valor: String(boletasProcesadas.length), color: [44, 62, 80] },
        ];

        cajas.forEach((caja, i) => {
            const x = 14 + i * (anchoCaja + 5);
            doc.setDrawColor(224, 224, 224);
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

        let cursorY = 61;

        const stockSobrante = (totalesPlanilla.stockProductos || [])
            .map(item => `${capitalizar(nombreProducto(item.id_producto))}: ${item.stock - item.stock_vendido} un.`)
            .join('   |   ');

        if (stockSobrante) {
            doc.setFontSize(9);
            doc.setTextColor(44, 62, 80);
            doc.text('Inventario sobrante al cierre:', 14, cursorY);
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            const lineasStock = doc.splitTextToSize(stockSobrante, anchoPagina - 28);
            doc.text(lineasStock, 14, cursorY + 5);
            cursorY += 5 + lineasStock.length * 4 + 4;
        }

        const textoEntregaPDF = (estadoEntrega) => {
            if (estadoEntrega === 'ENTREGADO') return 'ENTREGADO';
            if (estadoEntrega === 'PARCIAL') return 'ENTREGA PARCIAL';
            return 'NO ENTREGADO';
        };

        const filas = boletasProcesadas.map(boleta => {
            const esParcial = boleta.estadoEntrega === 'PARCIAL';
            const productos = (boleta.ventas || [])
                .map(v => {
                    const base = `${v.cantidad}x ${capitalizar(nombreProducto(v.id_producto))} - ${formatearMoneda(v.precio_unitario)} c/u / vacío: ${v.precio_vacio > 0 ? formatearMoneda(v.precio_vacio) : 'Sin Vacio'}`;
                    return esParcial ? `${base} (Entregado: ${v.cantidad_entregada || 0}/${v.cantidad})` : base;
                })
                .join('\n');

            return [
                capitalizar(nombreCliente(boleta.id_cliente)),
                boleta.estadoPago === 'NO_PAGADO' ? 'NO PAGADO' : 'PAGADO',
                textoEntregaPDF(boleta.estadoEntrega),
                formaPagoLegible(boleta),
                productos,
                formatearMoneda(boleta.total),
            ];
        });

        autoTable(doc, {
            startY: cursorY,
            head: [['Cliente', 'Pago', 'Entrega', 'Forma de Pago', 'Productos', 'Total']],
            body: filas,
            styles: { fontSize: 8, cellPadding: 3, valign: 'top' },
            headStyles: { fillColor: [44, 62, 80], textColor: 255 },
            alternateRowStyles: { fillColor: [250, 250, 250] },
            columnStyles: {
                4: { cellWidth: 70 },
                5: { halign: 'right' },
            },
            didParseCell: (data) => {
                if (data.section === 'body' && data.column.index === 1) {
                    const esPagado = data.cell.raw === 'PAGADO';
                    data.cell.styles.textColor = esPagado ? [39, 174, 96] : [192, 57, 43];
                    data.cell.styles.fontStyle = 'bold';
                }
                if (data.section === 'body' && data.column.index === 2) {
                    const valor = data.cell.raw;
                    data.cell.styles.textColor = valor === 'ENTREGADO' ? [41, 128, 185] : valor === 'ENTREGA PARCIAL' ? [230, 126, 34] : [192, 57, 43];
                    data.cell.styles.fontStyle = 'bold';
                }
            },
            didDrawPage: () => {
                const alturaPagina = doc.internal.pageSize.getHeight();
                doc.setFontSize(8);
                doc.setTextColor(180, 180, 180);
                doc.text('MercadoApp — reporte generado automáticamente', 14, alturaPagina - 10);
                doc.text(`Página ${doc.internal.getNumberOfPages()}`, anchoPagina - 14, alturaPagina - 10, { align: 'right' });
            },
        });

        const totalPlanilla = boletasProcesadas.reduce((acumulado, b) => acumulado + (b.total || 0), 0);
        doc.setFontSize(11);
        doc.setTextColor(44, 62, 80);
        doc.text(`Total planilla: ${formatearMoneda(totalPlanilla)}`, anchoPagina - 14, doc.lastAutoTable.finalY + 8, { align: 'right' });

        const nombreArchivo = `planilla_${planilla.fecha}.pdf`;
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

            if (!rutaElegida) return; // El usuario canceló el diálogo

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

    const boletasProcesadas = boletas
        .filter((boleta) => {
            const coincideCliente = !busquedaCliente || nombreCliente(boleta.id_cliente).toLowerCase().includes(busquedaCliente.toLowerCase());
            const coincidePago = !filtroPago || boleta.estadoPago === filtroPago;
            const coincideEntrega = !filtroEntrega || boleta.estadoEntrega === filtroEntrega;
            return coincideCliente && coincidePago && coincideEntrega;
        })
        .sort((a, b) => {
            if (!configOrden.columna) return 0;

            if (configOrden.columna === 'cliente') {
                const nombreA = nombreCliente(a.id_cliente).toLowerCase();
                const nombreB = nombreCliente(b.id_cliente).toLowerCase();
                return configOrden.direccion === 'asc'
                    ? nombreA.localeCompare(nombreB)
                    : nombreB.localeCompare(nombreA);
            }

            if (configOrden.columna === 'pago') {
                const pesoA = a.estadoPago === 'PAGADO' ? 1 : 0;
                const pesoB = b.estadoPago === 'PAGADO' ? 1 : 0;
                return configOrden.direccion === 'asc' ? pesoB - pesoA : pesoA - pesoB;
            }

            if (configOrden.columna === 'entrega') {
                const pesoA = a.estadoEntrega === 'ENTREGADO' ? 1 : 0;
                const pesoB = b.estadoEntrega === 'ENTREGADO' ? 1 : 0;
                return configOrden.direccion === 'asc' ? pesoB - pesoA : pesoA - pesoB;
            }

            return 0;
        });

    return (
        <main style={{ padding: '20px', backgroundColor: 'var(--bg)', minHeight: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* ENCABEZADO Y BOTÓN VOLVER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', padding: '15px 20px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
                <div>
                    <h2 style={{ margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}><HiOutlineLockClosed /> Resumen de Planilla Cerrada</h2>
                    <p style={{ margin: '5px 0 0 0', color: 'var(--text-secondary)' }}>
                        Fecha: <strong>{formatearFechaVisual(planilla.fecha)}</strong> | Estado: <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>{planilla.estadoPlanilla}</span>
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn-global btn-primario" onClick={exportarPDF} style={{ fontSize: '1rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <HiOutlineDocumentArrowDown /> Exportar PDF
                    </button>
                    <button className="btn-global btn-secundario" onClick={volver} style={{ fontSize: '1rem' }}>
                        ← Volver al Listado
                    </button>
                </div>
            </div>

            {/* SECCIÓN 1: MÉTRICAS Y STOCK SOBRANTE */}
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>

                {/* Cajita de Ingresos */}
                <div style={{ flex: 1, minWidth: '200px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', padding: '15px', borderRadius: 'var(--radius-lg)', borderLeft: '5px solid var(--success)', boxShadow: 'var(--shadow-sm)' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Ingresos Totales (Pagado)</span>
                    <h3 style={{ margin: '5px 0 0 0', fontSize: '1.5rem', color: 'var(--success)' }}>
                        {formatearMoneda(totalesPlanilla.ingresoTotal)}
                    </h3>
                </div>

                {/* Cajita de Deudas */}
                <div style={{ flex: 1, minWidth: '200px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', padding: '15px', borderRadius: 'var(--radius-lg)', borderLeft: '5px solid var(--danger)', boxShadow: 'var(--shadow-sm)' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Deudas Pendientes</span>
                    <h3 style={{ margin: '5px 0 0 0', fontSize: '1.5rem', color: 'var(--danger)' }}>
                        {formatearMoneda(totalesPlanilla.deudaTotal)}
                    </h3>
                </div>

                {/* Cajita de Stock Sobrante del Día */}
                <div style={{ flex: 2, minWidth: '300px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', padding: '15px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}><HiOutlineCube /> Inventario de Cierre de Planilla</h4>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', maxHeight: '80px', overflowY: 'auto' }}>
                        {(totalesPlanilla.stockProductos || []).map(item => {
                            const sobrante = item.stock - item.stock_vendido;
                            return (
                                <span key={item.id} style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text-primary)', padding: '4px 10px', borderRadius: 'var(--radius-lg)', fontSize: '0.85rem', fontWeight: '500', textTransform: 'capitalize' }}>
                                    {nombreProducto(item.id_producto)}: <strong style={{ color: sobrante > 0 ? 'var(--success)' : 'var(--danger)' }}>{sobrante} un.</strong>
                                </span>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* SECCIÓN 2: TABLA DETALLADA DE BOLETAS */}
            <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', padding: '20px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', flexGrow: 1 }}>
                <h3 style={{ marginTop: 0, color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <HiOutlineTicket /> Detalle de Boletas Emitidas
                </h3>

                {/* FILTROS */}
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', margin: '15px 0' }}>
                    <input
                        type="text"
                        placeholder="Filtrar por cliente..."
                        value={busquedaCliente}
                        onChange={(e) => setBusquedaCliente(e.target.value)}
                        style={{ flex: 1, minWidth: '200px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', outline: 'none', fontSize: '0.95rem', backgroundColor: 'var(--surface)', color: 'var(--text-primary)' }}
                    />
                    <SelectPersonalizado
                        value={filtroPago}
                        onChange={(e) => setFiltroPago(e.target.value)}
                        opciones={[
                            { value: '', label: 'Todos los pagos' },
                            { value: 'PAGADO', label: 'Pagado' },
                            { value: 'NO_PAGADO', label: 'No Pagado' },
                        ]}
                        style={{ width: '160px' }}
                    />
                    <SelectPersonalizado
                        value={filtroEntrega}
                        onChange={(e) => setFiltroEntrega(e.target.value)}
                        opciones={[
                            { value: '', label: 'Todas las entregas' },
                            { value: 'ENTREGADO', label: 'Entregado' },
                            { value: 'NO_ENTREGADO', label: 'No Entregado' },
                        ]}
                        style={{ width: '170px' }}
                    />
                </div>

                {cargando ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Cargando detalles...</p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
                            <thead style={{ backgroundColor: 'var(--surface-inverse)', color: 'var(--text-on-inverse)' }}>
                                <tr>
                                    <th
                                        onClick={() => solicitarOrden('cliente')}
                                        style={{ padding: '12px', cursor: 'pointer', userSelect: 'none' }}
                                        title="Ordenar por Cliente"
                                    >
                                        Cliente {obtenerIconoOrden('cliente')}
                                    </th>
                                    <th
                                        onClick={() => solicitarOrden('pago')}
                                        style={{ padding: '12px', cursor: 'pointer', userSelect: 'none' }}
                                        title="Ordenar por Estado de Pago"
                                    >
                                        Estado Pago {obtenerIconoOrden('pago')}
                                    </th>
                                    <th
                                        onClick={() => solicitarOrden('entrega')}
                                        style={{ padding: '12px', cursor: 'pointer', userSelect: 'none' }}
                                        title="Ordenar por Estado de Entrega"
                                    >
                                        Estado Entrega {obtenerIconoOrden('entrega')}
                                    </th>
                                    <th style={{ padding: '12px', width: '12%' }}>Forma de Pago</th>
                                    <th style={{ padding: '12px', width: '30%' }}>Productos Vendidos</th>
                                    <th style={{ padding: '12px', textAlign: 'right' }}>Total Boleta</th>
                                    <th style={{ padding: '12px', textAlign: 'center', width: '170px' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {boletasProcesadas.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                                            {boletas.length === 0
                                                ? "No se registraron boletas este día."
                                                : "No se encontró ninguna boleta con esos filtros."}
                                        </td>
                                    </tr>
                                ) : (
                                    boletasProcesadas.map((boleta, idx) => (
                                        <tr
                                            key={boleta.id}
                                            style={{ borderBottom: '1px solid var(--border)', backgroundColor: idx % 2 === 0 ? 'var(--surface)' : 'var(--surface-2)' }}
                                            onMouseEnter={() => setFilaSobreCursor(boleta.id)}
                                            onMouseLeave={() => setFilaSobreCursor(null)}
                                        >
                                            <td style={{ padding: '12px', fontWeight: 'bold', textTransform: 'capitalize', verticalAlign: 'top', color: 'var(--text-primary)' }}>
                                                {nombreCliente(boleta.id_cliente)}
                                            </td>

                                            {/* Estado Pago */}
                                            <td style={{ padding: '12px', verticalAlign: 'top' }}>
                                                <span style={{
                                                    padding: '4px 8px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 'bold',
                                                    backgroundColor: boleta.estadoPago === 'PAGADO' ? 'var(--success-soft)' : 'var(--danger-soft)',
                                                    color: boleta.estadoPago === 'PAGADO' ? 'var(--success-soft-text)' : 'var(--danger-soft-text)'
                                                }}>
                                                    {boleta.estadoPago}
                                                </span>
                                            </td>

                                            {/* Estado Entrega */}
                                            <td style={{ padding: '12px', verticalAlign: 'top' }}>
                                                <span style={{
                                                    padding: '4px 8px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 'bold',
                                                    backgroundColor: boleta.estadoEntrega === 'ENTREGADO' ? 'var(--success-soft)' : boleta.estadoEntrega === 'PARCIAL' ? 'var(--warning-soft)' : 'var(--danger-soft)',
                                                    color: boleta.estadoEntrega === 'ENTREGADO' ? 'var(--success-soft-text)' : boleta.estadoEntrega === 'PARCIAL' ? 'var(--warning-soft-text)' : 'var(--danger-soft-text)'
                                                }}>
                                                    {boleta.estadoEntrega}
                                                </span>
                                            </td>

                                            {/* Forma de Pago */}
                                            <td style={{ padding: '12px', verticalAlign: 'top', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                                                {formaPagoLegible(boleta)}
                                            </td>

                                            {/* Lista de Productos dentro de la boleta */}
                                            <td style={{ padding: '12px', verticalAlign: 'top' }}>
                                                <ul style={{ margin: 0, paddingLeft: '15px', listStyleType: 'square', color: 'var(--text-secondary)' }}>
                                                    {(boleta.ventas || []).map((itemProd, i) => (
                                                        <li key={i} style={{ marginBottom: '3px', textTransform: 'capitalize' }}>
                                                            <strong>{itemProd.cantidad}x</strong> {nombreProducto(itemProd.id_producto)}
                                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}> ({formatearMoneda(itemProd.precio_unitario)} c/u)</span>
                                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                                                {' '}- Vacío: {itemProd.precio_vacio > 0 ? formatearMoneda(itemProd.precio_vacio) : 'Sin Vacio'}
                                                            </span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </td>

                                            {/* Total */}
                                            <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', fontSize: '1.05rem', color: 'var(--text-primary)', verticalAlign: 'top' }}>
                                                {formatearMoneda(boleta.total)}
                                            </td>

                                            {/* Acciones */}
                                            <td style={{ padding: '12px', textAlign: 'center', verticalAlign: 'top' }}>
                                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                                    <MenuAccionesInline
                                                        mostrarPorHover={filaSobreCursor === boleta.id}
                                                        acciones={[
                                                            { label: 'Ver', onClick: () => setBoletaAVer(boleta) },
                                                            { label: 'Modificar', onClick: () => abrirEdicionBoleta(boleta), variante: 'primario' },
                                                        ]}
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {mostrarModalEditar && (
                <ModalModificarBoleta
                    boleta={boletaAEditar}
                    cliente={nombreCliente(boletaAEditar?.id_cliente)}
                    planilla={planilla}
                    catalogoProductos={catalogoProductos}
                    cerrarModal={() => {
                        setMostrarModalEditar(false);
                        setBoletaAEditar(null);
                    }}
                    onBoletaEditada={handleBoletaEditada}
                />
            )}

            {boletaAVer && (
                <ModalVerBoleta
                    boleta={boletaAVer}
                    nombreCliente={nombreCliente(boletaAVer.id_cliente)}
                    nombreProducto={nombreProducto}
                    formatearMoneda={formatearMoneda}
                    fecha={formatearFechaVisual(planilla.fecha)}
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

export default VistaPlanillaCerrada;
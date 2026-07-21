import { useState, useMemo, useCallback, memo } from "react";
import { HiOutlineTicket } from 'react-icons/hi2';
import "../Estilos/Botones.css";
import AlertaEmergente from "../Alertas/AlertaEmergente";
import ModalVerBoleta from "../Modals/ModalVerBoleta";
import MenuAccionesInline from "../UI/MenuAccionesInline";

const formatearMoneda = (val) => (val ?? 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

const NOMBRES_FORMA_PAGO = {
    EFECTIVO: 'Efectivo',
    MERCADO_PAGO: 'Mercado Pago',
    TRANSFERENCIA_BANCARIA: 'Transferencia Bancaria',
    OTROS: 'Otros',
};
const formaPagoLegible = (formaPago) => NOMBRES_FORMA_PAGO[formaPago] || '-';

// Fila memoizada: evita re-renderizar toda la tabla (boletas del dia en la caja abierta)
// cuando solo cambia cual fila esta bajo el cursor (mismo patron que FilaBoleta en
// VistaBuscarBoletas).
const FilaBoletaLista = memo(function FilaBoletaLista({ boleta, idKey, resaltada, onHoverStart, onHoverEnd, onVer, onModificar, onEliminar }) {
    return (
        <tr
            style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
            onMouseEnter={() => onHoverStart(idKey)}
            onMouseLeave={onHoverEnd}
        >
            <td style={{ padding: '12px', fontWeight: 'bold', textTransform: 'capitalize', color: 'var(--text-primary)' }}>
                {boleta._nombreCliente}
            </td>
            <td style={{ padding: '12px' }}>
                <span style={{
                    padding: '4px 8px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 'bold',
                    backgroundColor: boleta.estadoPago === 'PAGADO' ? 'var(--success-soft)' : 'var(--danger-soft)',
                    color: boleta.estadoPago === 'PAGADO' ? 'var(--success-soft-text)' : 'var(--danger-soft-text)'
                }}>
                    {boleta.estadoPago}
                </span>
            </td>
            <td style={{ padding: '12px' }}>
                <span style={{
                    padding: '4px 8px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 'bold',
                    backgroundColor: boleta.estadoEntrega === 'ENTREGADO' ? 'var(--success-soft)' : boleta.estadoEntrega === 'PARCIAL' ? 'var(--warning-soft)' : 'var(--danger-soft)',
                    color: boleta.estadoEntrega === 'ENTREGADO' ? 'var(--success-soft-text)' : boleta.estadoEntrega === 'PARCIAL' ? 'var(--warning-soft-text)' : 'var(--danger-soft-text)'
                }}>
                    {boleta.estadoEntrega === 'PARCIAL' ? 'PARCIAL' : boleta.estadoEntrega}
                </span>
            </td>
            <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                {boleta.estadoPago === 'NO_PAGADO' ? '-' : formaPagoLegible(boleta.formaPago)}
            </td>
            <td style={{ padding: '12px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                {formatearMoneda(boleta.total)}
            </td>
            <td style={{ padding: '12px', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <MenuAccionesInline
                        mostrarPorHover={resaltada}
                        acciones={[
                            { label: 'Ver', onClick: () => onVer(boleta) },
                            { label: 'Modificar', onClick: () => onModificar(boleta), variante: 'primario' },
                            { label: 'Eliminar', onClick: () => onEliminar(boleta), variante: 'peligro' },
                        ]}
                    />
                </div>
            </td>
        </tr>
    );
});

function ListaBoletas({ abrirModalBoleta, abrirModalModificarBoleta, eliminarBoleta ,boletas = [], clientes = [], catalogoProductos = [] }) {
    const [busqueda, setBusqueda] = useState('');
    const [mensajeAlerta, setMensajeAlerta] = useState(null);
    const [configOrden, setConfigOrden] = useState({ columna: null, direccion: 'asc' });
    const [boletaAVer, setBoletaAVer] = useState(null);
    const [filaSobreCursor, setFilaSobreCursor] = useState(null);

    // Mapas en vez de un .find() (O(n)) por boleta en cada render: busqueda O(1) por id.
    const mapaClientes = useMemo(() => new Map(clientes.map(c => [c.id, c])), [clientes]);
    const mapaProductos = useMemo(() => new Map(catalogoProductos.map(p => [String(p.id), p])), [catalogoProductos]);

    const nombreCliente = useCallback((id_cliente) => mapaClientes.get(id_cliente)?.nombre || '-', [mapaClientes]);
    const nombreProducto = useCallback((id_producto) => mapaProductos.get(String(id_producto))?.nombre || `Prod #${id_producto}`, [mapaProductos]);

    const solicitarOrden = (columna) => {
        let direccion = 'asc';
        // Si tocas la misma columna que ya estaba activa, invertimos la dirección
        if (configOrden.columna === columna && configOrden.direccion === 'asc') {
            direccion = 'desc';
        }
        setConfigOrden({ columna, direccion });
    };

    // Se recalcula solo cuando cambian los datos/filtros reales (antes se filtraba, ordenaba
    // y resolvia el nombre del cliente en CADA render, incluidos los que disparaba el hover
    // de una fila al pasar el mouse).
    const boletasProcesadas = useMemo(() => {
        return boletas
            .filter((boleta) => {
                if (!busqueda) return true;
                return nombreCliente(boleta.id_cliente).toLowerCase().includes(busqueda.toLowerCase());
            })
            .map((boleta) => ({ ...boleta, _nombreCliente: nombreCliente(boleta.id_cliente) }))
            .sort((a, b) => {
                // Si nadie tocó ningún encabezado aún, no ordenamos
                if (!configOrden.columna) return 0;

                if (configOrden.columna === 'nombre') {
                    // localeCompare ordena alfabéticamente
                    return configOrden.direccion === 'asc'
                        ? a._nombreCliente.toLowerCase().localeCompare(b._nombreCliente.toLowerCase())
                        : b._nombreCliente.toLowerCase().localeCompare(a._nombreCliente.toLowerCase());
                }

                if (configOrden.columna === 'pago') {
                    // Le damos "1 punto" si está pagado y "0" si no lo está.
                    // Así obligamos a los "1" a ir arriba.
                    const pesoA = a.estadoPago === 'PAGADO' ? 1 : 0;
                    const pesoB = b.estadoPago === 'PAGADO' ? 1 : 0;
                    return configOrden.direccion === 'asc'
                        ? pesoB - pesoA
                        : pesoA - pesoB;
                }

                if (configOrden.columna === 'entrega') {
                    const pesoA = a.estadoEntrega === 'ENTREGADO' ? 1 : 0;
                    const pesoB = b.estadoEntrega === 'ENTREGADO' ? 1 : 0;
                    return configOrden.direccion === 'asc'
                        ? pesoB - pesoA
                        : pesoA - pesoB;
                }

                return 0;
            });
    }, [boletas, busqueda, configOrden, nombreCliente]);

    // Función auxiliar para dibujar flechitas en los encabezados
    const obtenerIconoOrden = (nombreColumna) => {
        if (configOrden.columna !== nombreColumna) return ' ↕️'; // Icono por defecto (inactivo)
        return configOrden.direccion === 'asc' ? ' ⬇️' : ' ⬆️'; // Activo
    };

    const limpiarHover = useCallback(() => setFilaSobreCursor(null), []);

    const abrirModificar = useCallback((boleta) => {
        abrirModalModificarBoleta(boleta, nombreCliente(boleta.id_cliente));
    }, [abrirModalModificarBoleta, nombreCliente]);

    const intentarEliminar = useCallback((boleta) => {
        const estaPagada = boleta.estadoPago === 'PAGADO';
        const estaEntregada = boleta.estadoEntrega !== 'NO_ENTREGADO';

        if (estaPagada || estaEntregada) {
            const motivos = [];
            if (estaPagada) motivos.push('Pagada');
            if (estaEntregada) motivos.push(boleta.estadoEntrega === 'PARCIAL' ? 'Entregada parcialmente' : 'Entregada');

            setMensajeAlerta(`La boleta #${boleta.id} no puede ser eliminada porque está ${motivos.join(' y ')}.`);
            return;
        }

        eliminarBoleta(boleta);
    }, [eliminarBoleta]);

    return (
        <div style={{ flex: 3, minHeight: 0, backgroundColor: 'var(--surface)', border: '1px solid var(--border)', padding: '20px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px', marginBottom: '10px' }}>
                <input
                    type="text"
                    placeholder="Filtrar boletas por nombre..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '5px 10px', width: '50%', outline: 'none', backgroundColor: 'var(--surface)', color: 'var(--text-primary)' }}
                />
                <h3 style={{ color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>Boletas Cargadas <HiOutlineTicket /></h3>
            </div>

            {/* ZONA DE LA TABLA */}
            <div style={{ flexGrow: 1, overflowY: 'auto', marginBottom: '20px', paddingRight: '5px' }}>

                {boletasProcesadas.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', marginTop: '50px' }}>
                        {boletas.length === 0
                            ? "Aún no hay boletas cargadas en esta caja..."
                            : "No se encontró ninguna boleta para ese cliente."}
                    </p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
                        <thead style={{ backgroundColor: 'var(--surface-inverse)', position: 'sticky', top: 0, zIndex: 1 }}>
                            <tr style={{ color: 'var(--text-on-inverse)' }}>
                                <th
                                    onClick={() => solicitarOrden('nombre')}
                                    style={{ padding: '12px', cursor: 'pointer', userSelect: 'none' }}
                                    title="Ordenar por Cliente"
                                >
                                    Cliente {obtenerIconoOrden('nombre')}
                                </th>
                                <th
                                    onClick={() => solicitarOrden('pago')}
                                    style={{ padding: '12px', cursor: 'pointer', userSelect: 'none' }}
                                    title="Ordenar por Estado de Pago"
                                >
                                    Pago {obtenerIconoOrden('pago')}
                                </th>
                                <th
                                    onClick={() => solicitarOrden('entrega')}
                                    style={{ padding: '12px', cursor: 'pointer', userSelect: 'none' }}
                                    title="Ordenar por Estado de Entrega"
                                >
                                    Entrega {obtenerIconoOrden('entrega')}
                                </th>
                                <th style={{ padding: '12px' }}>Forma de Pago</th>
                                <th style={{ padding: '12px' }}>Total</th>
                                <th style={{ padding: '12px', textAlign: 'center', width: '240px' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {boletasProcesadas.map((boleta, index) => {
                                const idKey = boleta.id || index;
                                return (
                                    <FilaBoletaLista
                                        key={idKey}
                                        boleta={boleta}
                                        idKey={idKey}
                                        resaltada={filaSobreCursor === idKey}
                                        onHoverStart={setFilaSobreCursor}
                                        onHoverEnd={limpiarHover}
                                        onVer={setBoletaAVer}
                                        onModificar={abrirModificar}
                                        onEliminar={intentarEliminar}
                                    />
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            <div style={{ paddingTop: '20px', borderTop: '1px dashed var(--border)', display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end' }}>
                <button
                    className='btn-global btn-primario'
                    onClick={abrirModalBoleta}
                    style={{ padding: '10px 20px', fontSize: '1.1rem' }}
                >
                    + Cargar Nueva Boleta
                </button>
            </div>

            <AlertaEmergente
                mensaje={mensajeAlerta}
                onClose={() => setMensajeAlerta(null)}
            />

            {boletaAVer && (
                <ModalVerBoleta
                    boleta={boletaAVer}
                    nombreCliente={nombreCliente(boletaAVer.id_cliente)}
                    nombreProducto={nombreProducto}
                    formatearMoneda={formatearMoneda}
                    cerrarModal={() => setBoletaAVer(null)}
                />
            )}
        </div>
    );
}

export default ListaBoletas;

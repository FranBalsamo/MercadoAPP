import { HiOutlineTicket, HiOutlineUserCircle, HiOutlineCalendarDays } from 'react-icons/hi2';
import '../Estilos/Modal.css';
import '../Estilos/Botones.css';

const formaPagoLegible = (formaPago) => {
    const nombres = {
        EFECTIVO: 'Efectivo',
        MERCADO_PAGO: 'Mercado Pago',
        TRANSFERENCIA_BANCARIA: 'Transferencia Bancaria',
        OTROS: 'Otros',
    };
    return nombres[formaPago] || '-';
};

const estiloEntrega = (estadoEntrega) => {
    if (estadoEntrega === 'ENTREGADO') return { backgroundColor: 'var(--success-soft)', color: 'var(--success-soft-text)' };
    if (estadoEntrega === 'PARCIAL') return { backgroundColor: 'var(--warning-soft)', color: 'var(--warning-soft-text)' };
    return { backgroundColor: 'var(--danger-soft)', color: 'var(--danger-soft-text)' };
};

const textoEntrega = (estadoEntrega) => {
    if (estadoEntrega === 'ENTREGADO') return 'ENTREGADO';
    if (estadoEntrega === 'PARCIAL') return 'ENTREGA PARCIAL';
    return 'NO ENTREGADO';
};

const colorCantidadEntregada = (cantidadEntregada, cantidad) => {
    if (cantidadEntregada <= 0) return 'var(--danger-soft-text)';
    if (cantidadEntregada >= cantidad) return 'var(--success-soft-text)';
    return 'var(--warning-soft-text)';
};

function ModalVerBoleta({ boleta, nombreCliente, nombreProducto, formatearMoneda, fecha, cerrarModal }) {
    if (!boleta) return null;

    const esParcial = boleta.estadoEntrega === 'PARCIAL';

    return (
        <div className="modal-overlay">
            <div className="modal-contenido" style={{ width: '95%', maxWidth: '700px' }}>

                <div className="modal-header">
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <HiOutlineTicket /> Boleta
                    </h3>
                    <button className="btn-cerrar-modal" onClick={cerrarModal}>X</button>
                </div>

                <div className="modal-body">
                    <div style={{ backgroundColor: 'var(--info-soft)', padding: '10px 15px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <strong style={{ color: 'var(--info-soft-text)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <HiOutlineUserCircle /> Cliente:
                            </strong>
                            <span style={{ textTransform: 'capitalize' }}>{nombreCliente}</span>
                        </div>
                        {fecha && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <strong style={{ color: 'var(--info-soft-text)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                    <HiOutlineCalendarDays /> Fecha:
                                </strong>
                                <span>{fecha}</span>
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', margin: '15px 0' }}>
                        <span style={{
                            padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontWeight: 'bold',
                            backgroundColor: boleta.estadoPago === 'PAGADO' ? 'var(--success-soft)' : 'var(--danger-soft)',
                            color: boleta.estadoPago === 'PAGADO' ? 'var(--success-soft-text)' : 'var(--danger-soft-text)'
                        }}>
                            {boleta.estadoPago}
                        </span>
                        <span style={{ padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontWeight: 'bold', ...estiloEntrega(boleta.estadoEntrega) }}>
                            {textoEntrega(boleta.estadoEntrega)}
                        </span>
                        {boleta.estadoPago === 'PAGADO' && boleta.formaPago && (
                            <span style={{ padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontWeight: 'bold', backgroundColor: 'var(--surface-2)', color: 'var(--text-secondary)' }}>
                                {formaPagoLegible(boleta.formaPago)}
                            </span>
                        )}
                    </div>

                    <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                            <thead style={{ backgroundColor: 'var(--surface-inverse)', color: 'var(--text-on-inverse)' }}>
                                <tr>
                                    <th style={{ padding: '10px' }}>Producto</th>
                                    <th style={{ padding: '10px' }}>Cant.</th>
                                    <th style={{ padding: '10px' }}>$ Unitario</th>
                                    <th style={{ padding: '10px' }}>$ Vacío</th>
                                    <th style={{ padding: '10px' }}>Subtotal</th>
                                    {esParcial && <th style={{ padding: '10px' }}>Entregado</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {(boleta.ventas || []).map((venta, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '10px', fontWeight: 'bold', textTransform: 'capitalize', color: 'var(--text-primary)' }}>
                                            {nombreProducto(venta.id_producto)}
                                        </td>
                                        <td style={{ padding: '10px', color: 'var(--text-primary)' }}>{venta.cantidad}</td>
                                        <td style={{ padding: '10px', color: 'var(--text-primary)' }}>{formatearMoneda(venta.precio_unitario)}</td>
                                        <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>
                                            {venta.precio_vacio > 0 ? formatearMoneda(venta.precio_vacio) : 'Sin Vacio'}
                                        </td>
                                        <td style={{ padding: '10px', fontWeight: 'bold', color: 'var(--success)' }}>
                                            {formatearMoneda((venta.cantidad * venta.precio_unitario) + (venta.cantidad * (venta.precio_vacio || 0)))}
                                        </td>
                                        {esParcial && (
                                            <td style={{ padding: '10px', color: colorCantidadEntregada(venta.cantidad_entregada || 0, venta.cantidad), fontWeight: 'bold' }}>
                                                {venta.cantidad_entregada || 0} / {venta.cantidad}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="modal-footer" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Total: {formatearMoneda(boleta.total)}</h3>
                    <button className="btn-global btn-secundario" onClick={cerrarModal}>Cerrar</button>
                </div>
            </div>
        </div>
    );
}

export default ModalVerBoleta;

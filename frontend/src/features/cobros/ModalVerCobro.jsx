import { HiOutlineBanknotes, HiOutlineUserCircle, HiOutlineCalendarDays } from 'react-icons/hi2';
import '@/shared/styles/Modal.css';
import '@/shared/styles/Botones.css';

const NOMBRES_FORMA_PAGO = {
    EFECTIVO: 'Efectivo',
    MERCADO_PAGO: 'Mercado Pago',
    TRANSFERENCIA_BANCARIA: 'Transferencia Bancaria',
    OTROS: 'Otros',
};

function ModalVerCobro({ cobro, nombreCliente, fechaPlanilla, formatearMoneda, formatearFecha, cerrarModal, onVerBoleta }) {
    if (!cobro) return null;

    const boletas = cobro.boletas || [];
    const esAporteACuenta = cobro.montoTotalBoletas <= 0;

    return (
        <div className="modal-overlay">
            <div className="modal-contenido" style={{ width: '95%', maxWidth: '650px' }}>

                <div className="modal-header">
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <HiOutlineBanknotes /> Operación #{cobro.id}
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <strong style={{ color: 'var(--info-soft-text)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <HiOutlineCalendarDays /> Fecha:
                            </strong>
                            <span>{formatearFecha(cobro.fecha)}</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', margin: '15px 0' }}>
                        <span style={{
                            padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontWeight: 'bold',
                            backgroundColor: esAporteACuenta ? 'var(--warning-soft)' : 'var(--success-soft)',
                            color: esAporteACuenta ? 'var(--warning-soft-text)' : 'var(--success-soft-text)'
                        }}>
                            {esAporteACuenta ? 'APORTE A CUENTA' : 'PAGO DE DEUDA'}
                        </span>
                        <span style={{ padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontWeight: 'bold', backgroundColor: 'var(--surface-2)', color: 'var(--text-secondary)' }}>
                            {NOMBRES_FORMA_PAGO[cobro.formaPago] || '-'}
                        </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginBottom: '15px' }}>
                        <div style={{ padding: '10px 12px', backgroundColor: 'var(--surface-2)', borderRadius: 'var(--radius-sm)' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Monto entregado</div>
                            <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{formatearMoneda(cobro.montoEntregado)}</div>
                        </div>
                        {cobro.saldoAplicado > 0 && (
                            <div style={{ padding: '10px 12px', backgroundColor: 'var(--surface-2)', borderRadius: 'var(--radius-sm)' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Saldo del cliente usado</div>
                                <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{formatearMoneda(cobro.saldoAplicado)}</div>
                            </div>
                        )}
                        <div style={{ padding: '10px 12px', backgroundColor: 'var(--success-soft)', borderRadius: 'var(--radius-sm)' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--success-soft-text)' }}>Deuda saldada</div>
                            <div style={{ fontWeight: 'bold', color: 'var(--success-soft-text)' }}>{formatearMoneda(cobro.montoTotalBoletas)}</div>
                        </div>
                        {cobro.vuelto > 0 && (
                            <div style={{ padding: '10px 12px', backgroundColor: 'var(--surface-2)', borderRadius: 'var(--radius-sm)' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Vuelto entregado</div>
                                <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{formatearMoneda(cobro.vuelto)}</div>
                            </div>
                        )}
                        {cobro.saldoGenerado > 0 && (
                            <div style={{ padding: '10px 12px', backgroundColor: 'var(--warning-soft)', borderRadius: 'var(--radius-sm)' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--warning-soft-text)' }}>Quedó como saldo del cliente</div>
                                <div style={{ fontWeight: 'bold', color: 'var(--warning-soft-text)' }}>{formatearMoneda(cobro.saldoGenerado)}</div>
                            </div>
                        )}
                    </div>

                    <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                        Boletas cubiertas {boletas.length > 0 && `(${boletas.length})`}
                    </h4>

                    {boletas.length === 0 ? (
                        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '15px', backgroundColor: 'var(--surface-2)', borderRadius: 'var(--radius-sm)' }}>
                            Este aporte no llegó a cubrir ninguna boleta completa; quedó como saldo del cliente.
                        </p>
                    ) : (
                        <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                                <thead style={{ backgroundColor: 'var(--surface-inverse)', color: 'var(--text-on-inverse)' }}>
                                    <tr>
                                        <th style={{ padding: '10px' }}>Fecha</th>
                                        <th style={{ padding: '10px', textAlign: 'right' }}>Total</th>
                                        <th style={{ padding: '10px', textAlign: 'center', width: '80px' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {boletas.map((boleta) => (
                                        <tr key={boleta.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '10px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{formatearFecha(fechaPlanilla(boleta.id_planilla))}</td>
                                            <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: 'var(--text-primary)' }}>{formatearMoneda(boleta.total)}</td>
                                            <td style={{ padding: '10px', textAlign: 'center' }}>
                                                <button
                                                    className="btn-global btn-secundario"
                                                    onClick={() => onVerBoleta(boleta)}
                                                    style={{ fontSize: '0.8rem', padding: '3px 8px' }}
                                                >
                                                    Ver
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="modal-footer" style={{ justifyContent: 'flex-end' }}>
                    <button className="btn-global btn-secundario" onClick={cerrarModal}>Cerrar</button>
                </div>
            </div>
        </div>
    );
}

export default ModalVerCobro;

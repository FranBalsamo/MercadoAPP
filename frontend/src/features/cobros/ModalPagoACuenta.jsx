import { useState } from 'react';
import { formatearFechaVisual } from '@/shared/utils/formatoFecha';
import { HiOutlineCheckCircle, HiOutlineBanknotes, HiOutlineCalendarDays } from 'react-icons/hi2';
import SelectPersonalizado from '@/shared/ui/SelectPersonalizado';
import '@/shared/styles/Modal.css';
import '@/shared/styles/Botones.css';
import '@/shared/styles/Formularios.css';

function ModalPagoACuenta({ cliente, fechaPlanilla, formatearMoneda, cerrarModal, onPagoConfirmado }) {
    const [montoCentavos, setMontoCentavos] = useState(0);
    const [formaPago, setFormaPago] = useState('EFECTIVO');
    const [error, setError] = useState('');
    const [procesando, setProcesando] = useState(false);
    const [resultado, setResultado] = useState(null);

    const montoNumerico = montoCentavos / 100;
    const montoFormateado = montoCentavos > 0 ? formatearMoneda(montoNumerico) : '';

    const handleMontoChange = (e) => {
        const soloDigitos = e.target.value.replace(/\D/g, '');
        setMontoCentavos(soloDigitos ? parseInt(soloDigitos, 10) : 0);
    };

    const handleConfirmar = async () => {
        if (!montoNumerico || montoNumerico <= 0) {
            setError('Ingresá un monto válido, mayor a 0.');
            return;
        }

        setError('');
        setProcesando(true);

        try {
            const respuesta = await fetch(
                `http://localhost:8080/api/boleta/cobrar_deuda/cliente/${cliente.id}/monto/${montoNumerico}?formaPago=${formaPago}`,
                { method: 'PUT' }
            );

            if (!respuesta.ok) {
                const mensajeError = await respuesta.text();
                setError(mensajeError ? mensajeError : 'Error en el servidor al intentar procesar el pago.');
                return;
            }

            const boletasPagadas = await respuesta.json();

            const respuestaCliente = await fetch(`http://localhost:8080/api/clientes/buscar/documento/${cliente.documento}`);
            const clienteActualizado = respuestaCliente.ok ? await respuestaCliente.json() : null;

            setResultado({
                boletasPagadas,
                sobrante: clienteActualizado ? clienteActualizado.saldo_a_favor : 0
            });
        } catch (err) {
            console.error(err);
            setError('Error de conexion con el servidor.');
        } finally {
            setProcesando(false);
        }
    };

    const handleAceptarResultado = () => {
        onPagoConfirmado();
    };

    if (resultado) {
        const totalPagado = resultado.boletasPagadas.reduce((acumulado, b) => acumulado + (b.total || 0), 0);

        return (
            <div className="modal-overlay">
                <div className="modal-contenido" style={{ width: '95%', maxWidth: '600px' }}>
                    <div className="modal-header">
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><HiOutlineCheckCircle /> Pago a Cuenta Procesado</h3>
                        <button className="btn-cerrar-modal" onClick={handleAceptarResultado}>X</button>
                    </div>

                    <div className="modal-body">
                        {resultado.boletasPagadas.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', margin: 0 }}>
                                El monto ingresado no alcanzó para cubrir ninguna boleta en su totalidad.
                            </p>
                        ) : (
                            <>
                                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Boletas cubiertas con este pago:</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {resultado.boletasPagadas.map((boleta) => (
                                        <div key={boleta.id} style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 12px'
                                        }}>
                                            <span style={{ fontWeight: 'bold', color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                                <HiOutlineCalendarDays /> {formatearFechaVisual(fechaPlanilla(boleta.id_planilla))}
                                            </span>
                                            <span style={{ fontWeight: 'bold', color: 'var(--success)' }}>
                                                {formatearMoneda(boleta.total)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <span style={{ color: 'var(--text-primary)' }}>
                                Total pagado: <strong>{formatearMoneda(totalPagado)}</strong>
                            </span>
                            {resultado.sobrante > 0 ? (
                                <span style={{ color: 'var(--success)', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                    <HiOutlineBanknotes /> Sobraron {formatearMoneda(resultado.sobrante)}, guardados como saldo del cliente.
                                </span>
                            ) : (
                                <span style={{ color: 'var(--text-secondary)' }}>No sobró dinero de este pago.</span>
                            )}
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button className="btn-global btn-primario-green" onClick={handleAceptarResultado}>
                            Aceptar
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="modal-overlay">
            <div className="modal-contenido">
                <div className="modal-header">
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><HiOutlineBanknotes /> Pago a Cuenta</h3>
                    <button className="btn-cerrar-modal" onClick={cerrarModal}>X</button>
                </div>

                <div className="modal-body">
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                        Cliente: <strong style={{ textTransform: 'capitalize', color: 'var(--text-primary)' }}>{cliente.nombre}</strong>
                    </p>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        {cliente.saldo_a_favor > 0
                            ? `Este cliente ya tiene ${formatearMoneda(cliente.saldo_a_favor)} de saldo: se va a sumar automáticamente al monto que ingreses acá para cubrir sus boletas impagas más antiguas primero. Si sobra dinero (o no alcanza para cubrir ninguna), la diferencia se guarda como saldo del cliente.`
                            : 'El monto se aplicará a las boletas impagas más antiguas primero. Si sobra dinero (o no alcanza para cubrir ninguna), se guarda como saldo del cliente.'}
                    </p>

                    {error && <div style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{error}</div>}

                    <div className="form-group">
                        <label>Monto:</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            placeholder={formatearMoneda(0)}
                            value={montoFormateado}
                            onChange={handleMontoChange}
                        />
                    </div>

                    <div className="form-group">
                        <label>Forma de pago:</label>
                        <SelectPersonalizado
                            value={formaPago}
                            onChange={(e) => setFormaPago(e.target.value)}
                            opciones={[
                                { value: 'EFECTIVO', label: 'Efectivo' },
                                { value: 'MERCADO_PAGO', label: 'Mercado Pago' },
                                { value: 'TRANSFERENCIA_BANCARIA', label: 'Transferencia Bancaria' },
                                { value: 'OTROS', label: 'Otros' },
                            ]}
                            style={{ width: '100%' }}
                        />
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn-global btn-secundario" onClick={cerrarModal} disabled={procesando}>Cancelar</button>
                    <button className="btn-global btn-primario-green" onClick={handleConfirmar} disabled={procesando}>
                        {procesando ? 'Procesando...' : 'Confirmar Pago'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ModalPagoACuenta;

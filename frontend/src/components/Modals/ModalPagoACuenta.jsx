import { useState } from 'react';
import '../Estilos/Modal.css';
import '../Estilos/Botones.css';

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
            setError('❌ Ingresá un monto válido, mayor a 0.');
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
                setError(mensajeError ? `❌ ${mensajeError}` : '❌ Error en el servidor al intentar procesar el pago.');
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
            setError('❌ Error de conexion con el servidor.');
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
                        <h3>✅ Pago a Cuenta Procesado</h3>
                        <button className="btn-cerrar-modal" onClick={handleAceptarResultado}>X</button>
                    </div>

                    <div className="modal-body">
                        {resultado.boletasPagadas.length === 0 ? (
                            <p style={{ color: '#888', margin: 0 }}>
                                El monto ingresado no alcanzó para cubrir ninguna boleta en su totalidad.
                            </p>
                        ) : (
                            <>
                                <p style={{ margin: 0, color: '#7f8c8d' }}>Boletas cubiertas con este pago:</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {resultado.boletasPagadas.map((boleta) => (
                                        <div key={boleta.id} style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            border: '1px solid #eee', borderRadius: '8px', padding: '10px 12px'
                                        }}>
                                            <span style={{ fontWeight: 'bold', color: '#2c3e50' }}>
                                                📅 {fechaPlanilla(boleta.id_planilla)}
                                            </span>
                                            <span style={{ fontWeight: 'bold', color: '#27ae60' }}>
                                                {formatearMoneda(boleta.total)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        <div style={{ borderTop: '1px solid #eee', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <span style={{ color: '#2c3e50' }}>
                                Total pagado: <strong>{formatearMoneda(totalPagado)}</strong>
                            </span>
                            {resultado.sobrante > 0 ? (
                                <span style={{ color: '#27ae60', fontWeight: 'bold' }}>
                                    💰 Sobraron {formatearMoneda(resultado.sobrante)}, guardados como saldo del cliente.
                                </span>
                            ) : (
                                <span style={{ color: '#7f8c8d' }}>No sobró dinero de este pago.</span>
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
                    <h3>💰 Pago a Cuenta</h3>
                    <button className="btn-cerrar-modal" onClick={cerrarModal}>X</button>
                </div>

                <div className="modal-body">
                    <p style={{ margin: 0, color: '#7f8c8d' }}>
                        Cliente: <strong style={{ textTransform: 'capitalize', color: '#2c3e50' }}>{cliente.nombre}</strong>
                    </p>
                    <p style={{ margin: 0, color: '#7f8c8d', fontSize: '0.85rem' }}>
                        {cliente.saldo_a_favor > 0
                            ? `Este cliente ya tiene ${formatearMoneda(cliente.saldo_a_favor)} de saldo: se va a sumar automáticamente al monto que ingreses acá para cubrir sus boletas impagas más antiguas primero. Si sobra dinero (o no alcanza para cubrir ninguna), la diferencia se guarda como saldo del cliente.`
                            : 'El monto se aplicará a las boletas impagas más antiguas primero. Si sobra dinero (o no alcanza para cubrir ninguna), se guarda como saldo del cliente.'}
                    </p>

                    {error && <div style={{ color: 'red', fontSize: '0.85rem' }}>{error}</div>}

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
                        <select
                            value={formaPago}
                            onChange={(e) => setFormaPago(e.target.value)}
                            style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                        >
                            <option value="EFECTIVO">Efectivo</option>
                            <option value="MERCADO_PAGO">Mercado Pago</option>
                            <option value="TRANSFERENCIA_BANCARIA">Transferencia Bancaria</option>
                            <option value="OTROS">Otros</option>
                        </select>
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

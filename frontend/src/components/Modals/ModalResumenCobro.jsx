import { useState } from 'react';
import '../Estilos/Modal.css';
import '../Estilos/Botones.css';

function ModalResumenCobro({ cliente, boletasSeleccionadas, nombreProducto, fechaPlanilla, formatearMoneda, cerrarModal, onCobroConfirmado }) {
    const [formaPago, setFormaPago] = useState('EFECTIVO');
    const [usarSaldoFavor, setUsarSaldoFavor] = useState(false);
    const [montoEntregadoCentavos, setMontoEntregadoCentavos] = useState(0);
    const [confirmando, setConfirmando] = useState(false);
    const [error, setError] = useState('');
    const [resultado, setResultado] = useState(null);

    const total = boletasSeleccionadas.reduce((acumulado, boleta) => acumulado + (boleta.total || 0), 0);

    const saldoFavorDisponible = cliente.saldo_a_favor || 0;
    const saldoAplicado = usarSaldoFavor ? saldoFavorDisponible : 0;
    const montoEntregado = montoEntregadoCentavos / 100;
    const montoEntregadoFormateado = montoEntregadoCentavos > 0 ? formatearMoneda(montoEntregado) : '';
    const totalDisponible = montoEntregado + saldoAplicado;
    const diferencia = totalDisponible - total;

    const handleMontoChange = (e) => {
        const soloDigitos = e.target.value.replace(/\D/g, '');
        setMontoEntregadoCentavos(soloDigitos ? parseInt(soloDigitos, 10) : 0);
    };

    const handleConfirmar = async () => {
        if (diferencia < 0) {
            setError(`❌ Falta cubrir ${formatearMoneda(-diferencia)} para completar el total seleccionado.`);
            return;
        }

        setConfirmando(true);
        setError('');

        try {
            const idsParam = boletasSeleccionadas.map(b => b.id).join(',');
            const parametros = new URLSearchParams({
                formaPago,
                usarSaldoFavor: String(usarSaldoFavor),
                montoEntregado: String(montoEntregado)
            });
            const respuesta = await fetch(
                `http://localhost:8080/api/boleta/cobrar_deuda/${idsParam}/cliente/${cliente.id}?${parametros}`,
                { method: 'PUT' }
            );

            if (!respuesta.ok) {
                const mensajeError = await respuesta.text();
                setError(mensajeError ? `❌ ${mensajeError}` : '❌ Error en el servidor al intentar cobrar las boletas.');
                return;
            }

            const datos = await respuesta.json();
            setResultado(datos);
        } catch (err) {
            console.error(err);
            setError('❌ Error de conexion con el servidor.');
        } finally {
            setConfirmando(false);
        }
    };

    const handleAceptarResultado = () => {
        onCobroConfirmado();
    };

    if (resultado) {
        return (
            <div className="modal-overlay">
                <div className="modal-contenido" style={{ width: '95%', maxWidth: '500px' }}>
                    <div className="modal-header">
                        <h3>✅ Cobro Procesado</h3>
                        <button className="btn-cerrar-modal" onClick={handleAceptarResultado}>X</button>
                    </div>

                    <div className="modal-body">
                        <p style={{ margin: 0, color: '#2c3e50' }}>
                            Se cobraron {resultado.boletas.length} boleta(s) por un total de <strong>{formatearMoneda(total)}</strong>.
                        </p>
                        {resultado.vuelto > 0 ? (
                            <span style={{ color: '#27ae60', fontWeight: 'bold' }}>
                                💵 Vuelto a entregar: {formatearMoneda(resultado.vuelto)}
                            </span>
                        ) : (
                            <span style={{ color: '#7f8c8d' }}>No hay vuelto para entregar.</span>
                        )}
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
            <div className="modal-contenido" style={{ width: '95%', maxWidth: '700px' }}>

                <div className="modal-header">
                    <h3>🧾 Resumen de Cobro</h3>
                    <button className="btn-cerrar-modal" onClick={cerrarModal}>X</button>
                </div>

                <div className="modal-body">
                    <p style={{ margin: 0, color: '#7f8c8d' }}>
                        Cliente: <strong style={{ textTransform: 'capitalize', color: '#2c3e50' }}>{cliente.nombre}</strong>
                    </p>

                    {error && <div style={{ color: '#c0392b', fontWeight: 'bold', fontSize: '0.9rem' }}>{error}</div>}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {boletasSeleccionadas.map((boleta) => (
                            <div key={boleta.id} style={{ border: '1px solid #eee', borderRadius: '8px', padding: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <span style={{ fontWeight: 'bold', color: '#2c3e50' }}>
                                        📅 {fechaPlanilla(boleta.id_planilla)}
                                    </span>
                                    <span style={{ fontWeight: 'bold', color: '#c0392b' }}>
                                        {formatearMoneda(boleta.total)}
                                    </span>
                                </div>
                                <ul style={{ margin: 0, paddingLeft: '20px', listStyleType: 'square', color: '#34495e' }}>
                                    {(boleta.ventas || []).map((itemProd, i) => (
                                        <li key={i} style={{ textTransform: 'capitalize', fontSize: '0.9rem' }}>
                                            <strong>{itemProd.cantidad}x</strong> {nombreProducto(itemProd.id_producto)}
                                            <span style={{ color: '#7f8c8d', fontSize: '0.85rem' }}> (c/u: {formatearMoneda(itemProd.precio_unitario)})</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    <div style={{ borderTop: '1px solid #eee', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {saldoFavorDisponible > 0 && (
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={usarSaldoFavor}
                                    onChange={(e) => setUsarSaldoFavor(e.target.checked)}
                                />
                                Usar el saldo a favor disponible ({formatearMoneda(saldoFavorDisponible)}) como parte del pago
                            </label>
                        )}

                        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                            <div className="form-group" style={{ flex: 1, minWidth: '160px' }}>
                                <label>Monto entregado:</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    placeholder={formatearMoneda(0)}
                                    value={montoEntregadoFormateado}
                                    onChange={handleMontoChange}
                                />
                            </div>

                            <div className="form-group" style={{ flex: 1, minWidth: '160px' }}>
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

                        <div style={{ fontSize: '0.9rem', color: diferencia < 0 ? '#c0392b' : '#27ae60', fontWeight: 'bold' }}>
                            {diferencia < 0
                                ? `Falta ${formatearMoneda(-diferencia)} para cubrir el total.`
                                : diferencia > 0
                                    ? `Vuelto: ${formatearMoneda(diferencia)}`
                                    : 'Cubre el total exacto.'}
                        </div>
                    </div>
                </div>

                <div className="modal-footer" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, color: '#2c3e50' }}>Total: {formatearMoneda(total)}</h3>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn-global btn-secundario" onClick={cerrarModal} disabled={confirmando}>Cancelar</button>
                        <button className="btn-global btn-primario-green" onClick={handleConfirmar} disabled={confirmando || diferencia < 0}>
                            {confirmando ? 'Cobrando...' : 'Confirmar'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ModalResumenCobro;

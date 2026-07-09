import { useState } from 'react';
import '../Estilos/Modal.css';
import '../Estilos/Botones.css';

function ModalResumenCobro({ cliente, boletasSeleccionadas, nombreProducto, fechaPlanilla, formatearMoneda, cerrarModal, onCobroConfirmado }) {
    const [confirmando, setConfirmando] = useState(false);
    const [error, setError] = useState('');

    const total = boletasSeleccionadas.reduce((acumulado, boleta) => acumulado + (boleta.total || 0), 0);

    const handleConfirmar = async () => {
        setConfirmando(true);
        setError('');

        try {
            const idsParam = boletasSeleccionadas.map(b => b.id).join(',');
            const respuesta = await fetch(
                `http://localhost:8080/api/boleta/cobrar_deuda/${idsParam}/cliente/${cliente.id}`,
                { method: 'PUT' }
            );

            if (!respuesta.ok) {
                const mensajeError = await respuesta.text();
                setError(mensajeError ? `❌ ${mensajeError}` : '❌ Error en el servidor al intentar cobrar las boletas.');
                return;
            }

            onCobroConfirmado();
        } catch (err) {
            console.error(err);
            setError('❌ Error de conexion con el servidor.');
        } finally {
            setConfirmando(false);
        }
    };

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
                </div>

                <div className="modal-footer" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, color: '#2c3e50' }}>Total: {formatearMoneda(total)}</h3>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn-global btn-secundario" onClick={cerrarModal} disabled={confirmando}>Cancelar</button>
                        <button className="btn-global btn-primario-green" onClick={handleConfirmar} disabled={confirmando}>
                            {confirmando ? 'Cobrando...' : 'Confirmar'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ModalResumenCobro;

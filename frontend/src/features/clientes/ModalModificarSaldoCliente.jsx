import { useState } from 'react';
import AlertaConfirmacion from '@/shared/ui/AlertaConfirmacion';
import { HiOutlinePencilSquare } from 'react-icons/hi2';
import '@/shared/styles/Modal.css';
import '@/shared/styles/Botones.css';

function ModalModificarSaldoCliente({ cerrarModal, cliente, onSaldoModificado }) {
    const [saldoCentavos, setSaldoCentavos] = useState(Math.round((cliente?.saldo_a_favor || 0) * 100));
    const [error, setError] = useState('');
    const [guardando, setGuardando] = useState(false);
    const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

    const saldoNuevo = saldoCentavos / 100;
    const saldoFormateado = saldoNuevo.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

    const handleSaldoChange = (e) => {
        const soloDigitos = e.target.value.replace(/\D/g, '');
        setSaldoCentavos(soloDigitos ? parseInt(soloDigitos, 10) : 0);
    };

    const handleGuardar = () => {
        if (saldoNuevo === (cliente?.saldo_a_favor || 0)) {
            cerrarModal();
            return;
        }

        setError('');
        setMostrarConfirmacion(true);
    };

    const confirmarGuardado = async () => {
        setMostrarConfirmacion(false);
        setGuardando(true);

        try {
            const respuesta = await fetch(`http://localhost:8080/api/clientes/${cliente.id}/saldo/${saldoNuevo}`, {
                method: 'PUT'
            });

            if (!respuesta.ok) {
                const mensajeError = await respuesta.text();
                setError(mensajeError ? mensajeError : 'Error en el servidor al intentar guardar.');
                return;
            }

            const clienteActualizado = await respuesta.json();
            onSaldoModificado?.(clienteActualizado);
            cerrarModal();
        } catch (err) {
            console.error(err);
            setError('Error de conexion con el servidor.');
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-contenido">
                <div className="modal-header">
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><HiOutlinePencilSquare /> Modificar Saldo del Cliente</h3>
                    <button className="btn-cerrar-modal" onClick={cerrarModal}>X</button>
                </div>

                <div className="modal-body">
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                        Cliente: <strong style={{ textTransform: 'capitalize', color: 'var(--text-primary)' }}>{cliente?.nombre}</strong>
                    </p>

                    {error && (
                        <div style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{error}</div>
                    )}

                    <div className="form-group">
                        <label>Saldo del cliente:</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            placeholder={(0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                            value={saldoFormateado}
                            onChange={handleSaldoChange}
                        />
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn-global btn-secundario" onClick={cerrarModal} disabled={guardando}>Cancelar</button>
                    <button className="btn-global btn-primario-green" onClick={handleGuardar} disabled={guardando}>
                        {guardando ? 'Guardando...' : 'Guardar'}
                    </button>
                </div>
            </div>

            {mostrarConfirmacion && (
                <AlertaConfirmacion
                    mensaje={`¿Confirmás cambiar el saldo del cliente a ${saldoFormateado}?`}
                    onConfirmar={confirmarGuardado}
                    onCancelar={() => setMostrarConfirmacion(false)}
                />
            )}
        </div>
    );
}

export default ModalModificarSaldoCliente;

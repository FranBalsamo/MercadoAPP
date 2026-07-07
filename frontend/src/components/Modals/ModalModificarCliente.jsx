import { useState } from 'react'
import AlertaConfirmacion from '../Alertas/AlertaConfirmacion';
import '../Estilos/Modal.css';
import '../Estilos/Botones.css';

function ModalModificarCliente({ cerrarModal, cliente, onClienteModificado }) {

    const [nombre, setNombre] = useState(cliente?.nombre || '');
    const [documento, setDocumento] = useState(cliente?.documento || '');
    const [direccion, setDireccion] = useState(cliente?.direccion || '');
    const [telefono, setTelefono] = useState(cliente?.telefono || '');

    const [error, setError] = useState('');
    const [guardando, setGuardando] = useState(false);
    const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

    const huboModificacion = () => {
        return nombre.trim() !== (cliente?.nombre || '').trim()
            || documento.trim() !== (cliente?.documento || '').trim()
            || direccion.trim() !== (cliente?.direccion || '').trim()
            || telefono.trim() !== (cliente?.telefono || '').trim();
    };

    const handleGuardar = () => {
        if (nombre.trim() === '') {
            setError('❌ El nombre del cliente es obligatorio.');
            return;
        }
        if (documento.trim() === '') {
            setError('❌ El cuit del cliente es obligatorio.');
            return;
        }

        if (!huboModificacion()) {
            cerrarModal();
            return;
        }

        setError('');
        setMostrarConfirmacion(true);
    }

    const confirmarGuardado = async () => {
        setMostrarConfirmacion(false);
        setGuardando(true);

        try {
            const respuesta = await fetch(`http://localhost:8080/api/clientes/${cliente.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ nombre, documento, direccion, telefono })
            });

            if (!respuesta.ok) {
                const mensajeError = await respuesta.text();
                setError(mensajeError ? `❌ ${mensajeError}` : '❌ Error en el servidor al intentar guardar.');
                return;
            }

            onClienteModificado?.();
            cerrarModal();
        } catch (err) {
            console.error(err);
            setError('❌ Error de conexion con el servidor.');
        } finally {
            setGuardando(false);
        }
    }

    return (
        <div className="modal-overlay">
            <div className="modal-contenido">
                <div className="modal-header">
                    <h3>✏️ Modificar Cliente</h3>
                    <button className="btn-cerrar-modal" onClick={cerrarModal}>X</button>
                </div>

                <div className="modal-body">
                    {error && (
                        <div style={{ color: 'red', fontSize: '0.8rem' }}>{error}</div>
                    )}

                    <div className="form-group">
                        <label>Nombre:</label>
                        <input
                            type="text"
                            placeholder="Cliente"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            style={{ textTransform: 'capitalize' }}
                        />
                    </div>

                    <div className="form-group">
                        <label>Cuit:</label>
                        <input
                            type="text"
                            placeholder="Cuit"
                            value={documento}
                            onChange={(e) => setDocumento(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label>Direccion:</label>
                        <input
                            type="text"
                            placeholder="Opcional"
                            value={direccion}
                            onChange={(e) => setDireccion(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label>Telefono:</label>
                        <input
                            type="text"
                            placeholder="Opcional"
                            value={telefono}
                            onChange={(e) => setTelefono(e.target.value)}
                        />
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn-global btn-secundario" onClick={cerrarModal}>Cancelar</button>
                    <button className="btn-global btn-primario-green" onClick={handleGuardar} disabled={guardando}>
                        {guardando ? 'Guardando...' : 'Guardar'}
                    </button>
                </div>
            </div>

            {mostrarConfirmacion && (
                <AlertaConfirmacion
                    mensaje={`¿Confirmás guardar los cambios del cliente?`}
                    onConfirmar={confirmarGuardado}
                    onCancelar={() => setMostrarConfirmacion(false)}
                />
            )}
        </div>
    );
}

export default ModalModificarCliente;

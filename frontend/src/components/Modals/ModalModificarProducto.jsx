import { useState } from 'react'
import AlertaConfirmacion from '../Alertas/AlertaConfirmacion';
import { HiOutlinePencilSquare } from 'react-icons/hi2';
import '../Estilos/Modal.css';
import '../Estilos/Botones.css';

function ModalModificarProducto({ cerrarModal, producto, onProductoModificado }) {

    const [nombre, setNombre] = useState(producto?.nombre || '');
    const [descripcion, setDescripcion] = useState(producto?.descripcion || '');

    const [error, setError] = useState('');
    const [guardando, setGuardando] = useState(false);
    const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

    const huboModificacion = () => {
        return nombre.trim() !== (producto?.nombre || '').trim()
            || descripcion.trim() !== (producto?.descripcion || '').trim();
    };

    const handleGuardar = () => {
        if (nombre.trim() === '') {
            setError('El nombre del producto es obligatorio.');
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
            const respuesta = await fetch(`http://localhost:8080/api/productos/${producto.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ nombre, descripcion })
            });

            if (!respuesta.ok) {
                const mensajeError = await respuesta.text();
                setError(mensajeError ? mensajeError : 'Error en el servidor al intentar guardar.');
                return;
            }

            onProductoModificado?.();
            cerrarModal();
        } catch (err) {
            console.error(err);
            setError('Error de conexion con el servidor');
        } finally {
            setGuardando(false);
        }
    }

    return (
        <div className="modal-overlay">
            <div className="modal-contenido">

                <div className="modal-header">
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><HiOutlinePencilSquare /> Modificar Producto</h3>
                    <button className="btn-cerrar-modal" onClick={cerrarModal}>X</button>
                </div>

                <div className="modal-body">
                    {error && (
                        <div style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{error}</div>
                    )}
                    <div className="form-group">
                        <label>Nombre del Producto:</label>
                        <input
                            type="text"
                            placeholder="Producto"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            maxLength={50}
                            style={{ textTransform: 'capitalize' }}
                        />
                    </div>
                    <div className="form-group">
                        <label>Descripcion:</label>
                        <textarea
                            type="textarea"
                            placeholder="Descripcion"
                            rows="2"
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                            maxLength={100}
                        />
                        <small style={{ color: 'var(--text-muted)', textAlign: 'right', fontSize: '0.8rem' }}>
                            {descripcion.length}/100
                        </small>
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
                    mensaje={`¿Confirmás guardar los cambios del producto?`}
                    onConfirmar={confirmarGuardado}
                    onCancelar={() => setMostrarConfirmacion(false)}
                />
            )}
        </div>
    );
}

export default ModalModificarProducto;

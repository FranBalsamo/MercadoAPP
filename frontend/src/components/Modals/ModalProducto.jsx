import { useState } from 'react'
import { HiOutlineCube } from 'react-icons/hi2';
import '../Estilos/Modal.css';
import '../Estilos/Botones.css';

function ModalProducto({ cerrarModal, onProductoAgregado }) {
    
    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');

    const [error, setError] = useState('');

    const nuevoProducto = {
        nombre: nombre,
        descripcion: descripcion
    }

    const handleGuardar = async () => {

        if (nombre.trim() === '') {
            setError('El nombre del producto es obligatorio.');
            return;
        }
        setError('');
        
        try {
            console.log('Guardando producto...');
            console.log('Enviando: ', nuevoProducto);
            
            const respuesta = await fetch('http://localhost:8080/api/productos/new', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(nuevoProducto)
            });

            if (respuesta.status === 409 || respuesta.status === 400) {
                setError('Ya existe un producto con este nombre.')
                return;
            }

            if (!respuesta.ok) {
                setError('Error en el servidor al intentar guardar.')
                return;
            }
            
            console.log('Producto guardado con exito!');
            onProductoAgregado?.();
            cerrarModal();
        } catch (err) {
            console.log(err);
            setError('Error de conexion con el servidor');
        }
    }

    return(
        <div className="modal-overlay">
            <div className="modal-contenido">

                <div className="modal-header">
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><HiOutlineCube /> Cargar Nuevo Producto</h3>
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
                    <button className="btn-global btn-primario-green" onClick={handleGuardar}>Guardar</button>
                </div>
            </div>
        </div>
    );
}

export default ModalProducto;
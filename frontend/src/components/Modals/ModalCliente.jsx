import { useState } from 'react'
import '../Estilos/Modal.css';
import '../Estilos/Botones.css';

function ModalCliente({ cerrarModal, onClienteAgregado }) {
    
    const [nombre, setNombre] = useState('');
    const [documento, setDocumento] = useState('');
    const [direccion, setDireccion] = useState('');
    const [telefono, setTelefono] = useState('');
    
    const [error, setError] = useState('');

    const nuevoCliente = {
        nombre: nombre,
        documento: documento,
        direccion: direccion,
        telefono: telefono
    }

    const handleGuardar = async () => {
        if (nombre.trim() === '') {
            setError('❌ El nombre del cliente es obligatorio.')
            return;
        }
        if (documento.trim() === '') {
            setError('❌ El cuit del cliente es obligatorio.')
            return;
        }

        setError('');

        try {
            console.log('Guardando cliente...');
            console.log('Enviando: ', nuevoCliente);
            
            const respuesta = await fetch('http://localhost:8080/api/clientes/new', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(nuevoCliente)
            })

            if (respuesta.status === 409 || respuesta.status === 400) {
                setError('❌ Ya existe un cliente con ese documento.')
                return;
            }

            if (!respuesta.ok) {
                setError('❌ Error en el servidor al intentar guardar.');
                return;
            }

            
            console.log('Cliente guadado con exito!');
            onClienteAgregado();
            cerrarModal();    
        } catch (err) {
            console.log(err);
            setError('❌ Error de conexion con el servidor.')
            return;
        }
        
    }

    return(
        <div className="modal-overlay">
            <div className="modal-contenido">
                <div className="modal-header">
                    <h3>👤 Cargar Nuevo Cliente</h3>
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
                    <button className="btn-global btn-primario-green" onClick={handleGuardar}>Guardar</button>
                </div>
            </div>
        </div>
    );
}

export default ModalCliente;


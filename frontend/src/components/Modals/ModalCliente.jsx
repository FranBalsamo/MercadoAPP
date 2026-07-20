import { useState } from 'react'
import { HiOutlineUserCircle } from 'react-icons/hi2';
import CampoDirecciones from './CampoDirecciones';
import SelectorSegmentado from '../UI/SelectorSegmentado';
import '../Estilos/Modal.css';
import '../Estilos/Botones.css';
import '../Estilos/Formularios.css';

function ModalCliente({ cerrarModal, onClienteAgregado }) {

    const [nombre, setNombre] = useState('');
    const [documento, setDocumento] = useState('');
    const [tipoDocumento, setTipoDocumento] = useState('DNI');
    const [tipoCliente, setTipoCliente] = useState('PERSONA');
    const [direcciones, setDirecciones] = useState([]);
    const [telefono, setTelefono] = useState('');

    const [error, setError] = useState('');

    const cambiarTipoCliente = (nuevoTipo) => {
        setTipoCliente(nuevoTipo);
        if (nuevoTipo === 'SUPERMERCADO') {
            setTipoDocumento('CUIT_L');
        }
        if (nuevoTipo === 'PERSONA' && direcciones.length > 1) {
            setDirecciones(direcciones.slice(0, 1));
        }
    };

    const nuevoCliente = {
        nombre: nombre,
        documento: documento,
        tipoDocumento: tipoDocumento,
        tipoCliente: tipoCliente,
        direcciones: direcciones,
        telefono: telefono
    }

    const handleGuardar = async () => {
        if (nombre.trim() === '') {
            setError('El nombre del cliente es obligatorio.')
            return;
        }
        if (documento.trim() === '') {
            setError('El cuit del cliente es obligatorio.')
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
                setError('Ya existe un cliente con ese documento.')
                return;
            }

            if (!respuesta.ok) {
                setError('Error en el servidor al intentar guardar.');
                return;
            }

            
            console.log('Cliente guadado con exito!');
            onClienteAgregado();
            cerrarModal();    
        } catch (err) {
            console.log(err);
            setError('Error de conexion con el servidor.')
            return;
        }
        
    }

    return(
        <div className="modal-overlay">
            <div className="modal-contenido">
                <div className="modal-header">
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><HiOutlineUserCircle /> Cargar Nuevo Cliente</h3>
                    <button className="btn-cerrar-modal" onClick={cerrarModal}>X</button>   
                </div>

                <div className="modal-body">
                    {error && (
                        <div style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{error}</div>
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
                        <label>Tipo de Cliente:</label>
                        <SelectorSegmentado
                            value={tipoCliente}
                            onChange={cambiarTipoCliente}
                            opciones={[
                                { value: 'PERSONA', label: 'Persona' },
                                { value: 'SUPERMERCADO', label: 'Supermercado' },
                            ]}
                        />
                    </div>

                    <div className="form-group">
                        <label>Documento:</label>
                        <SelectorSegmentado
                            value={tipoDocumento}
                            onChange={setTipoDocumento}
                            opciones={[
                                { value: 'DNI', label: 'DNI', disabled: tipoCliente === 'SUPERMERCADO' },
                                { value: 'CUIT_L', label: 'CUIT/L' },
                            ]}
                        />
                        <input
                            type="text"
                            placeholder={tipoDocumento.replace('_', '/')}
                            value={documento}
                            onChange={(e) => setDocumento(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label>{tipoCliente === 'SUPERMERCADO' ? 'Sucursales:' : 'Direccion:'}</label>
                        <CampoDirecciones
                            direcciones={direcciones}
                            onChange={setDirecciones}
                            multiple={tipoCliente === 'SUPERMERCADO'}
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


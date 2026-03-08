import './Modal.css';

function ModalCliente({cerrarModal}) {
    const handleGuardar = () => {
        console.log('Guardando cliente...');    
        cerrarModal();
    }

    return(
        <div className="modal-overlay">
            <div className="modal-contenido">
                <div className="modal-header">
                    <h3>👤 Cargar Nuevo Cliente</h3>
                    <button className="btn-cerrar" onClick={cerrarModal}>X</button>   
                </div>

                <div className="modal-body">
                    <div className="form-group">
                        <label>Nombre:</label>
                        <input type="text" placeholder="Cliente" />
                    </div>

                    <div className="form-group">
                        <label>Cuit:</label>
                        <input type="text" placeholder="Cuit" />
                    </div>

                    <div className="form-group">
                        <label>Direccion:</label>
                        <input type="text" placeholder="Direccion" />
                    </div> 

                    <div className="form-group">
                        <label>Telefono:</label>
                        <input type="text" placeholder="Telefono" />
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn-secundario" onClick={cerrarModal}>Cancelar</button>
                    <button className="btn-primario" onClick={handleGuardar}>Guardar</button>
                </div>
            </div>
        </div>
    );
}

export default ModalCliente;


import './Modal.css'

function ModalProducto({cerrarModal}) {

    const handleGuardar = () => {
        console.log('Guardando producto...');    
        cerrarModal();
    }

    return(
        <div className="modal-overlay">
            <div className="modal-contenido">

                <div className="modal-header">
                    <h3>📦 Cargar Nuevo Producto</h3>
                    <button className="btn-cerrar" onClick={cerrarModal}>X</button>   
                </div>

                <div className="modal-body">
                    <div className="form-group">
                        <label>Nombre del Producto:</label>
                        <input type="text" placeholder="Producto" />
                    </div>

                    <div className="form-group">
                        <label>Descripcion:</label>
                        <input type="text" placeholder="Descripcion" />
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

export default ModalProducto;
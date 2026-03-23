import '../Estilos/Modal.css';

function ModalModificarStock({cerrarModal}) {
    return (
        <div className="modal-overlay"> 
            <div className="modal-contenido">
                
                <div 
                    className="modal-header"
                    style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                    }}
                > 
                    <h3>✏️ Modificar Stock</h3>
                    <button className="btn-cerrar" onClick={cerrarModal}>X</button>
                </div>

                <div className="modal-body">
                    ACA IRA LA MODIFICACION DE LOS STOCK PRODUCTOS
                </div>

            </div>
            
        </div>
    );
}

export default ModalModificarStock
import '../Estilos/Modal.css';
import '../Estilos/FormEditarStock.css'
import { useEffect } from 'react';
function ModalModificarStock({cerrarModal, planilla}) {
    const [stockProductos, setStockPorductos] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        const obtenerStockDeLaPlanilla = async () => {
            try{
                const respuesta = await fetch('http://localhost:8080/api/planilla/stocks/{id_planilla}')
                if(respuesta.ok){
                    const listaStock = await respuesta.json();
                    const stockProductosFormateados = Array.isArray(listaStock)
                        ? listaStock.map(item => ({
                            id: item.id,
                            id_producto: item.id_producto,
                            id_planilla: item.id_planilla,
                            stock: item.stock,
                            stock_vendido: item.stock_vendido
                        }))
                        : [];
                    setStockPorductos(stockProductosFormateados);
                } else {
                    setError('❌ No se pudo sincronizar el stock con el servidor.')
                }
            } catch(err){
                console.error(err);
                setError('❌ Error de conexión al verificar el stock.');
            }
        };
        obtenerStockDeLaPlanilla();
    }, [planilla.id]);

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
                    <form className="form-modificar-stock">
                        <label htmlFor="producto">Producto:</label>
                        <select id="producto" name="producto">
                            <option value="">Seleccionar producto</option>
                            {/* Aquí irían las opciones de productos dinámicas */}
                        </select>
                        
                        <label htmlFor="stock-actual">Stock Actual:</label>
                        <input type="number" id="stock-actual" name="stock-actual" readOnly />
                        
                        <label htmlFor="nuevo-stock">Nuevo Stock:</label>
                        <input type="number" id="nuevo-stock" name="nuevo-stock" min="0" />
                        
                        <div className="botones-modal">
                            <button type="button" className="btn-cancelar" onClick={cerrarModal}>Cancelar</button>
                            <button type="submit" className="btn-modificar">Modificar</button>
                        </div>
                    </form>
                </div>

            </div>
            
        </div>
    );
}

export default ModalModificarStock
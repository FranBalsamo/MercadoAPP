import {useState} from 'react';
import './Modal.css';

function ModalPlanilla({cerrarModal}) {
    
    const [stockDiario, setStockDiario] = useState([
        {id_producto: '', cantidad: ''}
    ]);

    //Entrada simulada que vendria de la API;
    const productosDB = [
        {id_producto: 1, nombre: 'Producto A'},
        {id_producto: 2, nombre: 'Producto B'},
        {id_producto: 3, nombre: 'Producto C'},
    ];

    const agregarFila = () => {
        setStockDiario([...stockDiario, {id_producto: '', cantidad: ''}]);//Como funciona esto wtf????
    }

    const actualizarFila = (index, campo, valor) => {
        const nuevaFilas = [...stockDiario]; //Como funciona esto???
        nuevaFilas[index][campo] = valor;
        setStockDiario(nuevaFilas);
    };

    const eliminarFila = (index) => {
        const nuevaFilas = stockDiario.filter((_, i) => i !== index);
        setStockDiario(nuevaFilas);
    };

    const handleGuardar = () => {
        console.log('Guardando planilla...', stockDiario);
        cerrarModal();
    };

    return(
        <div className="modal-overlay">
            <div className="modal-contenido" style={{width:'500px'}}>
                
                <div className="modal-header">
                    <h3>Abrir Nueva Planilla</h3>
                    <button className="btn-cerrar" onClick={cerrarModal}>X</button>
                </div>

                <div className="modal-body"> 
                    <p>Cargar el stock incial para el dia de hoy:</p>

                {stockDiario.map((fila,index) => (
                    <div key={index} style={{display: 'flex', gap: '10px', marginBotton: '10px'}}>

                        <select 
                            style={{flex: 2, padding: '8px' }}
                            values={fila.id_producto}
                            onChange={(e) => actualizarFila(index, 'id_producto', e.target.value)}
                        >
                            <option value="">Seleccionar Producto</option>
                            {productosDB.map(producto => (
                                <option key={producto.id_producto} value={producto.id_producto}>
                                    {producto.nombre}
                                </option>
                            ))}
                        </select>
                        
                        <input
                            type="number"
                            style={{flex: 1, padding: '8px' }}
                            placeholder="Cantidad"
                            value={fila.stock}
                            onChange={(e) => actualizarFila(index, 'stock', e.target.value)}
                            min="1"
                        />

                        <button
                            type="button"
                            onClick={() => eliminarFila(index)}
                            style={{ padding: '8px', background: '#e57373', border: 'none', cursor: 'pointer', borderRadius: '10%' }}>
                            X
                        </button>

                    </div>
                ))}
                <button 
                    type="button" 
                    onClick={agregarFila}
                    style={{ padding: '8px', background: '#e0e0e0', border: 'none', cursor: 'pointer', marginTop: '10px' }}>
                        + Agregar otro producto
                </button>

            </div>
                <div className="modal-footer">
                    <button className="btn-secundario" onClick={cerrarModal}>Cancelar</button>
                    <button className="btn-primario" onClick={handleGuardar}>Abrir Planilla</button>
                </div>
            </div>
        </div>
  );
}

export default ModalPlanilla;
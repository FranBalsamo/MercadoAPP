import {useState, useEffect} from 'react';
import SelectPersonalizado from '../UI/SelectPersonalizado';
import '../Estilos/Modal.css';
import '../Estilos/Botones.css';
import '../Estilos/Formularios.css';

function ModalPlanilla({cerrarModal, onPlanillaCreada}) {
    
    const [stockDiario, setStockDiario] = useState([
        {id_fila: crypto.randomUUID() ,id_producto: '', stock: ''}
    ]);
    const [productosDB, setProductosDB] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {

        const traerProductos = async () => {
            try {
                const respuesta = await fetch('http://localhost:8080/api/productos/All');

                if (respuesta.ok) {
                    const datos = await respuesta.json(); //convierte la respuesta de Java a un arreglo de JavaScript
                    setProductosDB(datos);
                } else {
                    setError('Error al cargar la lista de productos del servidor.');
                }
            } catch (err) {
                console.log(err);
                setError('No se pudo establecer conexion con el servidor');
            }
        }
        
        traerProductos();
    }, []); //Los corchetes [], sirven para avisar a React que esto solo lo haga una sola vez al abrir el modal.

    const agregarFila = () => {
        setStockDiario([...stockDiario, {id_fila: crypto.randomUUID(), id_producto: '', stock:'' }]);
        /*Los ... se llama Spread Operator y stockDiario es la tabla vieja. En idioma humano significa: "Copia todas las filas que ya existían en la tabla vieja y pégalas aquí".*/
    }

    const actualizarFila = (index, campo, valor) => {
        const nuevaFilas = [...stockDiario];
        nuevaFilas[index][campo] = valor;
        setStockDiario(nuevaFilas);
    };

    const eliminarFila = (index) => {
        const nuevaFilas = stockDiario.filter((_, i) => i !== index);
        setStockDiario(nuevaFilas);
    };

    const handleGuardar = async () => {

        if (stockDiario.length === 0) {
            setError('Debes cargar al menos un producto para abrir la planilla.');
            return;
        }
        for (let i = 0; i < stockDiario.length; i++) {
            const fila = stockDiario[i];
            const numeroFila = i + 1;
            
            if (!fila.id_producto || fila.id_producto === '') {
                setError(`Faltó seleccionar un producto en la fila ${numeroFila}.`);
                return;
            }
            const cantidad = parseInt(fila.stock); //parseInt() sirve para covertir a numero
            if (!fila.stock || isNaN(cantidad) || cantidad < 1) {
                setError(`La cantidad debe ser al menos 1 en la fila ${numeroFila}.`);
                return;
            }
        }
        
        setError('');
        try {
            console.log('Guardando planilla...', stockDiario);
            
            const planillaDTO = {
                stockProductos: stockDiario.map(fila => ({
                    id_producto: parseInt(fila.id_producto),
                    stock: parseInt(fila.stock)
                }))
            };
            
            console.log("Enviando: ", planillaDTO);
            const respuesta = await fetch('http://localhost:8080/api/planilla/new', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(planillaDTO)
            });

            if (respuesta.ok) {
                const planillaCreada = await respuesta.json();
                console.log('Planilla abierta con exito: ', planillaCreada);

                cerrarModal();
                onPlanillaCreada(planillaCreada); 

            } else {
                const mensajeError = await respuesta.text();
                setError(mensajeError ? mensajeError : 'Error en el servidor al intentar abrir la planilla.');
            }
        } catch (err) {
            console.log(err);
            setError('Error al intentar conectar con el servidor.')
        }
        
    };

    const idsEnUso = stockDiario.map(fila => String(fila.id_producto)).filter(id => id !== '');
    
    return(
        <div className="modal-overlay">
            <div className="modal-contenido" style={{width:'500px'}}>
                
                <div className="modal-header">
                    <h3>Abrir Nueva Planilla</h3>
                    <button className="btn-cerrar-modal" onClick={cerrarModal}>X</button>
                </div>

                <div className="modal-body">
                    {error && (
                        <div style={{ backgroundColor: 'var(--danger-soft)', color: 'var(--danger-soft-text)', padding: '10px', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem', marginBottom: '15px' }}>
                            {error}
                        </div>
                    )}

                    <p>Cargar el inventario inicial para el día de hoy:</p>

                    {stockDiario.map((fila,index) => (
                        <div key={fila.id_fila} style={{display: 'flex', gap: '10px', marginBotton: '10px'}}>

                            <SelectPersonalizado
                                style={{ flex: 2 }}
                                value={fila.id_producto}
                                onChange={(e) => actualizarFila(index, 'id_producto', e.target.value)}
                                placeholder="Seleccionar Producto"
                                opciones={[...productosDB]
                                    .sort((a, b) => a.nombre.localeCompare(b.nombre))
                                    .filter(prod => {
                                        const idProdString = String(prod.id);
                                        const estaEnUso = idsEnUso.includes(idProdString);
                                        const esMiSeleccion = String(fila.id_producto) === idProdString;
                                        return !estaEnUso || esMiSeleccion;
                                    })
                                    .map(prod => ({ value: prod.id, label: prod.nombre }))}
                                capitalizarOpciones
                            />
                            
                            <input
                                type="number"
                                style={{ flex: 1, padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--surface)', color: 'var(--text-primary)' }}
                                placeholder="inventario"
                                value={fila.stock}
                                onChange={(e) => actualizarFila(index, 'stock', e.target.value)}
                                min="1"
                                step="0.5" 
                            />

                            <button
                                type="button"
                                className="btn-eliminar-fila"
                                onClick={() => eliminarFila(index)}
                            >X</button>

                        </div>
                    ))}
                </div>
                
                <button
                    className="btn-global btn-primario"
                    type="button"
                    onClick={agregarFila}
                    style={{ padding: '8px', margin: '10px', }}>
                    + Agregar otro producto
                </button>

                <div className="modal-footer">
                    <button className="btn-global btn-secundario" onClick={cerrarModal}>Cancelar</button>
                    <button className="btn-global btn-primario-green" onClick={handleGuardar}>Abrir Planilla</button>
                </div>

            </div>
        </div>
    );
}

export default ModalPlanilla;
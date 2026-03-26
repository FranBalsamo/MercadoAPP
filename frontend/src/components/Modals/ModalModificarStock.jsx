import '../Estilos/Modal.css';
import '../Estilos/FormEditarStock.css';
import { useEffect, useState } from 'react';

function ModalModificarStock({ cerrarModal, planilla, catalogoProductos }) {
    const [stockProductos, setStockProductos] = useState([]);
    const [error, setError] = useState('');
    const [nuevosStocks, setNuevosStocks] = useState({});

    useEffect(() => {
        const obtenerStockDeLaPlanilla = async () => {
            if (!planilla || !planilla.id) return;

            try {
                const respuesta = await fetch(`http://localhost:8080/api/planilla/stocks/${planilla.id}`);
                if (respuesta.ok) {
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
                    setStockProductos(stockProductosFormateados);
                } else {
                    setError('❌ No se pudo sincronizar el stock con el servidor.');
                }
            } catch (err) {
                console.error(err);
                setError('❌ Error de conexión al verificar el stock.');
            }
        };
        obtenerStockDeLaPlanilla();
    }, [planilla]);

    const handleCambioStock = (id_producto, valor) => {
        setNuevosStocks({...nuevosStocks,[id_producto]: valor});
    };

    const hayInputsVacios = Object.values(nuevosStocks).some(valor => valor === '');

    const hayCambios = Object.keys(nuevosStocks).some(id_prod => {
        const valorModificado = nuevosStocks[id_prod];
        if (valorModificado === '') {
            return false;
        }
        const stockProdOriginal = stockProductos.find(p => String(p.id_producto) === String(id_prod));

        if (!stockProdOriginal) return false;

        const disponibleOriginal = stockProdOriginal.stock - stockProdOriginal.stock_vendido;

        return Number(valorModificado) !== disponibleOriginal;
    });

    const backgroundColorInput = (valorActualizado, disponibleReal) => {
        if (valorActualizado === '') {
            return '#f663'
        }else if (Number(valorActualizado) === disponibleReal) {
            return '#ffff';
        }
        return '#fffbe6';
    }
    
    return (
        <div className="modal-overlay">
            <div className="modal-contenido" style={{ width: '95%', maxWidth: '500px', maxHeight: '700px', height:'95%' }}>

                <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3>✏️ Modificar Stock</h3>
                    <button className="btn-cerrar" onClick={cerrarModal}>X</button>
                </div>

                <div className="modal-body" style={{height:'100%'}}>
                    {(error || hayInputsVacios) && (
                        <p style={{ color: '#c0392b', fontWeight: 'bold', margin: '0', padding: '0' }}>
                            {error || "❌ Los campos no pueden estar vacíos!"}
                        </p>
                    )}

                    <p style={{ color: '#7f8c8d', fontSize: '0.95rem', marginBottom: '3px' }}>
                        Ajusta la cantidad disponible de los productos necesarios.
                    </p>

                    <div style={{maxHeight:'400px', overflowY: 'auto', border: '1px solid #fff',boxShadow:'4px 4px 10px', borderRadius: '6px' }}>
                        <table style={{height:'80%',width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ backgroundColor: '#f4f6f8', position: 'sticky', top: 0, zIndex: 1 }}>
                                <tr>
                                    <th style={{ padding: '12px', borderBottom: '2px solid #ccc' }}>Producto</th>
                                    <th style={{ padding: '12px', borderBottom: '2px solid #ccc', width: '150px', textAlign: 'center' }}>Cant. Disponible</th>
                                    <th style={{ padding: '12px', borderBottom: '2px solid #ccc'}}> </th>
                                </tr>
                            </thead>
                            <tbody style={{height:'250px'}}>
                                {stockProductos.length === 0 ? (
                                    <tr>
                                        <td colSpan="2" style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                                            Cargando inventario...
                                        </td>
                                    </tr>
                                ) : (
                                    stockProductos.map(item => {
                                        const prodCatalogo = catalogoProductos?.find(p => String(p.id) === String(item.id_producto));
                                        const nombre = prodCatalogo?.nombre || `Producto #${item.id_producto}`;
                                        const disponibleReal = item.stock - item.stock_vendido;
                                        const valorAVisualizar = nuevosStocks[item.id_producto] !== undefined
                                            ? nuevosStocks[item.id_producto]
                                            : disponibleReal;
                                        
                                        return (
                                            <tr key={item.id_producto} style={{borderBottom: '1px solid #eee'}}>
                                                <td style={{
                                                    padding: '10px',
                                                    textTransform: 'capitalize',
                                                    fontWeight: '500',
                                                }}>
                                                    {nombre}
                                                </td>
                                                <td style={{padding: '10px', textAlign: 'center' }}>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={valorAVisualizar}
                                                        onChange={(e) => handleCambioStock(item.id_producto, e.target.value)}
                                                        style={{
                                                            width: '100%',
                                                            padding: '8px',
                                                            borderRadius: '4px',
                                                            border: '1px solid',
                                                            borderColor: valorAVisualizar === ''? '#c32b' : '#ccc',
                                                            outline: 'none',
                                                            textAlign: 'center',
                                                            fontWeight: 'bold',
                                                            color: valorAVisualizar ==='' ? '#c32b' : '#2c3e50',
                                                            backgroundColor: backgroundColorInput(valorAVisualizar, disponibleReal), 
                                                        }}
                                                    />
                                                </td>
                                                <td style={{padding: '10px', textAlign:'center'}}>
                                                        <button style={{backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '50%', width: '25px', height: '25px', cursor: 'pointer'}}>
                                                        X
                                                        </button>
                                                    </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                </div>

                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '20px' }}>
                    <button type="button" className="btn-secundario" onClick={cerrarModal}>Cancelar</button>

                    <button
                        type="button"
                        className="btn-primario"
                        disabled={!hayCambios}
                        style={{
                            backgroundColor: !hayCambios ? '#bdc3c7' : '#2ecc71',
                            cursor: !hayCambios ? 'not-allowed' : 'pointer',
                            border: 'none', padding: '10px 20px', borderRadius: '4px', color: 'white', fontWeight: 'bold',
                            transition: 'background-color 0.3s'
                        }}
                    >
                        Guardar Cambios
                    </button>
                </div>

            </div>
        </div>
    );
}

export default ModalModificarStock;
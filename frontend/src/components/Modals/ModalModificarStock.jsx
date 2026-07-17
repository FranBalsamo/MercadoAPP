import { useEffect, useState } from 'react';
import { HiOutlinePencilSquare, HiOutlineCube, HiOutlineExclamationTriangle } from 'react-icons/hi2';
import '../Estilos/Modal.css';
import '../Estilos/FormEditarStock.css';
import AlertaConfirmacion from '../Alertas/AlertaConfirmacion';
import { formatearFechaVisual } from '../../utils/formatoFecha';

function ModalModificarStock({ cerrarModal, planilla, catalogoProductos, onStockActualizado }) {
    const [stockProductos, setStockProductos] = useState([]);
    const [error, setError] = useState('');
    const [nuevosStocks, setNuevosStocks] = useState({});
    const [mostrarAlertaEliminar, setMostrarAlertaEliminar] = useState(false);
    const [itemAEliminar, setItemAEliminar] = useState(null);

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
                    setError('No se pudo sincronizar el inventario con el servidor.');
                }
            } catch (err) {
                console.error(err);
                setError('Error de conexión al verificar el inventario.');
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
            return 'var(--danger-soft)'
        }else if (Number(valorActualizado) === disponibleReal) {
            return 'var(--surface)';
        }
        return 'var(--warning-soft)';
    };

    const stockOrdenado = [...stockProductos]
        .map(itemStock => {
            const producto = catalogoProductos.find(p => String(p.id) === String(itemStock.id_producto));
            return {
                ...itemStock,
                nombre: producto ? producto.nombre : `Prod #${itemStock.id_producto}`
            };
        })
        .sort((a, b) => a.nombre.localeCompare(b.nombre));

    const solicitarEliminacion = (itemStock) => {
        if (itemStock.stock_vendido > 0) {
            setError(`No se puede eliminar "${itemStock.nombre}" porque ya tiene ${itemStock.stock_vendido} venta(s) registrada(s).`);
            return; 
        }
        setError('');
        setItemAEliminar(itemStock);
        setMostrarAlertaEliminar(true);
    };

    const confirmarEliminacionStock = async () => {
        if (!itemAEliminar) return;

        try {
            const respuesta = await fetch(`http://localhost:8080/api/stock/delete/${itemAEliminar.id}`, {
                method: 'DELETE'
            });

            if (respuesta.ok) {
                setStockProductos(prevStock => prevStock.filter(p => p.id !== itemAEliminar.id));
                
                const nuevosStocksCopia = { ...nuevosStocks };
                delete nuevosStocksCopia[itemAEliminar.id_producto];
                setNuevosStocks(nuevosStocksCopia);

                setMostrarAlertaEliminar(false);
                setItemAEliminar(null);
                await onStockActualizado();
                
            } else {
                setError('Error del servidor al intentar eliminar el producto.');
                setMostrarAlertaEliminar(false);
            }
        } catch (error) {
            console.error("Error de conexión:", error);
            setError('Error de conexión al intentar eliminar el producto.');
            setMostrarAlertaEliminar(false);
        }
    };

    const guardarCambiosStock = async () => {
        if (hayInputsVacios) {
            setError('No se pueden guardar cambios con campos vacíos.');
            return;
        }
        if (!planilla || !planilla.id) {
            setError('No se pudo identificar la planilla para actualizar el inventario.');
            return;
        }

        try {
            const listaStockActualizada = stockProductos.map(item => {
                if (nuevosStocks[item.id_producto] !== undefined){
                    const nuevoDisponible = Number(nuevosStocks[item.id_producto]);
                    const nuevoStockTotal = nuevoDisponible + item.stock_vendido;
                    return {
                        id: item.id,
                        id_producto: item.id_producto,
                        id_planilla: item.id_planilla,
                        stock: nuevoStockTotal,
                        stock_vendido: item.stock_vendido
                    }
                } else {
                    return item;
                }
            });

            console.log("Enviando actualizacion de stock: ", listaStockActualizada);

            const respuesta = await fetch(`http://localhost:8080/api/stock/update`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(listaStockActualizada)
            });
            
            if (!respuesta.ok) {
                throw new Error('Error al actualizar el inventario en el servidor.');
            }
            await onStockActualizado();
            cerrarModal();
        } catch (err) { 
            console.error(err);
            setError('Error al intentar guardar los cambios en el servidor.');
        }
    };

    const cantidadCambios = Object.keys(nuevosStocks).filter(id_prod => {
        const valorModificado = nuevosStocks[id_prod];
        if (valorModificado === '') return false;
        const stockProdOriginal = stockProductos.find(p => String(p.id_producto) === String(id_prod));
        if (!stockProdOriginal) return false;
        const disponibleOriginal = stockProdOriginal.stock - stockProdOriginal.stock_vendido;
        return Number(valorModificado) !== disponibleOriginal;
    }).length;

    return (
        <div className="modal-overlay">
            <div className="modal-contenido" style={{ width: '95%', maxWidth: '560px', maxHeight: '700px', height: '95%' }}>

                <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><HiOutlinePencilSquare /> Modificar Inventario</h3>
                    <button className="btn-cerrar-modal" onClick={cerrarModal}>×</button>
                </div>

                <div className="modal-body" style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>

                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        backgroundColor: 'var(--info-soft)', color: 'var(--info-soft-text)',
                        padding: '10px 15px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
                        fontSize: '0.9rem', fontWeight: 'bold'
                    }}>
                        <HiOutlineCube />
                        Planilla del {planilla?.fecha ? formatearFechaVisual(planilla.fecha) : '-'}
                        <span style={{ fontWeight: 'normal', color: 'var(--text-secondary)' }}>
                            — ajustá la cantidad disponible de cada producto
                        </span>
                    </div>

                    {(error || hayInputsVacios) && (
                        <p style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            color: 'var(--danger-soft-text)', fontWeight: 'bold', margin: 0,
                            padding: '10px 15px', backgroundColor: 'var(--danger-soft)', borderRadius: 'var(--radius-md)'
                        }}>
                            <HiOutlineExclamationTriangle style={{ flexShrink: 0 }} />
                            {error || "Los campos no pueden estar vacíos."}
                        </p>
                    )}

                    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', borderRadius: 'var(--radius-md)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ backgroundColor: 'var(--surface-inverse)', color: 'var(--text-on-inverse)', position: 'sticky', top: 0, zIndex: 1 }}>
                                <tr>
                                    <th style={{ padding: '12px' }}>Producto</th>
                                    <th style={{ padding: '12px', width: '90px', textAlign: 'center' }}>Vendido</th>
                                    <th style={{ padding: '12px', width: '150px', textAlign: 'center' }}>Disponible</th>
                                    <th style={{ padding: '12px', width: '50px' }} />
                                </tr>
                            </thead>
                            <tbody>
                                {stockOrdenado.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                            Cargando inventario...
                                        </td>
                                    </tr>
                                ) : (
                                    stockOrdenado.map(item => {
                                        const disponibleReal = item.stock - item.stock_vendido;
                                        const valorAVisualizar = nuevosStocks[item.id_producto] !== undefined
                                            ? nuevosStocks[item.id_producto]
                                            : disponibleReal;
                                        const delta = valorAVisualizar === '' ? 0 : Number(valorAVisualizar) - disponibleReal;

                                        return (
                                            <tr key={item.id_producto} style={{ borderBottom: '1px solid var(--border)' }}>
                                                <td style={{
                                                    padding: '10px',
                                                    textTransform: 'capitalize',
                                                    fontWeight: '500',
                                                    color: 'var(--text-primary)',
                                                }}>
                                                    {item.nombre}
                                                </td>
                                                <td style={{ padding: '10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                                    {item.stock_vendido}
                                                </td>
                                                <td style={{ padding: '10px' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={valorAVisualizar}
                                                            onChange={(e) => handleCambioStock(item.id_producto, e.target.value)}
                                                            style={{
                                                                width: '100%',
                                                                padding: '8px',
                                                                borderRadius: 'var(--radius-sm)',
                                                                border: '1px solid',
                                                                borderColor: valorAVisualizar === '' ? 'var(--danger)' : 'var(--border)',
                                                                outline: 'none',
                                                                textAlign: 'center',
                                                                fontWeight: 'bold',
                                                                color: valorAVisualizar === '' ? 'var(--danger)' : 'var(--text-primary)',
                                                                backgroundColor: backgroundColorInput(valorAVisualizar, disponibleReal),
                                                            }}
                                                        />
                                                        <span style={{
                                                            height: '14px',
                                                            fontSize: '0.72rem',
                                                            fontWeight: 'bold',
                                                            color: delta > 0 ? 'var(--success)' : 'var(--danger)',
                                                            visibility: delta !== 0 ? 'visible' : 'hidden'
                                                        }}>
                                                            {delta > 0 ? `+${delta}` : delta}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '10px', textAlign: 'center' }}>
                                                    <button
                                                        className="btn-eliminar-fila"
                                                        title='Eliminar producto del catalogo'
                                                        onClick={() => solicitarEliminacion(item)}
                                                    >
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

                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '15px', marginTop: '20px' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', visibility: cantidadCambios > 0 ? 'visible' : 'hidden' }}>
                        {cantidadCambios} {cantidadCambios === 1 ? 'producto modificado' : 'productos modificados'}
                    </span>
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <button type="button" className="btn-global btn-secundario" onClick={cerrarModal}>Cancelar</button>
                        <button
                            type="button"
                            className="btn-global btn-primario-green"
                            disabled={!hayCambios}
                            onClick={guardarCambiosStock}
                        >
                            Guardar Cambios
                        </button>
                    </div>
                </div>

            </div>

            {mostrarAlertaEliminar && (
                <AlertaConfirmacion
                    mensaje={`¿Eliminar "${itemAEliminar?.nombre}" del inventario?\nEsta acción no se puede deshacer.`}
                    onConfirmar={confirmarEliminacionStock}
                    onCancelar={() => {
                        setMostrarAlertaEliminar(false);
                        setItemAEliminar(null);
                    }}
                />
            )}
        </div>
    );
}

export default ModalModificarStock;
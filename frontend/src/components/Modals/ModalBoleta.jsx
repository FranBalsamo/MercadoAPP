import { useState } from 'react';
import '../Estilos/Modal.css';

function ModalBoleta({ cerrarModal, cliente, planilla, catalogoProductos }) {
    // ESTADOS DEL CARRITO
    const [carrito, setCarrito] = useState([]);
    
    // ESTADOS DEL MINI-FORMULARIO (Ahora con precios manuales)
    const [idProductoSel, setIdProductoSel] = useState('');
    const [cantidadSel, setCantidadSel] = useState(1);
    const [precioUnSel, setPrecioUnSel] = useState('');    // ¡NUEVO! Precio que tipea el usuario
    const [precioVacioSel, setPrecioVacioSel] = useState(''); // ¡NUEVO! Precio del cajón vacío
    
    const [errorVenta, setErrorVenta] = useState('');

    const agregarAlCarrito = () => {
        setErrorVenta(''); 

        // 1. Validaciones básicas
        if (!idProductoSel || cantidadSel < 1) {
            setErrorVenta('❌ Selecciona un producto y una cantidad mayor a 0.');
            return;
        }

        // Convertimos los textos de los inputs a números (si están vacíos, valen 0)
        const precioReal = parseFloat(precioUnSel) || 0;
        const vacioReal = parseFloat(precioVacioSel) || 0;
        const cantidadReal = parseInt(cantidadSel);

        if (precioReal <= 0) {
            setErrorVenta('❌ El precio del producto debe ser mayor a 0.');
            return;
        }

        const productoReal = catalogoProductos.find(p => String(p.id) === String(idProductoSel));
        const productoEnPlanilla = planilla.stockProductos.find(p => String(p.id_producto) === String(idProductoSel));
        
        if (!productoEnPlanilla) {
            setErrorVenta('❌ Este producto no fue cargado en la planilla de hoy.');
            return;
        }

        const stockDisponible = productoEnPlanilla.stock - productoEnPlanilla.stock_vendido;

        if (cantidadReal > stockDisponible) {
            setErrorVenta(`❌ Stock insuficiente. Solo quedan ${stockDisponible} unidades.`);
            return;
        }

        // 2. EL CÁLCULO MAYORISTA: (Cant * Precio) + (Cant * Vacio)
        const subtotalFila = (cantidadReal * precioReal) + (cantidadReal * vacioReal);

        // 3. Armamos la nueva fila
        const nuevaFila = {
            id_fila: crypto.randomUUID(), 
            id_producto: productoReal.id,
            nombre: productoReal.nombre,
            precio_unitario: precioReal,
            precio_vacio: vacioReal,
            cantidad: cantidadReal,
            subtotal: subtotalFila
        };

        // 4. Agregamos al carrito y reseteamos los inputs para el siguiente producto
        setCarrito([...carrito, nuevaFila]);
        setIdProductoSel('');
        setCantidadSel(1);
        setPrecioUnSel('');
        setPrecioVacioSel('');
    };

    const eliminarDelCarrito = (id_fila_borrar) => {
        setCarrito(carrito.filter(item => item.id_fila !== id_fila_borrar));
    };

    const totalBoleta = carrito.reduce((suma, item) => suma + item.subtotal, 0);

    return (
        <div className="modal-overlay">
            <div className="modal-contenido" style={{ width: '95%', maxWidth: '1000px' }}>
                
                <div className="modal-header">
                    <h3>🧾 Nueva Boleta</h3>
                    <button className="btn-cerrar" onClick={cerrarModal}>X</button>
                </div>

                <div className="modal-body">
                    {/* DATOS DEL CLIENTE */}
                    <div style={{ backgroundColor: '#e8f4f8', padding: '10px 15px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #bce8f1', display: 'flex', justifyContent: 'space-between' }}>
                        <div><strong style={{ color: '#31708f' }}>👤 Cliente:</strong> {cliente?.nombre}</div>
                        <div><strong style={{ color: '#31708f' }}>CUIT:</strong> {cliente?.documento}</div>
                    </div>

                    {/* SELECTOR Y CARGA MANUAL DE PRECIOS */}
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', marginBottom: '20px', backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '8px', border: '1px solid #ddd', flexWrap: 'wrap' }}>
                        
                        <div style={{ flex: '2 1 200px' }}>
                            <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Producto:</label>
                            <select 
                                value={idProductoSel} 
                                onChange={(e) => setIdProductoSel(e.target.value)}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                            >
                                <option value="">-- Seleccionar --</option>
                                {planilla.stockProductos.map(item => {
                                    const prod = catalogoProductos.find(p => String(p.id) === String(item.id_producto));
                                    const disp = item.stock - item.stock_vendido;
                                    return (
                                        <option key={item.id_producto} value={item.id_producto} disabled={disp <= 0}>
                                            {prod ? prod.nombre : `Prod #${item.id_producto}`} (Stock: {disp})
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        <div style={{ flex: '1 1 80px' }}>
                            <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Cant:</label>
                            <input 
                                type="number" min="1" 
                                value={cantidadSel} 
                                onChange={(e) => setCantidadSel(e.target.value)}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                            />
                        </div>

                        <div style={{ flex: '1 1 100px' }}>
                            <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>$ Precio Un.:</label>
                            <input 
                                type="number" min="0" step="0.01"
                                placeholder="0.00"
                                value={precioUnSel} 
                                onChange={(e) => setPrecioUnSel(e.target.value)}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#fffbe6' }} // Fondo amarillo suave para resaltar que hay que escribir
                            />
                        </div>

                        <div style={{ flex: '1 1 100px' }}>
                            <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>$ Vacío:</label>
                            <input 
                                type="number" min="0" step="0.01"
                                placeholder="0.00"
                                value={precioVacioSel} 
                                onChange={(e) => setPrecioVacioSel(e.target.value)}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                            />
                        </div>

                        <button 
                            onClick={agregarAlCarrito}
                            style={{ padding: '9px 20px', backgroundColor: '#2ecc71', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                            + Agregar
                        </button>
                    </div>

                    {errorVenta && <div style={{ color: '#c0392b', marginBottom: '10px', fontSize: '0.9rem', fontWeight: 'bold' }}>{errorVenta}</div>}

                    {/* LA TABLA ACTUALIZADA */}
                    <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
                            <thead style={{ backgroundColor: '#f4f6f8', position: 'sticky', top: 0 }}>
                                <tr>
                                    <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>Producto</th>
                                    <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>Cant.</th>
                                    <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>$ Precio</th>
                                    <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>$ Vacío</th>
                                    <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>Subtotal</th>
                                    <th style={{ padding: '10px', borderBottom: '2px solid #ddd', textAlign: 'center' }}>X</th>
                                </tr>
                            </thead>
                            <tbody>
                                {carrito.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#888' }}>No hay productos en la boleta.</td>
                                    </tr>
                                ) : (
                                    carrito.map(fila => (
                                        <tr key={fila.id_fila} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '10px', fontWeight: 'bold' }}>{fila.nombre}</td>
                                            <td style={{ padding: '10px' }}>{fila.cantidad}</td>
                                            <td style={{ padding: '10px' }}>${fila.precio_unitario.toFixed(2)}</td>
                                            <td style={{ padding: '10px', color: '#7f8c8d' }}>
                                                {fila.precio_vacio > 0 ? `$${fila.precio_vacio.toFixed(2)}` : '-'}
                                            </td>
                                            <td style={{ padding: '10px', fontWeight: 'bold', color: '#27ae60' }}>${fila.subtotal.toFixed(2)}</td>
                                            <td style={{ padding: '10px', textAlign: 'center' }}>
                                                <button 
                                                    onClick={() => eliminarDelCarrito(fila.id_fila)}
                                                    style={{ backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '50%', width: '25px', height: '25px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                >
                                                    X
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                </div>
                
                {/* FOOTER */}
                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9f9f9', marginTop: '0' }}>
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <label style={{ cursor: 'pointer' }}><input type="checkbox" /> Pagado</label>
                        <label style={{ cursor: 'pointer' }}><input type="checkbox" /> Retirado</label>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <h2 style={{ margin: 0, color: '#2c3e50' }}>Total: ${totalBoleta.toFixed(2)}</h2>
                        <div>
                            <button className="btn-secundario" onClick={cerrarModal} style={{ marginRight: '10px' }}>Cancelar</button>
                            <button className="btn-primario">Guardar Boleta</button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default ModalBoleta;
import { useState } from 'react';
import '../Estilos/Modal.css';

function ModalBoleta({ cerrarModal, cliente, planilla, catalogoProductos, onBoletaGuardada }) {
    const [carrito, setCarrito] = useState([]);
    const [idProducto, setIdProducto] = useState('');
    const [cantidad, setCantidad] = useState(1);
    const [precioUnitario, setPrecioUnitario] = useState('');   
    const [precioVacio, setPrecioVacio] = useState('');
    const [pagado, setPagado] = useState('NO_PAGADO');
    const [retirado, setRetirado] = useState('NO_RETIRADO');
    const [guardando, setGuardando] = useState(false);

    const [errorVenta, setErrorVenta] = useState('');

    const agregarAlCarrito = () => {
        setErrorVenta(''); 

        // 1. Validaciones básicas usando los nombres nuevos
        if (!idProducto || cantidad < 1) {
            setErrorVenta('❌ Selecciona un producto y una cantidad mayor a 0.');
            return;
        }

        const precioReal = parseFloat(precioUnitario) || 0;
        const vacioReal = parseFloat(precioVacio) || 0;
        const cantidadReal = parseFloat(cantidad);


        if (precioReal <= 0) {
            setErrorVenta('❌ El precio del producto debe ser mayor a 0.');
            return;
        }

        const productoReal = catalogoProductos.find(p => String(p.id) === String(idProducto));
        const productoEnPlanilla = planilla.stockProductos.find(p => String(p.id_producto) === String(idProducto));
        
        if (!productoEnPlanilla) {
            setErrorVenta('❌ Este producto no fue cargado en la planilla de hoy.');
            return;
        }
        const stockEnBD = productoEnPlanilla.stock - productoEnPlanilla.stock_vendido;
        
        const yaEnCarrito = carrito
            .filter(item => String(item.id_producto) === String(idProducto))
            .reduce((suma, item) => suma + item.cantidad, 0);

        const stockFinalDisponible = stockEnBD - yaEnCarrito;

        if (cantidadReal > stockFinalDisponible) {
            if (yaEnCarrito > 0) {
                setErrorVenta(`❌ Stock insuficiente. Ya tienes ${yaEnCarrito} en el carrito y solo quedan ${stockFinalDisponible} disponibles.`);
            } else {
                setErrorVenta(`❌ Stock insuficiente. Solo quedan ${stockFinalDisponible} unidades.`);
            }
            return;
        }

        const subtotalFila = (cantidadReal * precioReal) + (cantidadReal * vacioReal);

        //Armamos la nueva fila
        const nuevaFila = {
            id_fila: crypto.randomUUID(), 
            id_producto: productoReal.id,
            nombre: productoReal.nombre,
            precio_unitario: precioReal,
            precio_vacio: vacioReal,
            cantidad: cantidadReal,
            subtotal: subtotalFila
        };

        //Agregamos al carrito y reseteamos los inputs
        setCarrito([...carrito, nuevaFila]);
        setIdProducto('');
        setCantidad(1);
        setPrecioUnitario('');
        setPrecioVacio('');
    };

    const eliminarDelCarrito = (id_fila_borrar) => {
        setCarrito(carrito.filter(item => item.id_fila !== id_fila_borrar));
    };

    const totalBoleta = carrito.reduce((suma, item) => suma + item.subtotal, 0);

    const handleGuardarBoleta = async () => {
        if (carrito.length === 0) {
            setErrorVenta('❌ No puedes guardar una boleta vacía.');
            return;
        }

        setGuardando(true);
        setErrorVenta('');

        try {
            const boletaDTO = {
                id_planilla: planilla.id,
                id_cliente: cliente.id,
                total: totalBoleta,
                estadoPago: pagado,
                estadoRetiro: retirado,
                ventas: carrito.map(item => ({
                    id_producto: item.id_producto,
                    cantidad: item.cantidad,
                    precio_unitario: item.precio_unitario,
                    precio_vacio: item.precio_vacio,
                    subtotal: item.subtotal
                }))
            };

            console.log("Enviando Boleta a Java:", boletaDTO);

            const respuesta = await fetch('http://localhost:8080/api/boleta/new', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(boletaDTO)
            });

            if (!respuesta.ok) {
                setErrorVenta('❌ Error en el servidor al guardar la boleta.');
                setGuardando(false);
                return;
            }

            const boletaGuardada = await respuesta.json();
            console.log('¡Boleta guardada con éxito!', boletaGuardada);

            onBoletaGuardada(boletaGuardada); 
            cerrarModal();

        } catch (err) {
            console.error(err);
            setErrorVenta('❌ Error de conexión con el servidor.');
            setGuardando(false);
        }
    };

    let stockDisponibleActual = null;
    let cantidadYaEnCarrito = 0;

    if (idProducto) {
        // 1. Buscamos el stock en la base de datos (Planilla)
        const prodPlanilla = planilla.stockProductos.find(p => String(p.id_producto) === String(idProducto));
        
        if (prodPlanilla) {
            const stockEnBD = prodPlanilla.stock - prodPlanilla.stock_vendido;

            // 2. Calculamos cuánto de este producto YA ESTÁ en el carrito actual
            cantidadYaEnCarrito = carrito
                .filter(item => String(item.id_producto) === String(idProducto))
                .reduce((suma, item) => suma + item.cantidad, 0);

            // 3. El stock real disponible es el de la BD menos lo que ya separaste en el carrito
            stockDisponibleActual = stockEnBD - cantidadYaEnCarrito;
        }
    }

    // Pro-Tip: Usamos parseFloat en lugar de parseInt porque vi que en tu input tienes step="0.5"
    const cantidadRealInput = parseFloat(cantidad) || 0; 

    // La alerta salta si superan el stock REAL disponible
    const excedeStock = stockDisponibleActual !== null && cantidadRealInput > stockDisponibleActual;

    return (
        <div className="modal-overlay">
            <div className="modal-contenido" style={{ width: '95%', maxWidth: '800px' }}>
                
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
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', marginBottom: 0, backgroundColor: '#f9f9f9', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', flexWrap: 'wrap' }}>
                        
                        <div style={{ flex: '2 1 200px' }}>
                            <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Producto:</label>
                            <select 
                                value={idProducto} 
                                onChange={(e) => setIdProducto(e.target.value)} // Corregido
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                            >
                                <option value="">-- Seleccionar --</option>
                                {planilla.stockProductos.map(item => {
                                    const prod = catalogoProductos.find(p => String(p.id) === String(item.id_producto));
                                    const disp = item.stock - item.stock_vendido;
                                    return (
                                        <option key={item.id_producto} value={item.id_producto} disabled={disp <= 0}>
                                            {prod ? prod.nombre : `Prod #${item.id_producto}`}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        <div style={{ flex: '1 1 80px' }}>
                            {/* Mensaje de alerta dinámico */}
                            {excedeStock && (
                                <div style={{ color: '#c0392b', fontSize: '0.75rem', marginTop: '4px', fontWeight: 'bold' }}>
                                    Máx: {stockDisponibleActual}
                                </div>
                            )}
                            <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                                Cantidad:
                            </label>
                            <input
                                type="number" min="1" step="0.5"
                                value={cantidad}
                                onChange={(e) => setCantidad(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    borderRadius: '4px',
                                    // Borde rojo y fondo rojizo si se pasa del stock:
                                    border: excedeStock ? '2px solid #e74c3c' : '1px solid #ccc',
                                    backgroundColor: excedeStock ? '#fadbd8' : 'white',
                                    outline: 'none'
                                }}
                            />
                        </div>

                        <div style={{ flex: '1 1 100px' }}>
                            <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>$ Precio:</label>
                            <input 
                                type="number" min="0" step="0.01"
                                placeholder="0.00"
                                value={precioUnitario}
                                onChange={(e) => setPrecioUnitario(e.target.value)}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#fffbe6' }}
                            />
                        </div>

                        <div style={{ flex: '1 1 100px' }}>
                            <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>$ Vacío:</label>
                            <input 
                                type="number" min="0" step="0.01"
                                placeholder="0.00"
                                value={precioVacio} 
                                onChange={(e) => setPrecioVacio(e.target.value)}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                            />
                        </div>

                        <button
                            onClick={agregarAlCarrito}
                            disabled={excedeStock} // Desactiva el botón
                            style={{
                                padding: '9px 20px',
                                // Si excede, gris. Si está todo bien, verde.
                                backgroundColor: excedeStock ? '#bdc3c7' : '#2ecc71',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: excedeStock ? 'not-allowed' : 'pointer',
                                fontWeight: 'bold'
                            }}
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
                        <label style={{ cursor: 'pointer' }}>
                            <input 
                                type="checkbox" 
                                checked={pagado === 'PAGADO'}
                                value={'PAGADO'} 
                                onChange={(e) => setPagado(e.target.checked ? 'PAGADO' : 'NO_PAGADO')}
                            /> Pagado
                        </label>
                        <label style={{ cursor: 'pointer' }}>
                            <input 
                                type="checkbox" 
                                checked={retirado === 'RETIRADO'}
                                value={'RETIRADO'}
                                onChange={(e) => setRetirado(e.target.checked ? 'RETIRADO' : 'NO_RETIRADO')}
                            /> Retirado
                        </label>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <h2 style={{ margin: 0, color: '#2c3e50' }}>Total: ${totalBoleta.toFixed(2)}</h2>
                        <div>
                            <button className="btn-secundario" onClick={cerrarModal} style={{ marginRight: '10px' }}>Cancelar</button>
                            <button 
                                className="btn-primario" 
                                onClick={handleGuardarBoleta}
                                disabled={guardando}
                            >
                                {guardando ? 'Guardando...' : 'Guardar Boleta'}
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default ModalBoleta;
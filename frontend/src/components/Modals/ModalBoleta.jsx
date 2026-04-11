import { useState, useEffect } from 'react';
import '../Estilos/Modal.css';
import AlertaConfirmacion from '../Alertas/AlertaConfirmacion';

function ModalBoleta({ cerrarModal, cliente, planilla, catalogoProductos, onBoletaGuardada, volverABuscarCliente }) {
    // --- ESTADOS ORIGINALES ---
    const [carrito, setCarrito] = useState([]);
    const [idProducto, setIdProducto] = useState('');
    const [cantidad, setCantidad] = useState(1);
    const [precioUnitario, setPrecioUnitario] = useState('');   
    const [precioVacio, setPrecioVacio] = useState('');
    const [pagado, setPagado] = useState('NO_PAGADO');
    const [retirado, setRetirado] = useState('NO_RETIRADO');
    const [guardando, setGuardando] = useState(false);
    const [errorVenta, setErrorVenta] = useState('');
    const [stockProductos, setStockProductos] = useState([]);
    const [cargandoStock, setCargandoStock] = useState(true);
    const [mostrarAlertaVolver, setMostrarAlertaVolver] = useState(false);

    // --- EFECTO: BUSCAR STOCK REAL AL ABRIR EL MODAL ---
    useEffect(() => {
        const obtenerStockActualizado = async () => {
            setCargandoStock(true);
            try {
                const respuesta = await fetch(`http://localhost:8080/api/planilla/stocks/${planilla.id}`);
                
                if (respuesta.ok) {
                    //Procesamos la respuesta para asegurar la estructura de stockProducto
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
                    console.log('Stock actualizado para la boleta:', stockProductosFormateados);
                } else {
                    setErrorVenta('❌ No se pudo sincronizar el stock con el servidor.');
                }
            } catch (error) {
                console.error(error);
                setErrorVenta('❌ Error de conexión al verificar el stock.');
            } finally {
                setCargandoStock(false);
            }
        };
        obtenerStockActualizado();
    }, [planilla.id]);

    const agregarAlCarrito = () => {
        setErrorVenta(''); 

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
        
        // ¡CAMBIO CLAVE! Ahora validamos contra el stock fresco, no el de las props
        const stockProductoEnPlanilla = stockProductos.find(p => String(p.id_producto) === String(idProducto));
        
        if (!stockProductoEnPlanilla) {
            setErrorVenta('❌ Este producto no fue cargado en la planilla de hoy.');
            return;
        }
        
        const stockEnBD = stockProductoEnPlanilla.stock - stockProductoEnPlanilla.stock_vendido;
        
        const stockYaEnCarrito = carrito
            .filter(item => String(item.id_producto) === String(idProducto))
            .reduce((suma, item) => suma + item.cantidad, 0);

        const stockFinalDisponible = stockEnBD - stockYaEnCarrito;

        if (cantidadReal > stockFinalDisponible) {
            if (stockYaEnCarrito > 0) {
                setErrorVenta(`❌ Stock insuficiente. Ya tienes ${stockYaEnCarrito} en el carrito y solo quedan ${stockFinalDisponible} disponibles.`);
            } else {
                setErrorVenta(`❌ Stock insuficiente. Solo quedan ${stockFinalDisponible} unidades.`);
            }
            return;
        }

        const subtotalFila = (cantidadReal * precioReal) + (parseInt(cantidadReal) * vacioReal);

        const nuevaFila = {
            id_fila: crypto.randomUUID(), 
            id_producto: productoReal.id,
            nombre: productoReal.nombre,
            precio_unitario: precioReal,
            precio_vacio: vacioReal,
            cantidad: cantidadReal,
            subtotal: subtotalFila
        };

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

    const handleVolver = () => {
        //Ventana de confirmacion de accion
        if (carrito.length > 0){
            /*
            const confirmar = window.confirm("⚠️ Tienes productos cargados en esta boleta.\n\nSi vuelves a la selección de cliente, perderás estos datos.\n¿Estás seguro de que deseas volver?");
            if(!confirmar){
                return;
            }
            */
            setMostrarAlertaVolver(true);
        } else {
            volverABuscarCliente();
        }
        
    }

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
            onBoletaGuardada(boletaGuardada, carrito); // Pasamos el carrito por si tu VistaPuntoVenta aún lo necesita
            cerrarModal();

        } catch (err) {
            console.error(err);
            setErrorVenta('❌ Error de conexión con el servidor.');
            setGuardando(false);
        }
    };

    // --- LÓGICA DINÁMICA DE STOCK MEJORADA ---
    let stockDisponibleActual = null;
    let cantidadYaEnCarrito = 0;

    if (idProducto && !cargandoStock) {
        // ¡CAMBIO CLAVE! Leemos del stockProductos
        const prodPlanilla = stockProductos.find(p => String(p.id_producto) === String(idProducto));
        
        if (prodPlanilla) {
            const stockEnBD = prodPlanilla.stock - prodPlanilla.stock_vendido;

            cantidadYaEnCarrito = carrito
                .filter(item => String(item.id_producto) === String(idProducto))
                .reduce((suma, item) => suma + item.cantidad, 0);

            stockDisponibleActual = stockEnBD - cantidadYaEnCarrito;
        }
    }

    const cantidadRealInput = parseFloat(cantidad) || 0; 
    const excedeStock = stockDisponibleActual !== null && cantidadRealInput > stockDisponibleActual;

    return (
        <div className="modal-overlay">
            
            <div className="modal-contenido" style={{ width: '95%', maxWidth: '800px' }}>
                
                <div 
                className="modal-header" 
                style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                    }}>
                    <div style={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            gap: '10px'
                        }}>
                        <button 
                            onClick={handleVolver}
                            style={{ 
                                background: 'none', border: 'none', color: '#3498db', 
                                fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '5px'
                            }}
                            title="Volver a seleccionar cliente"
                        >
                            ⬅ Volver
                        </button>
                        <h3 style={{ margin: 0 }}>🧾 Nueva Boleta</h3>
                    </div>
                    <button className="btn-cerrar" onClick={cerrarModal}>X</button>
                </div>

                <div className="modal-body">
                    {/* DATOS DEL CLIENTE */}
                    <div style={{ backgroundColor: '#e8f4f8', padding: '10px 15px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #bce8f1', display: 'flex', justifyContent: 'space-between' }}>
                        <div><strong style={{ color: '#31708f' }}>👤 Cliente:</strong> <span style={{ textTransform: 'capitalize' }}>{cliente?.nombre}</span></div>
                        <div><strong style={{ color: '#31708f' }}>CUIT:</strong> {cliente?.documento}</div>
                    </div>

                    {/* BLOQUEO VISUAL MIENTRAS CARGA EL STOCK */}
                    {cargandoStock ? (
                        <div style={{ padding: '30px', textAlign: 'center', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '20px' }}>
                            <h4 style={{ color: '#3498db', margin: 0 }}>🔄 Sincronizando stock en vivo...</h4>
                            <p style={{ fontSize: '0.9rem', color: '#7f8c8d', marginTop: '5px' }}>Por favor, espera un segundo.</p>
                        </div>
                    ) : (
                        <>
                            {/* SELECTOR Y CARGA MANUAL DE PRECIOS */}
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', marginBottom: '10px', backgroundColor: '#f9f9f9', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', flexWrap: 'wrap' }}>
                                
                                <div style={{ flex: '2 1 200px' }}>
                                    <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Producto:</label>
                                    <select 
                                        value={idProducto} 
                                        onChange={(e) => setIdProducto(e.target.value)} 
                                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', textTransform:'capitalize'}}
                                    >
                                        <option value="">-- Seleccionar --</option>
                                        {stockProductos.map(item => {
                                            const prod = catalogoProductos.find(p => String(p.id) === String(item.id_producto));
                                            const disp = item.stock - item.stock_vendido;
                                            if(disp>0)
                                                return (
                                                    <option key={item.id_producto} value={item.id_producto} disabled={disp <= 0}>
                                                        {prod ? prod.nombre : `Prod #${item.id_producto}`}
                                                    </option>
                                                );
                                        })}
                                    </select>
                                </div>

                                <div style={{ flex: '1 1 80px' }}>
                                    {stockDisponibleActual !== null && (
                                        <div style={{ 
                                            color: (stockDisponibleActual > 0 && !excedeStock) ? '#27ae60' : '#c0392b', 
                                            fontSize: '0.75rem', 
                                            marginTop: '4px', 
                                            fontWeight: 'bold' 
                                        }}>
                                            {(stockDisponibleActual > 0 && !excedeStock) ? `disponible: ${stockDisponibleActual}` : 'Sin Stock'}
                                        </div>
                                    )}
                                    <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Cantidad:</label>
                                    <input
                                        type="number" min="1" step="0.5"
                                        value={cantidad}
                                        onChange={(e) => setCantidad(e.target.value)}
                                        style={{
                                            width: '100%', padding: '8px', borderRadius: '4px',
                                            border: excedeStock ? '2px solid #e74c3c' : '1px solid #ccc',
                                            backgroundColor: excedeStock ? '#fadbd8' : 'white',
                                            outline: 'none'
                                        }}
                                    />
                                </div>

                                <div style={{ flex: '1 1 100px' }}>
                                    <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>$ Precio:</label>
                                    <input 
                                        type="number" min="0" step="0.01" placeholder="0.00"
                                        value={precioUnitario} onChange={(e) => setPrecioUnitario(e.target.value)}
                                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#fffbe6' }}
                                    />
                                </div>

                                <div style={{ flex: '1 1 100px' }}>
                                    <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>$ Vacío:</label>
                                    <input 
                                        type="number" min="0" step="0.01" placeholder="0.00"
                                        value={precioVacio} onChange={(e) => setPrecioVacio(e.target.value)}
                                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                                    />
                                </div>

                                <button
                                    onClick={agregarAlCarrito}
                                    disabled={excedeStock || !idProducto || !stockDisponibleActual} // Apagado si no hay producto o excede
                                    style={{
                                        padding: '9px 20px',
                                        backgroundColor: (excedeStock || !idProducto) ? '#bdc3c7' : '#2ecc71',
                                        color: 'white', border: 'none', borderRadius: '4px', 
                                        cursor: (excedeStock || !idProducto) ? 'not-allowed' : 'pointer', fontWeight: 'bold'
                                    }}
                                >
                                    + Agregar
                                </button>
                            </div>
                        </>
                    )}

                    {errorVenta && <div style={{ color: '#c0392b', marginBottom: '10px', fontSize: '0.9rem', fontWeight: 'bold' }}>{errorVenta}</div>}

                    {/* TABLA DETALLE DE BOLETAS */}
                    <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
                            <thead style={{ backgroundColor: '#f4f6f8', position: 'sticky', top: 0 }}>
                                <tr>
                                    <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>Producto</th>
                                    <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>Cant.</th>
                                    <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>$ Precio</th>
                                    <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>$ Vacío</th>
                                    <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>Subtotal</th>
                                    <th style={{ padding: '10px', borderBottom: '2px solid #ddd'}}/>
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
                                            <td style={{ padding: '10px', fontWeight: 'bold', textTransform: 'capitalize' }}>{fila.nombre}</td>
                                            <td style={{ padding: '10px' }}>{fila.cantidad}</td>
                                            <td style={{ padding: '10px' }}>{fila.precio_unitario.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</td>
                                            <td style={{ padding: '10px', color: '#7f8c8d' }}>
                                                {fila.precio_vacio > 0 ? `${fila.precio_vacio.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}` : '-'}
                                            </td>
                                            <td style={{ padding: '10px', fontWeight: 'bold', color: '#27ae60' }}>{fila.subtotal.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</td>
                                            <td style={{ padding: '10px', textAlign: 'center' }}>
                                                <button 
                                                    onClick={() => eliminarDelCarrito(fila.id_fila)}
                                                    style={{backgroundColor: '#dddc', color: 'white', border: 'none', borderRadius: '80%', width: '25px', height: '25px', cursor: 'pointer', textAlign:'center', fontSize:'10px'}}>
                                                        ❌
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
                <div
                    className="modal-footer"
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between', alignItems: 'center',
                        backgroundColor: '#f9f9f9',
                        marginTop: 0
                    }}>
                    <div style={{ display: 'flex', gap:'5px' ,fontWeight:'bold'}}>
                        <input 
                            id='checkbox_pagado'
                            type="checkbox" 
                            checked={pagado === 'PAGADO'}
                            value={'PAGADO'} 
                            onChange={(e) => setPagado(e.target.checked ? 'PAGADO' : 'NO_PAGADO')}
                        />

                        <label 
                            htmlFor='checkbox_pagado'
                            style={{ cursor: 'pointer', paddingRight:'30px'}}>
                            Pagado
                        </label>
                        
                        <input 
                            id='checkbox_retirado'
                            type="checkbox" 
                            checked={retirado === 'RETIRADO'}
                            value={'RETIRADO'}
                            onChange={(e) => setRetirado(e.target.checked ? 'RETIRADO' : 'NO_RETIRADO')}
                        />

                        <label 
                            htmlFor='checkbox_retirado'
                            style={{ cursor: 'pointer' }}>
                            Retirado
                        </label>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <h2 style={{ margin: 0, color: '#2c3e50' }}>Total: {totalBoleta.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</h2>
                        <div>
                            <button className="btn-secundario" onClick={cerrarModal} style={{ marginRight: '10px' }}>Cancelar</button>
                            <button 
                                className="btn-primario" 
                                onClick={handleGuardarBoleta}
                                disabled={guardando || cargandoStock}
                            >
                                {guardando ? 'Guardando...' : 'Guardar Boleta'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ALERTA DE CONFIRMACION PARA VOLVER */}
            {mostrarAlertaVolver && (
                <AlertaConfirmacion 
                    mensaje={"Tienes productos cargados en esta boleta. \n"+ 
                        "Si vuelves a la selección de cliente, perderás estos datos.\n" +
                        "¿Estás seguro de que deseas volver?"}
                    onConfirmar={() => {
                        setMostrarAlertaVolver(false);
                        volverABuscarCliente();
                    }}
                    onCancelar={() => setMostrarAlertaVolver(false)}
                />
            )}

        </div>
    );
}

export default ModalBoleta;
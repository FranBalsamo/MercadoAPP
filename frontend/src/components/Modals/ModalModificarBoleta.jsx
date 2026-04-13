import { useState, useEffect } from 'react';
import '../Estilos/Modal.css';
import '../Estilos/Botones.css';

function ModalModificarBoleta({ cerrarModal, boleta, cliente, planilla, catalogoProductos, onBoletaEditada }) {
    // --- ESTADOS ---
    const [carrito, setCarrito] = useState([]);
    const [idProducto, setIdProducto] = useState('');
    const [cantidad, setCantidad] = useState(1);
    const [precioUnitario, setPrecioUnitario] = useState('');
    const [precioVacio, setPrecioVacio] = useState('');

    // Inicializamos con los datos de la boleta
    const [pagado, setPagado] = useState(boleta?.estadoPago || 'NO_PAGADO');
    const [retirado, setRetirado] = useState(boleta?.estadoRetiro || 'NO_RETIRADO');

    const [guardando, setGuardando] = useState(false);
    const [errorVenta, setErrorVenta] = useState('');
    const [stockProductos, setStockProductos] = useState([]);
    const [cargandoStock, setCargandoStock] = useState(true);

    // --- EFECTO: CARGAR DATOS PREVIOS Y STOCK ---
    useEffect(() => {
        // 1. Cargar los artículos que ya tenía la boleta en el carrito
        if (boleta && boleta.ventas && catalogoProductos) {
            const carritoInicial = boleta.ventas.map(venta => {
                const prod = catalogoProductos.find(p => String(p.id) === String(venta.id_producto));

                const precioU = Number(venta.precio_unitario || 0);
                const precioV = Number(venta.precio_vacio || 0);
                const cant = Number(venta.cantidad || 0);

                const subTCalculado = (cant * precioU) + (cant * precioV);

                return {
                    id_fila: crypto.randomUUID(),
                    id_producto: venta.id_producto,
                    nombre: prod ? prod.nombre : `Prod #${venta.id_producto}`,
                    precio_unitario: precioU,
                    precio_vacio: precioV,
                    cantidad: cant,
                    subtotal: subTCalculado
                };
            });
            setCarrito(carritoInicial);
        }

        // 2. Traer el stock actual y aplicar el "Reintegro Virtual"
        const obtenerStockActualizado = async () => {
            if (!planilla || !planilla.id) return;
            setCargandoStock(true);
            try {
                const respuesta = await fetch(`http://localhost:8080/api/planilla/stocks/${planilla.id}`);
                if (respuesta.ok) {
                    const listaStock = await respuesta.json();

                    const stockProductosFormateados = Array.isArray(listaStock)
                        ? listaStock.map(item => {

                            // Calculamos cuánto de este producto ya estaba reservado en esta boleta original
                            const cantidadEnEstaBoleta = boleta?.ventas
                                ? boleta.ventas
                                    .filter(v => String(v.id_producto) === String(item.id_producto))
                                    .reduce((suma, v) => suma + Number(v.cantidad || 0), 0)
                                : 0;

                            return {
                                id: item.id,
                                id_producto: item.id_producto,
                                id_planilla: item.id_planilla,
                                stock: item.stock,
                                // Al stock vendido de la BD, le restamos lo de esta boleta para "devolverlo" temporalmente a la disponibilidad.
                                stock_vendido: item.stock_vendido - cantidadEnEstaBoleta
                            };
                        })
                        : [];
                    setStockProductos(stockProductosFormateados);
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
    }, [boleta, planilla, catalogoProductos]);

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
            setErrorVenta(`❌ Stock insuficiente. Solo quedan ${stockFinalDisponible} unidades extras.`);
            return;
        }

        const subtotalFila = (cantidadReal * precioReal) + (cantidadReal * vacioReal);

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

    // --- FUNCIÓN PARA EDITAR FILAS DIRECTAMENTE EN LA TABLA ---
    const actualizarFilaCarrito = (id_fila_modificar, campo, nuevoValor) => {
        setCarrito(prevCarrito => prevCarrito.map(fila => {
            if (fila.id_fila === id_fila_modificar) {
                // 1. Actualizamos el valor
                const filaActualizada = { ...fila, [campo]: nuevoValor };

                // 2. Extraemos los números para la matemática
                const cant = Number(filaActualizada.cantidad || 0);
                const precioU = Number(filaActualizada.precio_unitario || 0);
                const precioV = Number(filaActualizada.precio_vacio || 0);

                // 3. Recalculamos el subtotal de esta fila
                filaActualizada.subtotal = (cant * precioU) + (cant * precioV);

                return filaActualizada;
            }
            return fila;
        }));
    };

    const eliminarDelCarrito = (id_fila_borrar) => {
        setCarrito(carrito.filter(item => item.id_fila !== id_fila_borrar));
    };

    const totalBoleta = carrito.reduce((suma, item) => suma + item.subtotal, 0);

    const guardarCambios = async (e) => {
        e.preventDefault();

        if (carrito.length === 0) {
            setErrorVenta('❌ No puedes guardar una boleta sin artículos.');
            return;
        }

        setGuardando(true);
        setErrorVenta('');

        try {
            const boletaEditadaDTO = {
                id: boleta.id,
                id_planilla: boleta.id_planilla,
                id_cliente: boleta.id_cliente,
                total: totalBoleta,
                estadoPago: pagado,
                estadoRetiro: retirado,
                ventas: carrito.map(item => ({
                    id_producto: item.id_producto,
                    cantidad: Number(item.cantidad),
                    precio_unitario: Number(item.precio_unitario),
                    precio_vacio: Number(item.precio_vacio),
                    subtotal: Number(item.subtotal)
                }))
            };

            const respuesta = await fetch(`http://localhost:8080/api/boleta/edit/${boleta.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(boletaEditadaDTO)
            });

            if (!respuesta.ok) {
                throw new Error(`Error en el servidor: ${respuesta.status}`);
            }

            const boletaActualizada = await respuesta.json();

            console.log("La boleta se actualizo correctamente! " + boletaActualizada);
            onBoletaEditada(boletaActualizada);
            cerrarModal();

        } catch (err) {
            console.error("Error al modificar boleta:", err);
            setErrorVenta('❌ Ocurrió un error al intentar actualizar la boleta.');
        } finally {
            setGuardando(false);
        }
    };

    // --- LÓGICA DINÁMICA DE STOCK ---
    let stockDisponibleActual = null;
    let cantidadYaEnCarrito = 0;

    if (idProducto && !cargandoStock) {
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

                <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0 }}>✏️ Editar Boleta #{boleta?.id}</h3>
                    <button className="btn-cerrar-modal" onClick={cerrarModal}>X</button>
                </div>

                <div className="modal-body" style={{ marginTop: '10px' }}>

                    {/* DATOS DEL CLIENTE */}
                    <div style={{ backgroundColor: '#e8f4f8', padding: '10px 15px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #bce8f1' }}>
                        <div><strong style={{ color: '#31708f' }}>👤 Cliente:</strong> <span style={{ textTransform: 'capitalize' }}>{cliente || 'Desconocido'}</span></div>
                    </div>

                    {cargandoStock ? (
                        <div style={{ padding: '30px', textAlign: 'center', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '20px' }}>
                            <h4 style={{ color: '#3498db', margin: 0 }}>🔄 Cargando datos...</h4>
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
                                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', textTransform: 'capitalize' }}
                                    >
                                        <option value="">-- Seleccionar --</option>
                                        {stockProductos.map(item => {
                                            const prod = catalogoProductos?.find(p => String(p.id) === String(item.id_producto));
                                            const disp = item.stock - item.stock_vendido;
                                            if (disp > 0)
                                                return (
                                                    <option key={item.id_producto} value={item.id_producto}>
                                                        {prod ? prod.nombre : `Prod #${item.id_producto}`}
                                                    </option>
                                                );
                                        })}
                                    </select>
                                </div>

                                <div style={{ flex: '1 1 80px' }}>
                                    {stockDisponibleActual !== null && (
                                        <div style={{ color: (stockDisponibleActual > 0 && !excedeStock) ? '#27ae60' : '#c0392b', fontSize: '0.75rem', marginTop: '4px', fontWeight: 'bold' }}>
                                            {(stockDisponibleActual > 0 && !excedeStock) ? `disp: ${stockDisponibleActual}` : 'Sin Stock'}
                                        </div>
                                    )}
                                    <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Cantidad:</label>
                                    <input
                                        type="number" min="1" step="0.5" value={cantidad} onChange={(e) => setCantidad(e.target.value)}
                                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: excedeStock ? '2px solid #e74c3c' : '1px solid #ccc', backgroundColor: excedeStock ? '#fadbd8' : 'white', outline: 'none' }}
                                    />
                                </div>

                                <div style={{ flex: '1 1 100px' }}>
                                    <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>$ Precio:</label>
                                    <input
                                        type="number" min="0" step="0.01" placeholder="0.00" value={precioUnitario} onChange={(e) => setPrecioUnitario(e.target.value)}
                                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#fffbe6' }}
                                    />
                                </div>

                                <div style={{ flex: '1 1 100px' }}>
                                    <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>$ Vacío:</label>
                                    <input
                                        type="number" min="0" step="0.01" placeholder="0.00" value={precioVacio} onChange={(e) => setPrecioVacio(e.target.value)}
                                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                                    />
                                </div>

                                <button
                                    className='btn-global btn-primario'
                                    onClick={agregarAlCarrito}
                                    disabled={excedeStock || !idProducto || !stockDisponibleActual}
                                    style={{ padding: '9px 20px', color: 'white', cursor: (excedeStock || !idProducto) ? 'not-allowed' : 'pointer'}}
                                >
                                    + Agregar
                                </button>
                            </div>
                        </>
                    )}

                    {errorVenta && <div style={{ color: '#c0392b', marginBottom: '10px', fontSize: '0.9rem', fontWeight: 'bold' }}>{errorVenta}</div>}

                    {/* TABLA DETALLE DE BOLETAS (AHORA INTERACTIVA) */}
                    <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
                            <thead style={{ backgroundColor: '#f4f6f8', position: 'sticky', top: 0 }}>
                                <tr>
                                    <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>Producto</th>
                                    <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>Cant.</th>
                                    <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>$ Precio</th>
                                    <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>$ Vacío</th>
                                    <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>Subtotal</th>
                                    <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }} />
                                </tr>
                            </thead>
                            <tbody>
                                {carrito.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#888' }}>No hay productos.</td>
                                    </tr>
                                ) : (
                                    carrito.map(fila => (
                                        <tr key={fila.id_fila} style={{ borderBottom: '1px solid #eee' }}>

                                            {/* Nombre del Producto */}
                                            <td style={{ padding: '10px', fontWeight: 'bold', textTransform: 'capitalize' }}>
                                                {fila.nombre}
                                            </td>

                                            {/* Input de Cantidad */}
                                            <td style={{ padding: '10px' }}>
                                                <input
                                                    type="number" min="0.5" step="0.5"
                                                    value={fila.cantidad}
                                                    onChange={(e) => actualizarFilaCarrito(fila.id_fila, 'cantidad', e.target.value)}
                                                    style={{ width: '60px', padding: '4px', borderRadius: '4px', border: '1px solid #ccc', textAlign: 'center', outline: 'none' }}
                                                />
                                            </td>

                                            {/* Input de Precio Unitario */}
                                            <td style={{ padding: '10px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                                    <span>$</span>
                                                    <input
                                                        type="number" min="0" step="0.01"
                                                        value={fila.precio_unitario}
                                                        onChange={(e) => actualizarFilaCarrito(fila.id_fila, 'precio_unitario', e.target.value)}
                                                        style={{ width: '80px', padding: '4px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none' }}
                                                    />
                                                </div>
                                            </td>

                                            {/* Input de Precio de Vacío */}
                                            <td style={{ padding: '10px', color: '#7f8c8d' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                                    <span>$</span>
                                                    <input
                                                        type="number" min="0" step="0.01"
                                                        value={fila.precio_vacio}
                                                        onChange={(e) => actualizarFilaCarrito(fila.id_fila, 'precio_vacio', e.target.value)}
                                                        style={{ width: '70px', padding: '4px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none' }}
                                                    />
                                                </div>
                                            </td>

                                            {/* Subtotal en tiempo real (seguro contra errores) */}
                                            <td style={{ padding: '10px', fontWeight: 'bold', color: '#27ae60' }}>
                                                {Number(fila.subtotal || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                                            </td>

                                            {/* Botón Borrar */}
                                            <td style={{ padding: '10px', textAlign: 'center' }}>
                                                <button 
                                                    className='btn-eliminar-fila'
                                                    onClick={() => eliminarDelCarrito(fila.id_fila)}
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
                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9f9f9', marginTop: 0 }}>

                    <div style={{ display: 'flex', gap: '5px', fontWeight: 'bold' }}>
                        <input
                            id='checkbox_pagado_edit' type="checkbox" checked={pagado === 'PAGADO'}
                            onChange={(e) => setPagado(e.target.checked ? 'PAGADO' : 'NO_PAGADO')}
                        />
                        <label htmlFor='checkbox_pagado_edit' style={{ cursor: 'pointer', paddingRight: '30px' }}>
                            Pagado
                        </label>

                        <input
                            id='checkbox_retirado_edit' type="checkbox" checked={retirado === 'RETIRADO'}
                            onChange={(e) => setRetirado(e.target.checked ? 'RETIRADO' : 'NO_RETIRADO')}
                        />
                        <label htmlFor='checkbox_retirado_edit' style={{ cursor: 'pointer' }}>
                            Retirado
                        </label>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <h2 style={{ margin: 0, color: '#2c3e50' }}>Total: {totalBoleta.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</h2>
                        <div>
                            <button className="btn-global btn-secundario" onClick={cerrarModal} style={{ marginRight: '10px' }}>Cancelar</button>
                            <button className="btn-global btn-primario-green" onClick={guardarCambios} disabled={guardando || cargandoStock}>
                                {guardando ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ModalModificarBoleta;
import { useState, useEffect } from 'react';
import '../Estilos/Modal.css';
import '../Estilos/Botones.css';
import AlertaConfirmacion from '../Alertas/AlertaConfirmacion';
import InputMoneda from './InputMoneda';
import SelectPersonalizado from '../UI/SelectPersonalizado';
import SelectorEstadoEntrega from '../UI/SelectorEstadoEntrega';
import SelectorEstadoPago from '../UI/SelectorEstadoPago';
import InputNumero from '../UI/InputNumero';
import { HiOutlineTicket, HiOutlineUserCircle, HiOutlineArrowPath } from 'react-icons/hi2';

function ModalBoleta({ cerrarModal, cliente, planilla, catalogoProductos, onBoletaGuardada, volverABuscarCliente }) {
    // --- ESTADOS ORIGINALES ---
    const [carrito, setCarrito] = useState([]);
    const [idProducto, setIdProducto] = useState('');
    const [cantidad, setCantidad] = useState(1);
    const [precioUnitario, setPrecioUnitario] = useState('');   
    const [precioVacio, setPrecioVacio] = useState('');
    const [pagado, setPagado] = useState('NO_PAGADO');
    const [formaPago, setFormaPago] = useState('EFECTIVO');
    const [entregado, setEntregado] = useState('NO_ENTREGADO');
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
                    setErrorVenta('No se pudo sincronizar el inventario con el servidor.');
                }
            } catch (error) {
                console.error(error);
                setErrorVenta('Error de conexión al verificar el inventario.');
            } finally {
                setCargandoStock(false);
            }
        };
        obtenerStockActualizado();
    }, [planilla.id]);

    const agregarAlCarrito = () => {
        setErrorVenta(''); 

        if (!idProducto || cantidad < 1) {
            setErrorVenta('Selecciona un producto y una cantidad mayor a 0.');
            return;
        }

        const precioReal = parseFloat(precioUnitario) || 0;
        const vacioReal = parseFloat(precioVacio) || 0;
        const cantidadReal = parseFloat(cantidad);

        if (precioReal <= 0) {
            setErrorVenta('El precio del producto debe ser mayor a 0.');
            return;
        }

        const productoReal = catalogoProductos.find(p => String(p.id) === String(idProducto));
        
        // ¡CAMBIO CLAVE! Ahora validamos contra el stock fresco, no el de las props
        const stockProductoEnPlanilla = stockProductos.find(p => String(p.id_producto) === String(idProducto));
        
        if (!stockProductoEnPlanilla) {
            setErrorVenta('Este producto no fue cargado en la planilla de hoy.');
            return;
        }
        
        const stockEnBD = stockProductoEnPlanilla.stock - stockProductoEnPlanilla.stock_vendido;
        
        const stockYaEnCarrito = carrito
            .filter(item => String(item.id_producto) === String(idProducto))
            .reduce((suma, item) => suma + item.cantidad, 0);

        const stockFinalDisponible = stockEnBD - stockYaEnCarrito;

        if (cantidadReal > stockFinalDisponible) {
            if (stockYaEnCarrito > 0) {
                setErrorVenta(`Inventario insuficiente. Ya tienes ${stockYaEnCarrito} en el carrito y solo quedan ${stockFinalDisponible} disponibles.`);
            } else {
                setErrorVenta(`Inventario insuficiente. Solo quedan ${stockFinalDisponible} unidades.`);
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
            subtotal: subtotalFila,
            cantidad_entregada: 0
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

    const actualizarCantidadEntregada = (id_fila, valor) => {
        setCarrito(prev => prev.map(item => {
            if (item.id_fila !== id_fila) return item;
            if (valor === '') {
                return { ...item, cantidad_entregada: '' };
            }
            const cantidadEntregada = Math.max(0, Math.min(Number(valor) || 0, item.cantidad));
            return { ...item, cantidad_entregada: cantidadEntregada };
        }));
    };

    const confirmarCantidadEntregada = (id_fila) => {
        setCarrito(prev => prev.map(item => {
            if (item.id_fila !== id_fila || item.cantidad_entregada !== '') return item;
            return { ...item, cantidad_entregada: 0 };
        }));
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
            setErrorVenta('No puedes guardar una boleta vacía.');
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
                formaPago: pagado === 'PAGADO' ? formaPago : null,
                estadoEntrega: entregado,
                ventas: carrito.map(item => ({
                    id_producto: item.id_producto,
                    cantidad: item.cantidad,
                    precio_unitario: item.precio_unitario,
                    precio_vacio: item.precio_vacio,
                    subtotal: item.subtotal,
                    cantidad_entregada: item.cantidad_entregada || 0
                }))
            };

            const respuesta = await fetch('http://localhost:8080/api/boleta/new', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(boletaDTO)
            });

            if (!respuesta.ok) {
                setErrorVenta('Error en el servidor al guardar la boleta.');
                setGuardando(false);
                return;
            }

            const boletaGuardada = await respuesta.json();
            onBoletaGuardada(boletaGuardada, carrito); // Pasamos el carrito por si tu VistaPuntoVenta aún lo necesita
            cerrarModal();

        } catch (err) {
            console.error(err);
            setErrorVenta('Error de conexión con el servidor.');
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
                                background: 'none', border: 'none', color: 'var(--accent)',
                                fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '5px'
                            }}
                            title="Volver a seleccionar cliente"
                        >
                            ⬅ Volver
                        </button>
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><HiOutlineTicket /> Nueva Boleta</h3>
                    </div>
                    <div style={{display:'flex', direction:'row', gap:'px', margin:'0px', padding:'0px' }}>
                        <button className="btn-cerrar-modal" onClick={cerrarModal}>X</button>
                    </div>
                    
                </div>

                <div className="modal-body">
                    {/* DATOS DEL CLIENTE */}
                    <div style={{ backgroundColor: 'var(--info-soft)', padding: '10px 15px', borderRadius: 'var(--radius-md)', marginBottom: '15px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><strong style={{ color: 'var(--info-soft-text)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}><HiOutlineUserCircle /> Cliente:</strong> <span style={{ textTransform: 'capitalize' }}>{cliente?.nombre}</span></div>
                        <div><strong style={{ color: 'var(--info-soft-text)' }}>{cliente?.tipoDocumento === 'CUIT_L' ? 'CUIT/L' : 'DNI'}:</strong> {cliente?.documento}</div>
                    </div>

                    {/* BLOQUEO VISUAL MIENTRAS CARGA EL STOCK */}
                    {cargandoStock ? (
                        <div style={{ padding: '30px', textAlign: 'center', backgroundColor: 'var(--surface-2)', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '20px' }}>
                            <h4 style={{ color: 'var(--info)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><HiOutlineArrowPath /> Sincronizando inventario en vivo...</h4>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '5px' }}>Por favor, espera un segundo.</p>
                        </div>
                    ) : (
                        <>
                            {/* SELECTOR Y CARGA MANUAL DE PRECIOS */}
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', marginBottom: '10px', backgroundColor: 'var(--surface-2)', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', flexWrap: 'wrap' }}>
                                
                                <div style={{ flex: '2 1 200px' }}>
                                    <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Producto:</label>
                                    <SelectPersonalizado
                                        value={idProducto}
                                        onChange={(e) => setIdProducto(e.target.value)}
                                        placeholder="-- Seleccionar --"
                                        opciones={stockProductos
                                            .filter(item => (item.stock - item.stock_vendido) > 0)
                                            .map(item => {
                                                const prod = catalogoProductos.find(p => String(p.id) === String(item.id_producto));
                                                return { value: item.id_producto, label: prod ? prod.nombre : `Prod #${item.id_producto}` };
                                            })}
                                        style={{ width: '100%' }}
                                        capitalizarOpciones
                                    />
                                </div>

                                <div style={{ flex: '1 1 80px' }}>
                                    <div style={{
                                        height: '16px',
                                        color: (stockDisponibleActual > 0 && !excedeStock) ? 'var(--success)' : 'var(--danger)',
                                        fontSize: '0.75rem',
                                        fontWeight: 'bold',
                                        visibility: stockDisponibleActual !== null ? 'visible' : 'hidden'
                                    }}>
                                        {(stockDisponibleActual > 0 && !excedeStock) ? `disponible: ${stockDisponibleActual}` : 'Sin Inventario'}
                                    </div>
                                    <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Cantidad:</label>
                                    <InputNumero
                                        min="1" step="0.5"
                                        value={cantidad}
                                        onChange={(e) => setCantidad(e.target.value)}
                                        style={{
                                            width: '100%', padding: '8px', borderRadius: 'var(--radius-sm)',
                                            border: excedeStock ? '2px solid var(--danger)' : '1px solid var(--border)',
                                            backgroundColor: excedeStock ? 'var(--danger-soft)' : 'var(--surface)',
                                            color: 'var(--text-primary)',
                                        }}
                                    />
                                </div>

                                <div style={{ flex: '1 1 100px' }}>
                                    <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>$ Precio:</label>
                                    <InputMoneda
                                        value={precioUnitario}
                                        onChange={(valor) => setPrecioUnitario(valor)}
                                        style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'var(--warning-soft)', color: 'var(--text-primary)' }}
                                    />
                                </div>

                                <div style={{ flex: '1 1 100px' }}>
                                    <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>$ Vacío:</label>
                                    <InputMoneda
                                        value={precioVacio}
                                        onChange={(valor) => setPrecioVacio(valor)}
                                        style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text-primary)' }}
                                    />
                                </div>

                                    <button
                                        className="btn-global btn-primario"
                                        onClick={agregarAlCarrito}
                                        disabled={excedeStock || !idProducto || !stockDisponibleActual} // Apagado si no hay producto o excede
                                        style={{ padding: '9px 20px' }}>
                                    + Agregar
                                    </button>
                            </div>
                        </>
                    )}

                    {errorVenta && <div style={{ color: 'var(--danger)', marginBottom: '10px', fontSize: '0.9rem', fontWeight: 'bold' }}>{errorVenta}</div>}

                    {/* TABLA DETALLE DE BOLETAS */}
                    <div style={{ height: '220px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
                            <thead style={{ backgroundColor: 'var(--surface-inverse)', color: 'var(--text-on-inverse)', position: 'sticky', top: 0, zIndex: 1 }}>
                                <tr>
                                    <th style={{ padding: '10px' }}>Producto</th>
                                    <th style={{ padding: '10px' }}>Cant.</th>
                                    <th style={{ padding: '10px' }}>$ Precio</th>
                                    <th style={{ padding: '10px' }}>$ Vacío</th>
                                    <th style={{ padding: '10px' }}>Subtotal</th>
                                    {entregado === 'PARCIAL' && <th style={{ padding: '10px' }}>Entregado</th>}
                                    <th style={{ padding: '10px' }}/>
                                </tr>
                            </thead>
                            <tbody>
                                {carrito.length === 0 ? (
                                    <tr>
                                        <td colSpan={entregado === 'PARCIAL' ? 7 : 6} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No hay productos en la boleta.</td>
                                    </tr>
                                ) : (
                                    carrito.map(fila => (
                                        <tr key={fila.id_fila} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '10px', fontWeight: 'bold', textTransform: 'capitalize', color: 'var(--text-primary)' }}>{fila.nombre}</td>
                                            <td style={{ padding: '10px', color: 'var(--text-primary)' }}>{fila.cantidad}</td>
                                            <td style={{ padding: '10px', color: 'var(--text-primary)' }}>{fila.precio_unitario.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</td>
                                            <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>
                                                {fila.precio_vacio > 0 ? `${fila.precio_vacio.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}` : '-'}
                                            </td>
                                            <td style={{ padding: '10px', fontWeight: 'bold', color: 'var(--success)' }}>{fila.subtotal.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</td>
                                            {entregado === 'PARCIAL' && (
                                                <td style={{ padding: '10px' }}>
                                                    <InputNumero
                                                        min="0" max={fila.cantidad} step="0.5"
                                                        value={fila.cantidad_entregada}
                                                        onChange={(e) => actualizarCantidadEntregada(fila.id_fila, e.target.value)}
                                                        onBlur={() => confirmarCantidadEntregada(fila.id_fila)}
                                                        style={{ width: '85px', padding: '4px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', textAlign: 'center', backgroundColor: 'var(--surface)', color: 'var(--text-primary)' }}
                                                    />
                                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}> / {fila.cantidad}</span>
                                                </td>
                                            )}
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
                <div
                    className="modal-footer"
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        backgroundColor: 'var(--surface-2)',
                        marginTop: 0
                    }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold' }}>
                            <SelectorEstadoPago value={pagado} onChange={setPagado} />

                            <SelectPersonalizado
                                value={formaPago}
                                onChange={(e) => setFormaPago(e.target.value)}
                                disabled={pagado !== 'PAGADO'}
                                opciones={[
                                    { value: 'EFECTIVO', label: 'Efectivo' },
                                    { value: 'MERCADO_PAGO', label: 'Mercado Pago' },
                                    { value: 'TRANSFERENCIA_BANCARIA', label: 'Transferencia Bancaria' },
                                    { value: 'OTROS', label: 'Otros' },
                                ]}
                                style={{
                                    width: '190px',
                                    visibility: pagado === 'PAGADO' ? 'visible' : 'hidden'
                                }}
                            />
                        </div>

                        <SelectorEstadoEntrega
                            value={entregado}
                            onChange={setEntregado}
                            deshabilitarParcial={carrito.length === 0}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>Total: {totalBoleta.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</h2>
                        <div>
                            <button className="btn-global btn-secundario" onClick={cerrarModal} style={{ marginRight: '10px' }}>Cancelar</button>
                            <button
                                className="btn-global btn-primario-green"
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
                    mensaje={"Vas a perder los productos cargados si cambiás de cliente.\n¿Continuar?"}
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
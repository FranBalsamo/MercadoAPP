import { useState, useEffect } from 'react';
import '@/shared/styles/Modal.css';
import '@/shared/styles/Botones.css';
import InputMoneda from '@/shared/ui/InputMoneda';
import SelectPersonalizado from '@/shared/ui/SelectPersonalizado';
import SelectorEstadoEntrega from '@/shared/ui/SelectorEstadoEntrega';
import SelectorEstadoPago from '@/shared/ui/SelectorEstadoPago';
import InputNumero from '@/shared/ui/InputNumero';
import { useCarritoBoleta } from '../../hooks/useCarritoBoleta';
import { HiOutlinePencilSquare, HiOutlineUserCircle, HiOutlineArrowPath } from 'react-icons/hi2';

function ModalModificarBoleta({ cerrarModal, boleta, cliente, planilla, catalogoProductos, onBoletaEditada }) {
    const {
        carrito, setCarrito,
        idProducto, setIdProducto,
        cantidad, setCantidad,
        precioUnitario, setPrecioUnitario,
        precioVacio, setPrecioVacio,
        errorVenta, setErrorVenta,
        stockProductos,
        cargandoStock,
        agregarAlCarrito,
        eliminarDelCarrito,
        actualizarCantidadEntregada,
        confirmarCantidadEntregada,
        totalBoleta,
        stockDisponibleActual,
        excedeStock,
    } = useCarritoBoleta({
        planillaId: planilla?.id,
        boletaId: boleta?.id,
        catalogoProductos,
        ventasOriginales: boleta?.ventas,
    });

    // Inicializamos con los datos de la boleta
    const [pagado, setPagado] = useState(boleta?.estadoPago || 'NO_PAGADO');
    const [formaPago, setFormaPago] = useState(boleta?.formaPago || 'EFECTIVO');
    const [entregado, setEntregado] = useState(boleta?.estadoEntrega || 'NO_ENTREGADO');

    const [guardando, setGuardando] = useState(false);

    // --- EFECTO: CARGAR EL CARRITO INICIAL DE LA BOLETA ---
    // Depende solo de boleta?.id (no del objeto/array completo) a proposito: si el componente
    // padre re-renderiza mientras este modal esta abierto (ej. un refresco de stock en segundo
    // plano) y le pasa nuevas referencias de 'boleta'/'catalogoProductos' con el mismo
    // contenido, este efecto NO debe volver a correr y pisar las ediciones en curso del carrito.
    useEffect(() => {
        if (boleta && boleta.ventas) {
            const carritoInicial = boleta.ventas.map(venta => {
                const prod = catalogoProductos?.find(p => String(p.id) === String(venta.id_producto));

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
                    subtotal: subTCalculado,
                    cantidad_entregada: Number(venta.cantidad_entregada || 0)
                };
            });
            setCarrito(carritoInicial);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [boleta?.id]);

    // --- FUNCIÓN PARA EDITAR FILAS DIRECTAMENTE EN LA TABLA ---
    const actualizarFilaCarrito = (id_fila_modificar, campo, nuevoValor) => {
        setCarrito(prevCarrito => prevCarrito.map(fila => {
            if (fila.id_fila === id_fila_modificar) {
                // 1. Actualizamos el valor
                const filaActualizada = { ...fila, [campo]: nuevoValor };

                // 2. Recalculamos el subtotal de esta fila
                const cant = Number(filaActualizada.cantidad || 0);
                const precioU = Number(filaActualizada.precio_unitario || 0);
                const precioV = Number(filaActualizada.precio_vacio || 0);
                filaActualizada.subtotal = (cant * precioU) + (cant * precioV);

                // 3. Si se bajo la cantidad por debajo de lo ya marcado como entregado,
                // se reajusta la entrega para no guardar "5 entregado de 3 vendido".
                if (campo === 'cantidad' && Number(filaActualizada.cantidad_entregada || 0) > cant) {
                    filaActualizada.cantidad_entregada = cant;
                }

                return filaActualizada;
            }
            return fila;
        }));
    };

    // --- STOCK DISPONIBLE POR FILA DEL CARRITO (para marcar en rojo y bloquear el guardado) ---
    const stockDisponibleParaFila = (fila) => {
        const stockProductoEnPlanilla = stockProductos.find(p => String(p.id_producto) === String(fila.id_producto));
        if (!stockProductoEnPlanilla) return null;

        const stockEnBD = stockProductoEnPlanilla.stock - stockProductoEnPlanilla.stock_vendido;

        const cantidadEnOtrasFilas = carrito
            .filter(item => item.id_fila !== fila.id_fila && String(item.id_producto) === String(fila.id_producto))
            .reduce((suma, item) => suma + Number(item.cantidad || 0), 0);

        return stockEnBD - cantidadEnOtrasFilas;
    };

    const filaExcedeStock = (fila) => {
        const disponible = stockDisponibleParaFila(fila);
        return disponible !== null && Number(fila.cantidad || 0) > disponible;
    };

    const mensajesStockExcedido = carrito
        .filter(filaExcedeStock)
        .map(fila => {
            const disponible = stockDisponibleParaFila(fila);
            return `Inventario insuficiente para "${fila.nombre}". Disponible: ${disponible > 0 ? disponible : 0} unidades.`;
        });

    const hayFilaConStockExcedido = mensajesStockExcedido.length > 0;

    const guardarCambios = async (e) => {
        e.preventDefault();

        if (carrito.length === 0) {
            setErrorVenta('No puedes guardar una boleta sin artículos.');
            return;
        }

        if (hayFilaConStockExcedido) {
            setErrorVenta('Hay productos con una cantidad mayor al inventario disponible. Corregilos antes de guardar.');
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
                formaPago: pagado === 'PAGADO' ? formaPago : null,
                estadoEntrega: entregado,
                ventas: carrito.map(item => ({
                    id_producto: item.id_producto,
                    cantidad: Number(item.cantidad),
                    precio_unitario: Number(item.precio_unitario),
                    precio_vacio: Number(item.precio_vacio),
                    subtotal: Number(item.subtotal),
                    cantidad_entregada: Number(item.cantidad_entregada || 0)
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
            setErrorVenta('Ocurrió un error al intentar actualizar la boleta.');
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-contenido" style={{ width: '95%', maxWidth: '800px' }}>

                <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><HiOutlinePencilSquare /> Editar Boleta #{boleta?.id}</h3>
                    <button className="btn-cerrar-modal" onClick={cerrarModal}>X</button>
                </div>

                <div className="modal-body" style={{ marginTop: '10px' }}>

                    {/* DATOS DEL CLIENTE */}
                    <div style={{ backgroundColor: 'var(--info-soft)', padding: '10px 15px', borderRadius: 'var(--radius-md)', marginBottom: '15px', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><strong style={{ color: 'var(--info-soft-text)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}><HiOutlineUserCircle /> Cliente:</strong> <span style={{ textTransform: 'capitalize' }}>{cliente || 'Desconocido'}</span></div>
                    </div>

                    {cargandoStock ? (
                        <div style={{ padding: '30px', textAlign: 'center', backgroundColor: 'var(--surface-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: '20px' }}>
                            <h4 style={{ color: 'var(--info)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><HiOutlineArrowPath /> Cargando datos...</h4>
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
                                                const prod = catalogoProductos?.find(p => String(p.id) === String(item.id_producto));
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
                                        {(stockDisponibleActual > 0 && !excedeStock) ? `disp: ${stockDisponibleActual}` : 'Sin Inventario'}
                                    </div>
                                    <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Cantidad:</label>
                                    <InputNumero
                                        min="0.5" step="0.5" value={cantidad} onChange={(e) => setCantidad(e.target.value)}
                                        style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-sm)', border: excedeStock ? '2px solid var(--danger)' : '1px solid var(--border)', backgroundColor: excedeStock ? 'var(--danger-soft)' : 'var(--surface)', color: 'var(--text-primary)' }}
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
                                    className='btn-global btn-primario'
                                    onClick={agregarAlCarrito}
                                    disabled={excedeStock || !idProducto || !stockDisponibleActual}
                                    style={{ padding: '9px 20px', cursor: (excedeStock || !idProducto) ? 'not-allowed' : 'pointer'}}
                                >
                                    + Agregar
                                </button>
                            </div>
                        </>
                    )}

                    {errorVenta && <div style={{ color: 'var(--danger)', marginBottom: '10px', fontSize: '0.9rem', fontWeight: 'bold' }}>{errorVenta}</div>}

                    {mensajesStockExcedido.map((mensaje, i) => (
                        <div key={i} style={{ color: 'var(--danger)', marginBottom: '5px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                            {mensaje}
                        </div>
                    ))}

                    {/* TABLA DETALLE DE BOLETAS (AHORA INTERACTIVA) */}
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
                                    <th style={{ padding: '10px' }} />
                                </tr>
                            </thead>
                            <tbody>
                                {carrito.length === 0 ? (
                                    <tr>
                                        <td colSpan={entregado === 'PARCIAL' ? 7 : 6} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No hay productos.</td>
                                    </tr>
                                ) : (
                                    carrito.map(fila => {
                                        const excedeStockFila = filaExcedeStock(fila);
                                        return (
                                        <tr key={fila.id_fila} style={{ borderBottom: '1px solid var(--border)' }}>

                                            {/* Nombre del Producto */}
                                            <td style={{ padding: '10px', fontWeight: 'bold', textTransform: 'capitalize', color: 'var(--text-primary)' }}>
                                                {fila.nombre}
                                            </td>

                                            {/* Input de Cantidad */}
                                            <td style={{ padding: '10px' }}>
                                                <InputNumero
                                                    min="0.5" step="0.5"
                                                    value={fila.cantidad}
                                                    onChange={(e) => actualizarFilaCarrito(fila.id_fila, 'cantidad', e.target.value)}
                                                    style={{
                                                        width: '75px', padding: '4px', borderRadius: 'var(--radius-sm)', textAlign: 'center',
                                                        border: excedeStockFila ? '2px solid var(--danger)' : '1px solid var(--border)',
                                                        backgroundColor: excedeStockFila ? 'var(--danger-soft)' : 'var(--surface)',
                                                        color: 'var(--text-primary)'
                                                    }}
                                                />
                                            </td>

                                            {/* Input de Precio Unitario */}
                                            <td style={{ padding: '10px' }}>
                                                <InputMoneda
                                                    value={fila.precio_unitario}
                                                    onChange={(valor) => actualizarFilaCarrito(fila.id_fila, 'precio_unitario', valor)}
                                                    style={{ width: '90px', padding: '4px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', outline: 'none', backgroundColor: 'var(--surface)', color: 'var(--text-primary)' }}
                                                />
                                            </td>

                                            {/* Input de Precio de Vacío */}
                                            <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>
                                                <InputMoneda
                                                    value={fila.precio_vacio}
                                                    onChange={(valor) => actualizarFilaCarrito(fila.id_fila, 'precio_vacio', valor)}
                                                    style={{ width: '85px', padding: '4px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', outline: 'none', backgroundColor: 'var(--surface)', color: 'var(--text-primary)' }}
                                                />
                                            </td>

                                            {/* Subtotal en tiempo real (seguro contra errores) */}
                                            <td style={{ padding: '10px', fontWeight: 'bold', color: 'var(--success)' }}>
                                                {Number(fila.subtotal || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                                            </td>

                                            {/* Cantidad Entregada (solo en modo Entrega Parcial) */}
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
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* FOOTER */}
                <div className="modal-footer" style={{ display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: 'var(--surface-2)', marginTop: 0 }}>

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
                            <button className="btn-global btn-primario-green" onClick={guardarCambios} disabled={guardando || cargandoStock || hayFilaConStockExcedido}>
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
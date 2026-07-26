import { useState, useEffect } from 'react';

// Logica de carrito compartida entre ModalBoleta (nueva boleta) y ModalModificarBoleta
// (edicion de una boleta existente). Antes estaba duplicada casi igual en los dos modales,
// lo que provoco una regresion real: el fix del calculo de "vacio" con cantidades
// fraccionarias se aplico en un solo lado y no en el otro.
export function useCarritoBoleta({ planillaId, boletaId, catalogoProductos, ventasOriginales }) {
    const [carrito, setCarrito] = useState([]);
    const [idProducto, setIdProducto] = useState('');
    const [cantidad, setCantidad] = useState(1);
    const [precioUnitario, setPrecioUnitario] = useState('');
    const [precioVacio, setPrecioVacio] = useState('');
    const [errorVenta, setErrorVenta] = useState('');
    const [stockProductos, setStockProductos] = useState([]);
    const [cargandoStock, setCargandoStock] = useState(true);

    // Depende solo de planillaId/boletaId (no de ventasOriginales, que cambia de referencia en
    // cada render del padre) para no relanzar la sincronizacion de stock en cada re-render ajeno.
    useEffect(() => {
        if (!planillaId) return;
        let cancelado = false;

        const obtenerStockActualizado = async () => {
            setCargandoStock(true);
            try {
                const respuesta = await fetch(`http://localhost:8080/api/planilla/stocks/${planillaId}`);
                if (respuesta.ok) {
                    const listaStock = await respuesta.json();
                    const stockProductosFormateados = Array.isArray(listaStock)
                        ? listaStock.map(item => {
                            // Si se esta editando una boleta existente, esta cantidad ya estaba
                            // reservada por ella: se "reintegra" temporalmente a la disponibilidad.
                            const cantidadEnEstaBoleta = ventasOriginales
                                ? ventasOriginales
                                    .filter(v => String(v.id_producto) === String(item.id_producto))
                                    .reduce((suma, v) => suma + Number(v.cantidad || 0), 0)
                                : 0;
                            return {
                                id: item.id,
                                id_producto: item.id_producto,
                                id_planilla: item.id_planilla,
                                stock: item.stock,
                                stock_vendido: item.stock_vendido - cantidadEnEstaBoleta
                            };
                        })
                        : [];
                    if (!cancelado) setStockProductos(stockProductosFormateados);
                } else if (!cancelado) {
                    setErrorVenta('No se pudo sincronizar el inventario con el servidor.');
                }
            } catch (error) {
                console.error(error);
                if (!cancelado) setErrorVenta('Error de conexión al verificar el inventario.');
            } finally {
                if (!cancelado) setCargandoStock(false);
            }
        };

        obtenerStockActualizado();
        return () => { cancelado = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [planillaId, boletaId]);

    const agregarAlCarrito = () => {
        setErrorVenta('');

        if (!idProducto || cantidad < 0.5) {
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

        const subtotalFila = (cantidadReal * precioReal) + (cantidadReal * vacioReal);

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

        setCarrito(prev => [...prev, nuevaFila]);
        setIdProducto('');
        setCantidad(1);
        setPrecioUnitario('');
        setPrecioVacio('');
    };

    const eliminarDelCarrito = (id_fila_borrar) => {
        setCarrito(prev => prev.filter(item => item.id_fila !== id_fila_borrar));
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

    let stockDisponibleActual = null;
    if (idProducto && !cargandoStock) {
        const prodPlanilla = stockProductos.find(p => String(p.id_producto) === String(idProducto));
        if (prodPlanilla) {
            const stockEnBD = prodPlanilla.stock - prodPlanilla.stock_vendido;
            const cantidadYaEnCarrito = carrito
                .filter(item => String(item.id_producto) === String(idProducto))
                .reduce((suma, item) => suma + item.cantidad, 0);
            stockDisponibleActual = stockEnBD - cantidadYaEnCarrito;
        }
    }

    const cantidadRealInput = parseFloat(cantidad) || 0;
    const excedeStock = stockDisponibleActual !== null && cantidadRealInput > stockDisponibleActual;

    return {
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
    };
}

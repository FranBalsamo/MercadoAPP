import { useState, useEffect } from 'react';
import ControlStock from './ControlStock';
import ListaBoletas from '@/components/Vistas/ListaBoletas';
import ModalBoleta from '@/components/Modals/ModalBoleta';
import ModalBuscarCliente from '@/features/clientes/ModalBuscarCliente';
import ModalModificarStock from '@/features/productos/ModalModificarStock';
import ModalModificarBoleta from '@/components/Modals/ModalModificarBoleta';
import AlertaConfirmacion from '@/shared/ui/AlertaConfirmacion';
import AlertaEmergente from '@/shared/ui/AlertaEmergente';
import ModalAgregarProducto from '@/features/productos/ModalAgregarProducto';
import { formatearFechaVisual } from '@/shared/utils/formatoFecha';
import { HiOutlineTicket } from 'react-icons/hi2';
import '@/shared/styles/Botones.css';


function VistaPuntoVenta({ cerrarPlanilla, planilla }) {
    const [catalogoProductos, setCatalogoProductos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [mostrarModalBuscarCliente, setMostrarModalBuscarCliente] = useState(false);
    const [mostrarModalBoleta, setMostrarModalBoleta] = useState(false);
    const [mostrarModalModificarStock, setMostrarModalModificarStock] = useState(false);
    const [clienteParaBoleta, setClienteParaBoleta] = useState(null);
    const [boletasDia, setBoletasDia] = useState([]);
    const [clientesDia, setClientesDia] = useState([]);
    const [stockProductos, setStockProductos] = useState(planilla.stockProductos);
    const [mostrarModalModificarBoleta, setMostrarModalModificarBoleta] = useState(false);
    const [boletaSeleccionada, setBoletaSeleccionada] = useState(null);
    const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
    const [mostrarAlertaEliminar, setMostrarAlertaEliminar] = useState(false);
    const [boletaAEliminar, setBoletaAEliminar] = useState(null);
    const [avisoEliminar, setAvisoEliminar] = useState(null);
    const [mostrarModalAgregarProducto, setMostrarModalAgregarProducto] = useState(false);
    const [mostrarAlertaCerrarCaja, setMostrarAlertaCerrarCaja] = useState(false);
    // Antes, si fallaba alguna de las 4 sincronizaciones, solo quedaba un console.error y el
    // cajero se quedaba con catalogo/clientes/boletas/stock vacios sin ninguna explicacion en
    // pantalla (bloqueando la venta sin diagnostico). Ahora se juntan los errores para mostrarlos.
    const [erroresSincronizacion, setErroresSincronizacion] = useState([]);

    const agregarErrorSincronizacion = (mensaje) => {
        setErroresSincronizacion(prev => prev.includes(mensaje) ? prev : [...prev, mensaje]);
    };

    const cargaInicial = async () => {
        setCargando(true);
        setErroresSincronizacion([]);
        await Promise.all([
            sincronizarCatalogo(),
            sincronizarClientes(),
            sincronizarBoletasPlanilla(),
            sincronizarStock()
        ]);
        setCargando(false);
    };

    useEffect(() => {
        /*
        Las 4 llamadas (sincronizarCatalogo, sincronizarClientes, sincronizarBoletasPlanilla, sincronizarStock)
        son independientes entre sí — ninguna necesita el resultado de otra — así que Promise.all
        las dispara todas a la vez en vez de esperar una tras otra, y cargando pasa a false recién cuando terminan todas.
        Resultado: la pantalla tarda lo que tarda la más lenta de las cuatro, no la suma de las cuatro.
        */
        cargaInicial();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const sincronizarCatalogo = async () => {
        try {
            const respuesta = await fetch(`http://localhost:8080/api/productos/All`);
            if (respuesta.ok) {
                const datos = await respuesta.json();
                console.log('🔄 Catálogo sincronizado: ', datos);
                setCatalogoProductos(datos);
            } else {
                agregarErrorSincronizacion('No se pudo cargar el catálogo de productos.');
            }
        } catch (err) {
            console.error("Error al cargar/sincronizar el catálogo:", err);
            agregarErrorSincronizacion('No se pudo cargar el catálogo de productos (sin conexión con el servidor).');
        }
    };

    const sincronizarClientes = async () => {
        try {
            const respuesta = await fetch(`http://localhost:8080/api/clientes/All`);
            if (respuesta.ok) {
                const datos = await respuesta.json();
                setClientesDia(datos);
                console.log('🔄 Clientes sincronizados: ', datos);
            } else {
                agregarErrorSincronizacion('No se pudo cargar la lista de clientes.');
            }
        } catch (err) {
            console.error("Error al cargar/sincronizar los clientes:", err);
            agregarErrorSincronizacion('No se pudo cargar la lista de clientes (sin conexión con el servidor).');
        }
    };

    const sincronizarBoletasPlanilla = async () => {
        if(!planilla || !planilla.id) return;
        try{
            const respuestaBoletas = await fetch(`http://localhost:8080/api/boleta/planilla/${planilla.id}`);
            if (respuestaBoletas.ok) {
                const boletasCargadas = await respuestaBoletas.json();
                setBoletasDia(boletasCargadas);
                console.log("🔄 Boletas sincronizadas con éxito desde el servidor.", boletasCargadas);
            } else {
                agregarErrorSincronizacion('No se pudieron cargar las boletas de la planilla.');
            }
        }catch(err){
            console.error("Error al cargar las boletas de la planilla:", err);
            agregarErrorSincronizacion('No se pudieron cargar las boletas de la planilla (sin conexión con el servidor).');
        }
    }

    if (!planilla) return <p>Cargando datos de la caja...</p>;

    const capitalizar = (texto) => texto ? texto.replace(/\b\w/g, (letra) => letra.toUpperCase()) : '';

    const nombreClienteDe = (id_cliente) => {
        const cliente = clientesDia.find(c => String(c.id) === String(id_cliente));
        return cliente ? capitalizar(cliente.nombre) : 'este cliente';
    };

    const sincronizarStock = async () => {
        if (!planilla || !planilla.id) return;

        try {
            const respuestaStock = await fetch(`http://localhost:8080/api/planilla/stocks/${planilla.id}`);
            if (respuestaStock.ok) {
                const stockFresco = await respuestaStock.json();
                setStockProductos(stockFresco);
                console.log("🔄 Stock sincronizado con éxito desde el servidor.");
            } else {
                agregarErrorSincronizacion('No se pudo cargar el inventario de la planilla.');
            }
        } catch (error) {
            console.error("❌ No se pudo refrescar el stock en la vista principal:", error);
            agregarErrorSincronizacion('No se pudo cargar el inventario de la planilla (sin conexión con el servidor).');
        }
    };

    const procesarClienteEncontrado = (clienteEncontrado) => {
        setClienteParaBoleta(clienteEncontrado); 
        setMostrarModalBuscarCliente(false);           
        setMostrarModalBoleta(true);             
    };

    const handleAbrirEdicion = (boleta, cliente) => {
        setBoletaSeleccionada(boleta);
        setClienteSeleccionado(cliente);
        setMostrarModalModificarBoleta(true);
    };

    const handleAbrirEliminar = (boleta) => {
        setBoletaAEliminar(boleta);
        setMostrarAlertaEliminar(true);
    };

    const confirmarEliminacionBoleta = async () => {
        if (!boletaAEliminar) return;

        try {
            const respuesta = await fetch(`http://localhost:8080/api/boleta/remove/${boletaAEliminar.id}`, {
                method: 'DELETE'
            });

            if (respuesta.ok) {
                // 1. La borramos visualmente de la tabla local
                setBoletasDia(prevBoletas => prevBoletas.filter(b => b.id !== boletaAEliminar.id));

                // 2. Sincronizamos el stock (los productos vuelven al inventario)
                await sincronizarStock();

                // 3. Cerramos la alerta
                setMostrarAlertaEliminar(false);
                setBoletaAEliminar(null);
                console.log("Boleta eliminada correctamente");
            } else {
                const mensajeError = await respuesta.text();
                console.error("Error del servidor al eliminar la boleta:", mensajeError);
                setMostrarAlertaEliminar(false);
                setAvisoEliminar(mensajeError || "Hubo un error al intentar eliminar la boleta en el servidor.");
            }
        } catch (error) {
            console.error("Error de conexión:", error);
            setMostrarAlertaEliminar(false);
            setAvisoEliminar("Error de conexión al servidor.");
        }
    };

    const confirmarCierrePlanilla = async () => {
        // Si no se cargó ninguna boleta, no tiene sentido dejar una planilla cerrada vacía: la eliminamos.
        if (boletasDia.length === 0) {
            try {
                const respuesta = await fetch(`http://localhost:8080/api/planilla/delete/${planilla.id}`, {
                    method: 'DELETE'
                });

                if (respuesta.ok) {
                    console.log("🗑️ Planilla eliminada por no tener boletas cargadas.");
                    setMostrarAlertaCerrarCaja(false);
                    cerrarPlanilla();
                } else {
                    const mensajeError = await respuesta.text();
                    console.error("Error al eliminar la planilla vacía:", mensajeError);
                    alert(mensajeError || "Hubo un error en el servidor al intentar eliminar la planilla.");
                }
            } catch (error) {
                console.error("Error de conexión:", error);
                alert("Error de conexión al servidor.");
            }
            return;
        }

        try {
            const respuesta = await fetch(`http://localhost:8080/api/planilla/close/${planilla.id}`, {
                method: 'PUT'
            });

            if (respuesta.ok) {
                const planillaCerrada = await respuesta.json();
                console.log("✅ Planilla cerrada con éxito:", planillaCerrada);

                setMostrarAlertaCerrarCaja(false);
                cerrarPlanilla(planillaCerrada);
            } else {
                console.error("Error al cerrar la planilla");
                alert("Hubo un error en el servidor al intentar cerrar la planilla.");
            }
        } catch (error) {
            console.error("Error de conexión:", error);
            alert("Error de conexión al servidor.");
        }
    };

    return (
        <main style={{
            padding: '20px',
            backgroundColor: 'var(--bg)',
            height: '100%',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
        }}>

            {/* HEADER DE LA VISTA */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '20px', flexShrink: 0 }}>
                <h2 style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}><HiOutlineTicket />Estado Planilla: <span style={{color: planilla.estadoPlanilla === 'ABIERTA' ? 'var(--success)': 'var(--danger)' }}> {planilla.estadoPlanilla} </span> - Fecha: {formatearFechaVisual(planilla.fecha)}</h2>
                <button
                    onClick={() => setMostrarAlertaCerrarCaja(true)}
                    className="btn-global btn-peligro"
                >
                    Cerrar Caja
                </button>
            </div>

            {erroresSincronizacion.length > 0 && (
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap',
                    backgroundColor: 'var(--danger-soft)', color: 'var(--danger-soft-text)',
                    border: '1px solid var(--danger)', borderRadius: 'var(--radius-md)',
                    padding: '10px 15px', marginBottom: '15px', flexShrink: 0
                }}>
                    <span style={{ fontWeight: 'bold' }}>
                        ⚠️ {erroresSincronizacion.join(' ')}
                    </span>
                    <button className="btn-global btn-secundario" onClick={cargaInicial}>
                        Reintentar
                    </button>
                </div>
            )}

            {/* CONTENEDOR DE COLUMNAS */}
            <div style={{ display: 'flex', gap: '10px', flexGrow: 1, minHeight: 0 }}>
                <ControlStock
                    stockProductos={stockProductos}
                    catalogoProductos={catalogoProductos}
                    cargando={cargando}
                    abrirModificarStock={() => setMostrarModalModificarStock(true)}
                    abrirAgregarProducto={async () => {
                        await sincronizarCatalogo();
                        setMostrarModalAgregarProducto(true);
                    }}
                />

                <ListaBoletas
                    abrirModalBoleta={() => setMostrarModalBuscarCliente(true)}
                    abrirModalModificarBoleta={handleAbrirEdicion}
                    eliminarBoleta={handleAbrirEliminar}
                    boletas={boletasDia}
                    clientes={clientesDia}
                    catalogoProductos={catalogoProductos}
                />
            </div>


            {mostrarModalBuscarCliente && (
                <ModalBuscarCliente 
                    cerrarModal={() => setMostrarModalBuscarCliente(false)}
                    onClienteEncontrado={procesarClienteEncontrado} 
                />
            )}

            {mostrarModalBoleta && (
                <ModalBoleta 
                    cerrarModal={() => {
                        setMostrarModalBoleta(false);
                        setClienteParaBoleta(null);
                    }}
                    cliente={clienteParaBoleta} 
                    planilla={planilla} 
                    catalogoProductos={catalogoProductos}
                    onBoletaGuardada={async (nuevaBoleta) => {
                        console.log('Boleta finalizada: ', nuevaBoleta);
                        setBoletasDia([...boletasDia, nuevaBoleta]);
                        setClientesDia([...clientesDia, clienteParaBoleta]);
                        await sincronizarStock();
                        setMostrarModalBoleta(false);
                        setClienteParaBoleta(null);
                    }}
                    volverABuscarCliente={() => {
                        setMostrarModalBoleta(false);
                        setClienteParaBoleta(null);
                        setMostrarModalBuscarCliente(true);
                    }}
                />
            )}

            {mostrarModalModificarBoleta && (
                <ModalModificarBoleta
                    boleta={boletaSeleccionada}
                    cliente={clienteSeleccionado}
                    planilla={planilla}
                    catalogoProductos={catalogoProductos}
                    cerrarModal={() => setMostrarModalModificarBoleta(false)}
                    onBoletaEditada={async (boletaActualizada) => {
                        if (boletaActualizada) {
                            setBoletasDia(prevBoletas =>
                                prevBoletas.map(b => b.id === boletaActualizada.id ? boletaActualizada : b)
                            );
                            await sincronizarStock();
                        }
                    }}
                />
            )}

            {mostrarModalModificarStock && (
                <ModalModificarStock
                    cerrarModal={() => {
                        setMostrarModalModificarStock(false);
                    }}
                    catalogoProductos={catalogoProductos}
                    planilla={planilla}
                    onStockActualizado={async () => {
                        await sincronizarStock();
                    }}
                />
            )}

            {mostrarModalAgregarProducto && (
                <ModalAgregarProducto
                    cerrarModal={() => setMostrarModalAgregarProducto(false)}
                    planilla={planilla}
                    catalogoProductos={catalogoProductos}
                    stockProductos={stockProductos}
                    onStockAgregado={async () => {
                        await sincronizarStock();
                    }}
                />
            )}

            {mostrarAlertaEliminar && (
                <AlertaConfirmacion
                    mensaje={`¿Eliminar la boleta de ${nombreClienteDe(boletaAEliminar?.id_cliente)}?\nLos artículos volverán al inventario. No se puede deshacer.`}
                    onConfirmar={confirmarEliminacionBoleta}
                    onCancelar={() => {
                        setMostrarAlertaEliminar(false);
                        setBoletaAEliminar(null);
                    }}
                />
            )}

            <AlertaEmergente
                mensaje={avisoEliminar}
                onClose={() => {
                    setAvisoEliminar(null);
                    setBoletaAEliminar(null);
                }}
            />

            {mostrarAlertaCerrarCaja && (
                <AlertaConfirmacion
                    mensaje={
                        boletasDia.length === 0
                            ? "Esta planilla no tiene boletas.\nSe eliminará en vez de cerrarse. ¿Continuar?"
                            : "¿Cerrar la planilla?\nSe calcularán los totales y no vas a poder modificar boletas después."
                    }
                    onConfirmar={confirmarCierrePlanilla}
                    onCancelar={() => setMostrarAlertaCerrarCaja(false)}
                />
            )}
            
        </main>
    );
}

export default VistaPuntoVenta;
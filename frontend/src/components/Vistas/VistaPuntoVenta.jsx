import { useState, useEffect } from 'react';
import ControlStock from './ControlStock';
import ListaBoletas from './ListaBoletas';
import ModalBoleta from '../Modals/ModalBoleta';
import ModalBuscarCliente from '../Modals/ModalBuscarCliente';
import ModalModificarStock from '../Modals/ModalModificarStock';
import ModalModificarBoleta from '../Modals/ModalModificarBoleta';
import AlertaConfirmacion from '../Alertas/AlertaConfirmacion';
import AlertaEmergente from '../Alertas/AlertaEmergente';
import ModalAgregarProducto from '../Modals/ModalAgregarProducto';
import '../Estilos/Botones.css';


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

    useEffect(() => {
        const cargaInicial = async () => {
            await Promise.all([
                sincronizarCatalogo(),
                sincronizarClientes(),
                sincronizarBoletasPlanilla(),
                sincronizarStock()
            ]);
            setCargando(false);
        };
        /*
        Las 4 llamadas (sincronizarCatalogo, sincronizarClientes, sincronizarBoletasPlanilla, sincronizarStock) 
        son independientes entre sí — ninguna necesita el resultado de otra — así que Promise.all 
        las dispara todas a la vez en vez de esperar una tras otra, y cargando pasa a false recién cuando terminan todas. 
        Resultado: la pantalla tarda lo que tarda la más lenta de las cuatro, no la suma de las cuatro.
        */
        cargaInicial();
    }, []);

    const sincronizarCatalogo = async () => {
        try {
            const respuesta = await fetch(`http://localhost:8080/api/productos/All`);
            if (respuesta.ok) {
                const datos = await respuesta.json();
                console.log('🔄 Catálogo sincronizado: ', datos);
                setCatalogoProductos(datos);
            }
        } catch (err) {
            console.error("Error al cargar/sincronizar el catálogo:", err);
        }
    };

    const sincronizarClientes = async () => {
        try {
            const respuesta = await fetch(`http://localhost:8080/api/clientes/All`);
            if (respuesta.ok) {
                const datos = await respuesta.json();
                setClientesDia(datos);
                console.log('🔄 Clientes sincronizados: ', datos);
            }
        } catch (err) {
            console.error("Error al cargar/sincronizar los clientes:", err);
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
            }
        }catch(err){
            console.error("Error al cargar las boletas de la planilla:", err);
        }
    }

    if (!planilla) return <p>Cargando datos de la caja...</p>;

    const sincronizarStock = async () => {
        if (!planilla || !planilla.id) return;

        try {
            const respuestaStock = await fetch(`http://localhost:8080/api/planilla/stocks/${planilla.id}`);
            if (respuestaStock.ok) {
                const stockFresco = await respuestaStock.json();
                setStockProductos(stockFresco);
                console.log("🔄 Stock sincronizado con éxito desde el servidor.");
            }
        } catch (error) {
            console.error("❌ No se pudo refrescar el stock en la vista principal:", error);
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
            backgroundColor: '#f4f6f8',
            height: 'calc(100vh - 70px)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
        }}>

            {/* HEADER DE LA VISTA */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>🧾Estado Planilla: <span style={{color: planilla.estadoPlanilla === 'ABIERTA' ? '#3b3c': '#e43' }}> {planilla.estadoPlanilla} </span> - Fecha: {planilla.fecha}</h2>
                <button
                    onClick={() => setMostrarAlertaCerrarCaja(true)}
                    className="btn-global btn-peligro"
                >
                    Cerrar Caja
                </button>
            </div>

            {/* CONTENEDOR DE COLUMNAS */}
            <div style={{ display: 'flex', gap: '10px', flexGrow: 1, overflow: 'hidden' }}>
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
                    mensaje={
                        "⚠️ Estás a punto de eliminar permanentemente la Boleta #" + boletaAEliminar?.id + ".\n" +
                        "Esta acción devolverá los artículos al inventario y no se puede deshacer.\n" +
                        "¿Estás completamente seguro?"
                    }
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
                            ? "⚠️ Esta planilla no tiene boletas cargadas.\n" +
                            "Al confirmar, se ELIMINARÁ en lugar de cerrarse.\n" +
                            "¿Estás completamente seguro?"
                            : "⚠️ Estás a punto de CERRAR definitivamente esta Planilla.\n" +
                            "Al cerrarla, se calcularán los ingresos y deudas totales, y NO se podrán agregar ni eliminar más boletas.\n" +
                            "¿Estás completamente seguro de realizar el cierre?"
                    }
                    onConfirmar={confirmarCierrePlanilla}
                    onCancelar={() => setMostrarAlertaCerrarCaja(false)}
                />
            )}
            
        </main>
    );
}

export default VistaPuntoVenta;
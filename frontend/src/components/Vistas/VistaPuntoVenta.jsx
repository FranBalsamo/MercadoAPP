import { useState, useEffect } from 'react';
import ControlStock from './ControlStock';
import ListaBoletas from './ListaBoletas';
import ModalBoleta from '../Modals/ModalBoleta';
import ModalBuscarCliente from '../Modals/ModalBuscarCliente';
import ModalModificarStock from '../Modals/ModalModificarStock';
import ModalModificarBoleta from '../Modals/ModalModificarBoleta';
import AlertaConfirmacion from '../Alertas/AlertaConfirmacion';


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
    

    useEffect(() => {
        const traerCatalogo = async () => {
            try {
                const respuesta = await fetch(`http://localhost:8080/api/productos/All`);
                if (respuesta.ok) {
                    const datos = await respuesta.json();
                    console.log('Productos encontrados: ',datos);
                    setCatalogoProductos(datos);
                }
            } catch (err) {
                console.error("Error al cargar el catálogo:", err);
            } finally {
                setCargando(false);
            }
        };

        traerCatalogo();
    }, []);

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
                console.error("Error del servidor al eliminar la boleta");
                alert("Hubo un error al intentar eliminar la boleta en el servidor.");
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
                    onClick={cerrarPlanilla}
                    style={{ padding: '8px 15px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
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
                            // 1. Actualizamos la tabla visual
                            setBoletasDia(prevBoletas =>
                                prevBoletas.map(b => b.id === boletaActualizada.id ? boletaActualizada : b)
                            );
                            // 2. Llamamos a nuestra nueva herramienta
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
                />
            )}

            {mostrarAlertaEliminar && (
                <AlertaConfirmacion 
                    mensaje={
                        "⚠️ Estás a punto de eliminar permanentemente la Boleta #" + boletaAEliminar?.id + ".\n" +
                        "Esta acción devolverá los artículos al stock y no se puede deshacer.\n" +
                        "¿Estás completamente seguro?"
                    }
                    onConfirmar={confirmarEliminacionBoleta}
                    onCancelar={() => {
                        setMostrarAlertaEliminar(false);
                        setBoletaAEliminar(null);
                    }}
                />
            )}
            
        </main>
    );
}

export default VistaPuntoVenta;
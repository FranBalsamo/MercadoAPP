import { useState, useEffect } from 'react';
import ControlStock from './ControlStock';
import ListaBoletas from './ListaBoletas';
import ModalBoleta from '../Modals/ModalBoleta';
import ModalBuscarCliente from '../Modals/ModalBuscarCliente';

function VistaPuntoVenta({ cerrarPlanilla, planilla }) {
    const [catalogoProductos, setCatalogoProductos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [mostrarModalBuscarCliente, setMostrarModalBuscarCliente] = useState(false);
    const [mostrarModalBoleta, setMostrarModalBoleta] = useState(false);
    const [clienteParaBoleta, setClienteParaBoleta] = useState(null);
    const [boletasDia, setBoletasDia] = useState([])
    const [stockProductos, setStockProductos] = useState(planilla.stockProductos);



    useEffect(() => {
        const traerCatalogo = async () => {
            try {
                const respuesta = await fetch('http://localhost:8080/api/productos/All');
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

    const procesarClienteEncontrado = (clienteEncontrado) => {
        setClienteParaBoleta(clienteEncontrado); 
        setMostrarModalBuscarCliente(false);           
        setMostrarModalBoleta(true);             
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
                <h2>🛒 Caja Abierta - Planilla #{planilla.id}</h2>
                <button
                    onClick={cerrarPlanilla}
                    style={{ padding: '8px 15px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                    Cerrar Caja
                </button>
            </div>

            {/* CONTENEDOR DE COLUMNAS */}
            <div style={{ display: 'flex', gap: '20px', flexGrow: 1, overflow: 'hidden' }}>
                <ControlStock
                    stockProductos={stockProductos}
                    catalogoProductos={catalogoProductos}
                    cargando={cargando}
                />

                <ListaBoletas 
                    abrirModalBoleta={() => setMostrarModalBuscarCliente(true)} 
                    boletas={boletasDia} 
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
                        setClienteParaBoleta(null); // Limpiamos al cerrar
                    }}
                    cliente={clienteParaBoleta} 
                    planilla={planilla} 
                    catalogoProductos={catalogoProductos}
                    onBoletaGuardada={(nuevaBoleta) => {
                        console.log('Boleta finalizada: ', nuevaBoleta);
                        setBoletasDia([...boletasDia, nuevaBoleta]); 

                        const stockActualizado = stockProductos.map(itemStock => {
                            const detalleVendido = nuevaBoleta.ventas.find(
                                ventas => String(ventas.id_producto) === String(itemStock.id_producto)
                            );

                            if (detalleVendido) {
                                // Si se vendió, le sumamos la cantidad al "stock_vendido"
                                console.log(`Producto ID ${itemStock.id_producto} vendido en cantidad ${detalleVendido.cantidad}`); 
                                
                                return {
                                    ...itemStock,
                                    stock_vendido: itemStock.stock_vendido + detalleVendido.cantidad
                                };
                            }
                            
                            // Si no se vendió, queda exactamente igual
                            return itemStock; 
                        });
                        
                        console.log('Stock actualizado después de la venta:', stockActualizado);
                        setStockProductos(stockActualizado);
                        
                        setMostrarModalBoleta(false);
                        setClienteParaBoleta(null);
                    }}
                />
            )}

        </main>
    );
}

export default VistaPuntoVenta;
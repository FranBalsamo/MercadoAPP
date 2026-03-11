import { useState, useEffect } from 'react';
import ControlStock from './ControlStock';
import ListaBoletas from './ListaBoletas';
import ModalBoleta from '../Modals/ModalBoleta';

function VistaPuntoVenta({ cerrarPlanilla, planilla }) {
    const [catalogoProductos, setCatalogoProductos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [mostrarModalBuscarCliente, setMostrarModalBuscarCliente] = useState(false);
    const [mostrarModalBoleta, setMostrarModalBoleta] = useState(false);
    const [clienteParaBoleta, setClienteParaBoleta] = useState(null);


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

    const procesarClienteEncontrado = (cliente) => {
        setClienteParaBoleta(cliente);           // 1. Guardamos los datos del cliente
        setMostrarModalBuscarCliente(false);     // 2. Cerramos el buscador
        setMostrarModalBoleta(true);             // 3. ¡Abrimos la boleta!
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
                    stockProductos={planilla.stockProductos}
                    catalogoProductos={catalogoProductos}
                    cargando={cargando}
                />

                <ListaBoletas
                    abrirModalBoleta={() => setMostrarModalBoleta(true)}
                />

            </div>

            {/* AQUÍ IRÁ TU FUTURO MODAL */}
            {mostrarModalBuscarCliente && (
                <ModalBuscarCliente 
                    cerrarModal={() => setMostrarModalBuscarCliente(false)}
                    onClienteEncontrado={procesarClienteEncontrado} // ¡Le pasamos la función de enlace!
                />
            )}

            {mostrarModalBoleta && (
                <ModalBoleta 
                    cerrarModal={() => setMostrarModalBoleta(false)}
                    cliente={clienteParaBoleta} // ¡Le pasamos el cliente guardado!
                    planilla = {planilla}
                    catalogoProductos={catalogoProductos}
                />
            )}

        </main>
    );
}

export default VistaPuntoVenta;
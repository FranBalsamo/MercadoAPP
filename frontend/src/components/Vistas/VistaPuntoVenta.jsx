import { useState, useEffect } from 'react';
import ControlStock from './ControlStock';
import ListaBoletas from './ListaBoletas';

function VistaPuntoVenta({ cerrarPlanilla, planilla }) {
    const [catalogoProductos, setCatalogoProductos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [mostralModalBoleta, setMostrarModalBoleta] = useState(false);


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
            {/* {mostrarModalBoleta && (
                <ModalBoleta 
                    cerrarModal={() => setMostrarModalBoleta(false)}
                    catalogoProductos={catalogoProductos}
                />
            )} 
            */}

        </main>
    );
}

export default VistaPuntoVenta;
function VistaPuntoVenta({ cerrarPlanilla, planilla }) {
    
    if (!planilla) return <p>Cargando planilla...</p>
    
    return (
        <main style={{ padding: '20px', backgroundColor: '#f4f6f8', minHeight: 'calc(100vh - 60px)' }}>
            {/* ¡Usamos los datos reales del backend! */}
            <h2>🛒 Planilla Abierta - #{planilla.id}</h2>
            <p style={{ color: '#555' }}>
                Fecha de apertura: {planilla.fecha} | Estado: {planilla.estadoPlanilla}
            </p>

            <hr style={{ margin: '20px 0', borderColor: '#ccc' }} />

            {/* Aquí luego construiremos el buscador de productos y el ticket */}
            <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ flex: 1, backgroundColor: 'white', padding: '20px', borderRadius: '8px' }}>
                    <h3>Control Stocks</h3>
                    <p>(Próximamente...)</p>
                </div>
                <div style={{ flex: 1, backgroundColor: 'white', padding: '20px', borderRadius: '8px' }}>
                    <h3>Boletas</h3>
                    <p>(Próximamente...)</p>
                </div>
            </div>

            <br />
            <button
                onClick={cerrarPlanilla}
                style={{ padding: '10px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
                Cerrar Planilla (Volver al Inicio)
            </button>
        </main>
    );
}

export default VistaPuntoVenta;
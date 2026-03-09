function ListaBoletas({ abrirModalBoleta }) {
    return (
        <div style={{
            flex: 3,
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <h3 style={{ marginTop: 0 }}>🧾 Boletas de la Planilla</h3>

            {/* ZONA DE LA TABLA (Por ahora vacía) */}
            <div style={{ flexGrow: 1, overflowY: 'auto', marginBottom: '20px', paddingRight: '5px' }}>
                <p style={{ color: '#888', fontStyle: 'italic' }}>Aún no hay boletas cargadas...</p>

                {/* Aquí irá la tabla con Cliente, Total, Pagado, Retirado */}
            </div>

            <div style={{ paddingTop: '20px', borderTop: '2px dashed #eee', display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end' }}>
                <button
                    onClick={abrirModalBoleta}
                    style={{ padding: '10px 20px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    + Cargar Nueva Boleta
                </button>
            </div>
        </div>
    );
}

export default ListaBoletas;
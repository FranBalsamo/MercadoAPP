function ControlStock({ stockProductos, catalogoProductos, cargando }) {
    
    const obtenerNombreProducto = (idBusqueda) => {
        const productoEncontrado = catalogoProductos.find(p => String(p.id) === String(idBusqueda));
        return productoEncontrado ? productoEncontrado.nombre : `Producto #${idBusqueda}`;
    };

    return (
        <div style={{
            flex: 1,
            minWidth: '250px',
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <h3 style={{ marginTop: 0 }}>📦 Stock Hoy</h3>

            {cargando ? (
                <p>Cargando catálogo...</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px', flexGrow: 1, overflowY: 'auto', paddingRight: '5px' }}>
                    {stockProductos.map((item) => {
                        const stockActual = item.stock;

                        return (
                            <div key={item.id} style={{
                                border: '1px solid #ddd',
                                padding: '10px 15px',
                                borderRadius: '8px',
                                backgroundColor: stockActual <= 0 ? '#ffeeee' : '#f8f9fa',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <h4 style={{ margin: 0, fontSize: '1rem' }}>
                                    {obtenerNombreProducto(item.id_producto)}
                                </h4>
                                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: stockActual > 0 ? '#27ae60' : '#c0392b' }}>
                                    {stockActual} un.
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default ControlStock;
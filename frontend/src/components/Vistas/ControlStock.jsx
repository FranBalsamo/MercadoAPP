import '../Estilos/Botones.css'

function ControlStock({ stockProductos, catalogoProductos, cargando, abrirModificarStock , abrirAgregarProducto}) {
    const obtenerNombreProducto = (idBusqueda) => {
        const productoEncontrado = catalogoProductos.find(p => String(p.id) === String(idBusqueda));
        return productoEncontrado ? productoEncontrado.nombre : `Producto #${idBusqueda}`;
    };

    const ColorFondoStock = (stockActual) => {
        if (stockActual === 0) return '#fccc';
        else if (stockActual <= 20) return '#ffbc';
        else return '#fffa';
    };

    const ColorTextoStock = (stockActual) => {
        if (stockActual === 0) return '#e74c3c';
        else if (stockActual <= 20) return '#e67e22';
        else return '#2ecc71';
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
            <div className="controlStock-header" style={{display:'flex', flexDirection:'row', justifyContent:'space-between' }}>
                <h3 style={{ marginTop: 0, padding: '5px' }}>📦 Inventario Hoy</h3>
                <button 
                    className="btn-global btn-primario"
                    onClick={abrirModificarStock}
                >
                    Modificar
                </button>
            </div>
            {cargando ? (
                <p>Cargando catálogo...</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px', flexGrow: 1, overflowY: 'auto', paddingRight: '5px' }}>
                    {[...stockProductos]
                        .sort((itemA, itemB) => {
                            const stockA = itemA.stock - itemA.stock_vendido;
                            const stockB = itemB.stock - itemB.stock_vendido;

                            const esCeroA = stockA === 0;
                            const esCeroB = stockB === 0;

                            if (esCeroA && esCeroB) return 0;
                            if (esCeroA) return 1; // 0 al final
                            if (esCeroB) return -1;

                            return stockA - stockB; // ascendente normal
                        })
                        .map((item) => {
                            const stockActual = item.stock - item.stock_vendido;

                            return (
                                <div key={item.id} style={{
                                    border: '1px solid #ddd',
                                    padding: '10px 15px',
                                    borderRadius: '8px',
                                    backgroundColor: ColorFondoStock(stockActual),
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <h4 style={{ margin: 0, fontSize: '1rem', textTransform:'capitalize'}}>
                                        {obtenerNombreProducto(item.id_producto)}
                                    </h4>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color:ColorTextoStock(stockActual) }}>
                                        {stockActual} un.
                                    </div>
                                </div>
                            );
                        })}
                </div>
            )}
            <div style={{ paddingTop: '20px', borderTop: '2px dashed #eee', display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end'}}>
                <button 
                    className='btn-global btn-primario'
                    onClick={abrirAgregarProducto}
                    style={{ width: '100%', color: '#eeef', fontSize: '1.1rem', fontWeight: 'bold', }}
                >
                    + Agregar Producto
                </button>
            </div>
        </div>
    );
}

export default ControlStock;
import { HiOutlineCube } from 'react-icons/hi2';
import '@/shared/styles/Botones.css'

function ControlStock({ stockProductos, catalogoProductos, cargando, abrirModificarStock , abrirAgregarProducto}) {
    const obtenerNombreProducto = (idBusqueda) => {
        const productoEncontrado = catalogoProductos.find(p => String(p.id) === String(idBusqueda));
        return productoEncontrado ? productoEncontrado.nombre : `Producto #${idBusqueda}`;
    };

    const ColorFondoStock = (stockActual) => {
        if (stockActual === 0) return 'var(--danger-soft)';
        else if (stockActual <= 20) return 'var(--warning-soft)';
        else return 'var(--surface-2)';
    };

    const ColorTextoStock = (stockActual) => {
        if (stockActual === 0) return 'var(--danger)';
        else if (stockActual <= 20) return 'var(--warning)';
        else return 'var(--success)';
    };

    return (
        <div style={{
            flex: 1,
            minWidth: '250px',
            minHeight: 0,
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            padding: '20px',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <div className="controlStock-header" style={{display:'flex', flexDirection:'row', justifyContent:'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <h3 style={{ marginTop: 0, padding: '5px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}><HiOutlineCube /> Inventario Hoy</h3>
                <button
                    className="btn-global btn-primario"
                    onClick={abrirModificarStock}
                >
                    Modificar
                </button>
            </div>
            {cargando ? (
                <p style={{ color: 'var(--text-secondary)' }}>Cargando catálogo...</p>
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
                                    border: '1px solid var(--border)',
                                    padding: '10px 15px',
                                    borderRadius: 'var(--radius-md)',
                                    backgroundColor: ColorFondoStock(stockActual),
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <h4 style={{ margin: 0, fontSize: '1rem', textTransform:'capitalize', color: 'var(--text-primary)'}}>
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
            <div style={{ paddingTop: '20px', borderTop: '1px dashed var(--border)', display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end'}}>
                <button
                    className='btn-global btn-primario'
                    onClick={abrirAgregarProducto}
                    style={{ width: '100%', fontSize: '1.1rem', fontWeight: 'bold', }}
                >
                    + Agregar Producto
                </button>
            </div>
        </div>
    );
}

export default ControlStock;
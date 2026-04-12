import { useState } from "react";
import "../Estilos/Botones.css";

function ListaBoletas({ abrirModalBoleta, abrirModalModificarBoleta, eliminarBoleta ,boletas = [], clientes = [] }) {
    const [error, setError] = useState('');
    const [busqueda, setBusqueda] = useState('');

    const [configOrden, setConfigOrden] = useState({ columna: null, direccion: 'asc' });

    const nombreCliente = (id_cliente) => {
        const clienteEncontrado = clientes.find(cliente => cliente.id === id_cliente);
        if (!clienteEncontrado) return '-';
        return clienteEncontrado.nombre;
    }

    const solicitarOrden = (columna) => {
        let direccion = 'asc';
        // Si tocas la misma columna que ya estaba activa, invertimos la dirección
        if (configOrden.columna === columna && configOrden.direccion === 'asc') {
            direccion = 'desc';
        }
        setConfigOrden({ columna, direccion });
    };


    const boletasProcesadas = boletas
        .filter((boleta) => {
            if (!busqueda) return true;
            const nombreDelCliente = nombreCliente(boleta.id_cliente).toLowerCase();
            return nombreDelCliente.includes(busqueda.toLowerCase());
        })
        .sort((a, b) => {
            // Si nadie tocó ningún encabezado aún, no ordenamos
            if (!configOrden.columna) return 0;

            if (configOrden.columna === 'nombre') {
                const nombreA = nombreCliente(a.id_cliente).toLowerCase();
                const nombreB = nombreCliente(b.id_cliente).toLowerCase();
                // localeCompare ordena alfabéticamente
                return configOrden.direccion === 'asc'
                    ? nombreA.localeCompare(nombreB)
                    : nombreB.localeCompare(nombreA);
            }

            if (configOrden.columna === 'pago') {
                // Le damos "1 punto" si está pagado y "0" si no lo está. 
                // Así obligamos a los "1" a ir arriba.
                const pesoA = a.estadoPago === 'PAGADO' ? 1 : 0;
                const pesoB = b.estadoPago === 'PAGADO' ? 1 : 0;
                return configOrden.direccion === 'asc'
                    ? pesoB - pesoA
                    : pesoA - pesoB;
            }

            if (configOrden.columna === 'retiro') {
                const pesoA = a.estadoRetiro === 'RETIRADO' ? 1 : 0;
                const pesoB = b.estadoRetiro === 'RETIRADO' ? 1 : 0;
                return configOrden.direccion === 'asc'
                    ? pesoB - pesoA
                    : pesoA - pesoB;
            }

            return 0;
        });

    // Función auxiliar para dibujar flechitas en los encabezados
    const obtenerIconoOrden = (nombreColumna) => {
        if (configOrden.columna !== nombreColumna) return ' ↕️'; // Icono por defecto (inactivo)
        return configOrden.direccion === 'asc' ? ' ⬇️' : ' ⬆️'; // Activo
    };

    return (
        <div style={{ flex: 3, backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px', marginBottom: '10px' }}>
                <input
                    type="text"
                    placeholder="Filtrar boletas por nombre..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    style={{ border: 'none', borderBottom: '2px solid', borderColor: '#eeee', borderRadius: '5px', padding: '5px 10px', width: '50%', outline: 'none' }}
                />
                <h3>Boletas Cargadas 🧾</h3>
            </div>

            {/* ZONA DE LA TABLA */}
            <div style={{ flexGrow: 1, overflowY: 'auto', marginBottom: '20px', paddingRight: '5px' }}>

                {boletasProcesadas.length === 0 ? (
                    <p style={{ color: '#888', fontStyle: 'italic', textAlign: 'center', marginTop: '50px' }}>
                        {boletas.length === 0
                            ? "Aún no hay boletas cargadas en esta caja..."
                            : "No se encontró ninguna boleta para ese cliente."}
                    </p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
                        <thead style={{ backgroundColor: '#f4f6f8', position: 'sticky', top: 0 }}>
                            <tr>
                                <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}># Boleta</th>
                                <th
                                    onClick={() => solicitarOrden('nombre')}
                                    style={{ padding: '12px', borderBottom: '2px solid #ddd', cursor: 'pointer', userSelect: 'none' }}
                                    title="Ordenar por Cliente"
                                >
                                    Cliente {obtenerIconoOrden('nombre')}
                                </th>
                                <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Total</th>
                                <th
                                    onClick={() => solicitarOrden('pago')}
                                    style={{ padding: '12px', borderBottom: '2px solid #ddd', cursor: 'pointer', userSelect: 'none' }}
                                    title="Ordenar por Estado de Pago"
                                >
                                    Pago {obtenerIconoOrden('pago')}
                                </th>
                                <th
                                    onClick={() => solicitarOrden('retiro')}
                                    style={{ padding: '12px', borderBottom: '2px solid #ddd', cursor: 'pointer', userSelect: 'none' }}
                                    title="Ordenar por Estado de Retiro"
                                >
                                    Retiro {obtenerIconoOrden('retiro')}
                                </th>
                                <th style={{ padding: '12px', borderBottom: '2px solid #ddd', textAlign: 'center' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {boletasProcesadas.map((boleta, index) => (
                                <tr key={boleta.id || index} style={{ borderBottom: '1px solid #eee', cursor: 'pointer' }}>
                                    <td style={{ padding: '12px', color: '#888' }}>{boleta.id || index + 1}</td>
                                    <td style={{ padding: '12px', fontWeight: 'bold', textTransform: 'capitalize' }}>
                                        {nombreCliente(boleta.id_cliente)}
                                    </td>
                                    <td style={{ padding: '12px', fontWeight: 'bold', color: '#2c3e50' }}>
                                        {boleta.total.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <span style={{
                                            padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold',
                                            backgroundColor: boleta.estadoPago === 'PAGADO' ? '#d4efdf' : '#fadbd8',
                                            color: boleta.estadoPago === 'PAGADO' ? '#27ae60' : '#c0392b'
                                        }}>
                                            {boleta.estadoPago}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <span style={{
                                            padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold',
                                            backgroundColor: boleta.estadoRetiro === 'RETIRADO' ? '#d6eaf8' : '#fadbd8',
                                            color: boleta.estadoRetiro === 'RETIRADO' ? '#2980b9' : '#c0392b'
                                        }}>
                                            {boleta.estadoRetiro}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px', textAlign: 'center', display: 'flex', gap: '15px', justifyContent: 'center', alignItems: 'center' }}>
                                        <button
                                            className='btn-global btn-primario'
                                            onClick={() => abrirModalModificarBoleta(boleta, nombreCliente(boleta.id_cliente))} 
                                            style={{
                                                fontSize:'0.9rem', color:'#eeef', padding: '4px 8px',
                                            }}
                                            title="Modificar Boleta"
                                        >
                                            Modificar
                                        </button>
                                        <button 
                                            className='btn-global btn-peligro'
                                            onClick={() => eliminarBoleta(boleta)} 
                                            style={{ color: '#eeef', width: '25px', height: '25px',padding:'4px 8px',fontSize: '0.9rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                                            title="Eliminar Boleta"
                                        >
                                            X
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <div style={{ paddingTop: '20px', borderTop: '2px dashed #eee', display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end' }}>
                <button
                    onClick={abrirModalBoleta}
                    style={{ padding: '10px 20px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem' }}
                >
                    + Cargar Nueva Boleta
                </button>
            </div>
        </div>
    );
}

export default ListaBoletas;
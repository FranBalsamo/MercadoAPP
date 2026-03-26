import {useState } from "react";


function ListaBoletas({ abrirModalBoleta, boletas = [], clientes = []}) {
    const [error, setError] = useState('');
    const [cliente, setCliente] = useState('');
    
    const nombreCliente = (id_cliente) => {
        const clienteEncontrado = clientes.find(cliente => cliente.id === id_cliente);
        if(!clienteEncontrado){
            return '-';
        }
        return clienteEncontrado.nombre;
    }

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
            
            <div style={{display:'flex', justifyContent:'space-between' ,gap:'15px', marginBottom:'10px'}}>
                <input type="text" placeholder="Filtrar boletas por nombre..." style={{
                    border:'none', 
                    borderBottom:'2px solid',
                    borderColor:'#eeee', 
                    borderRadius:'5px', 
                    padding: '5px 10px', 
                    width:'50%'}} 
                />
                <h3>Boletas Cargadas🧾 </h3>
            </div>
            
            {/* ZONA DE LA TABLA */}
            <div style={{ flexGrow: 1, overflowY: 'auto', marginBottom: '20px', paddingRight: '5px' }}>
                
                {boletas.length === 0 ? (
                    <p style={{ color: '#888', fontStyle: 'italic', textAlign: 'center', marginTop: '50px' }}>
                        Aún no hay boletas cargadas en esta caja...
                    </p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
                        <thead style={{ backgroundColor: '#f4f6f8', position: 'sticky', top: 0 }}>
                            <tr>
                                <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}># Boleta</th>
                                <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Cliente</th>
                                <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Total</th>
                                <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Pago</th>
                                <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Retiro</th> 
                                <th style={{ borderBottom: '2px solid #ddd' }}>Ver</th> 
                            </tr>
                        </thead>
                        <tbody>
                            {boletas.map((boleta, index) => (
                                <tr 
                                    key={boleta.id || index} style={{ borderBottom: '1px solid #eee',cursor:'pointer'}}
                                >
                                    <td style={{ padding: '12px', color: '#888'}}>{index + 1}</td>
                                    <td key={boleta.id_cliente} style={{ padding: '12px', fontWeight: 'bold', textTransform:'capitalize'}}>{nombreCliente(boleta.id_cliente)}</td> 
                                    <td style={{ padding: '12px', fontWeight: 'bold', color: '#2c3e50' }}>
                                        ${boleta.total.toFixed(2)}
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
                                    <td style={{textAlign:'center', fontSize:'1.5rem'}}>
                                        👁
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

            </div>

            {/* FOOTER: Botón para abrir el buscador de clientes */}
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
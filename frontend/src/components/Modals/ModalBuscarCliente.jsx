import { useState } from 'react';
import '../Estilos/Modal.css';

function ModalBuscarCliente({ cerrarModal, onClienteEncontrado }) {
    const [metodoBusqueda, setMetodoBusqueda] = useState('nombre'); 
    const [busqueda, setBusqueda] = useState('');

    // Esta función simulará que fuimos a Java y encontramos al cliente
    const handleBuscar = () => {
        // Validación básica
        if (busqueda.trim() === '') {
            alert("Ingresa un dato para buscar");
            return;
        }

        // ⚠️ AQUÍ LUEGO HARÁS EL FETCH A SPRING BOOT ⚠️
        // Simulamos el ClienteDTO que te devolvería Java:
        const clienteSimulado = {
            id: 99,
            nombre: metodoBusqueda === 'nombre' ? busqueda : 'Cliente Encontrado',
            documento: metodoBusqueda === 'documento' ? busqueda : '11222333'
        };

        // ¡Le pasamos el cliente encontrado al padre (VistaPuntoVenta)!
        onClienteEncontrado(clienteSimulado);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-contenido" style={{ maxWidth: '500px' }}>
                
                <div className="modal-header">
                    <h3>🔍 Buscar Cliente</h3>
                    <button className="btn-cerrar" onClick={cerrarModal}>X</button>
                </div>

                <div className="modal-body">
                    <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
                        <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <input type="radio" checked={metodoBusqueda === 'nombre'} onChange={() => setMetodoBusqueda('nombre')} />
                            Por Nombre
                        </label>
                        <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <input type="radio" checked={metodoBusqueda === 'documento'} onChange={() => setMetodoBusqueda('documento')} />
                            Por CUIT
                        </label>
                    </div>

                    <div className="form-group" style={{ marginBottom: '20px' }}>
                        <input 
                            type={metodoBusqueda === 'documento' ? 'number' : 'text'} 
                            placeholder={metodoBusqueda === 'nombre' ? 'Ej: Juan Pérez' : 'Ej: 20334445556'}
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                        />
                    </div>

                    <button 
                        onClick={handleBuscar}
                        style={{ width: '100%', padding: '10px', backgroundColor: '#2ecc71', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        Buscar y Continuar ➔
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ModalBuscarCliente;
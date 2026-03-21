import { useState } from 'react';
import '../Estilos/Modal.css';

function ModalBuscarCliente({ cerrarModal, onClienteEncontrado }) {
    const [metodoBusqueda, setMetodoBusqueda] = useState('nombre'); 
    const [busqueda, setBusqueda] = useState('');
    const [error, setError] = useState('');
    const [buscando, setBuscando] = useState(false);

    const handleBuscar = async () => {
        if (busqueda.trim() === '') {
            setError('❌ Ingresa un dato para buscar.');
            return;
        }

        setBuscando(true);
        setError('');

        try {
            let url = '';
            if (metodoBusqueda === 'documento') {
                url = `http://localhost:8080/api/clientes/buscar/documento/${busqueda}`;
            } else {
                url = `http://localhost:8080/api/clientes/buscar/nombre/${busqueda}`;
            }

            const respuesta = await fetch(url);

            // Si Java devuelve un 404 (Not Found) o similar...
            if (!respuesta.ok) {
                setError('❌ Cliente no encontrado. Verifica los datos ingresados.');
                setBuscando(false);
                return; // ¡Frenamos aquí! No se abre la boleta.
            }

            // 4. Si el cliente existe, extraemos los datos
            const clienteReal = await respuesta.json();
            
            onClienteEncontrado(clienteReal);

        } catch (err) {
            console.error(err);
            setError('❌ Error al conectar con el servidor.');
        } finally {
            setBuscando(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-contenido" style={{ maxWidth: '500px' }}>
                
                <div className="modal-header">
                    <h3>🔍 Buscar Cliente</h3>
                    <button className="btn-cerrar" onClick={cerrarModal}>X</button>
                </div>

                <div className="modal-body">
                    {/* CARTEL DE ERROR */}
                    {error && (
                        <div style={{ backgroundColor: '#ffcccc', color: '#cc0000', padding: '10px', borderRadius: '4px', fontSize: '0.9rem', marginBottom: '15px' }}>
                            {error}
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
                        <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <input 
                                type="radio" 
                                checked={metodoBusqueda === 'nombre'} 
                                onChange={() => { setMetodoBusqueda('nombre'); setError(''); }} 
                            />
                            Por Nombre
                        </label>
                        <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <input 
                                type="radio" 
                                checked={metodoBusqueda === 'documento'} 
                                onChange={() => { setMetodoBusqueda('documento'); setError(''); }} 
                            />
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
                            //Si presiona Enter, ejecuta la búsqueda
                            onKeyDown={(e) => e.key === 'Enter' && handleBuscar()} 
                        />
                    </div>

                    <button 
                        onClick={handleBuscar}
                        disabled={buscando}
                        style={{ width: '100%', padding: '10px', backgroundColor: buscando ? '#95a5a6' : '#3498db', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        {buscando ? 'Buscando en la base de datos...' : 'Buscar y Continuar ➔'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ModalBuscarCliente;
import { useState, useEffect } from 'react';
import { HiOutlineMagnifyingGlass, HiOutlineArrowRight } from 'react-icons/hi2';
import '../Estilos/Modal.css';
import '../Estilos/Botones.css';
import '../Estilos/Formularios.css';

function ModalBuscarCliente({ cerrarModal, onClienteEncontrado }) {
    const [metodoBusqueda, setMetodoBusqueda] = useState('nombre');
    const [filtroNombre, setFiltroNombre] = useState('');
    const [busquedaDocumento, setBusquedaDocumento] = useState('');
    const [clientes, setClientes] = useState([]);
    const [clienteSeleccionadoId, setClienteSeleccionadoId] = useState(null);
    const [error, setError] = useState('');
    const [buscando, setBuscando] = useState(false);

    const cargarClientes = async (filtro = '') => {
        setBuscando(true);
        setError('');

        try {
            const nombreParaUrl = filtro.trim();
            const url = nombreParaUrl
                ? `http://localhost:8080/api/clientes/All/${encodeURIComponent(nombreParaUrl)}`
                : 'http://localhost:8080/api/clientes/All';

            const respuesta = await fetch(url);
            if (!respuesta.ok) {
                setClientes([]);
                setError('No se pudieron cargar los clientes.');
                return;
            }

            const datos = await respuesta.json();
            setClientes(Array.isArray(datos) ? datos : []);
        } catch (err) {
            console.error(err);
            setError('Error al conectar con la API de clientes.');
            setClientes([]);
        } finally {
            setBuscando(false);
        }
    };

    useEffect(() => {
        if (metodoBusqueda === 'nombre') {
            cargarClientes(filtroNombre);
        }
    }, [metodoBusqueda, filtroNombre]);

    const handleBuscarDocumento = async () => {
        if (busquedaDocumento.trim() === '') {
            setError('Ingresa un CUIT para buscar.');
            return;
        }

        setBuscando(true);
        setError('');

        try {
            const url = `http://localhost:8080/api/clientes/buscar/documento/${busquedaDocumento}`;
            const respuesta = await fetch(url);

            if (!respuesta.ok) {
                setError('Cliente no encontrado por CUIT.');
                return;
            }

            const clienteReal = await respuesta.json();
            onClienteEncontrado(clienteReal);
            cerrarModal();
        } catch (err) {
            console.error(err);
            setError('Error al conectar con el servidor.');
        } finally {
            setBuscando(false);
        }
    };

    const seleccionarCliente = (cliente) => {
        setClienteSeleccionadoId(cliente.id);
    };

    const confirmarSeleccion = () => {
        if (!clienteSeleccionadoId) return;
        const cliente = clientes.find((c) => c.id === clienteSeleccionadoId);
        if (!cliente) return;
        onClienteEncontrado(cliente);
        cerrarModal();
    };

    return (
        <div className="modal-overlay">
            <div className="modal-contenido" style={{ width: '90%', maxWidth: metodoBusqueda === 'nombre' ? '900px' : '400px', minHeight: metodoBusqueda === 'nombre' ? '500px' : '250px' }}>
                
                <div className="modal-header">
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><HiOutlineMagnifyingGlass /> Buscar Cliente</h3>
                    <button className="btn-cerrar-modal" onClick={cerrarModal}>X</button>
                </div>

                <div className="modal-body">
                    {/* CARTEL DE ERROR */}
                    {error && (
                        <div style={{ backgroundColor: 'var(--danger-soft)', color: 'var(--danger-soft-text)', padding: '10px', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem', marginBottom: '15px' }}>
                            {error}
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
                        <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <input
                                type="radio"
                                className="radio-personalizado"
                                checked={metodoBusqueda === 'nombre'}
                                onChange={() => { setMetodoBusqueda('nombre'); setError(''); }}
                            />
                            Por Nombre
                        </label>
                        <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <input
                                type="radio"
                                className="radio-personalizado"
                                checked={metodoBusqueda === 'documento'}
                                onChange={() => { setMetodoBusqueda('documento'); setError(''); }}
                            />
                            Por CUIT
                        </label>
                    </div>

                    {metodoBusqueda === 'nombre' ? (
                        <>
                            <div className="form-group" style={{ marginBottom: '15px', display: 'flex',flexDirection: 'row' ,justifyContent: 'space-between', gap: '10px' }}>
                                <input
                                    type="text"
                                    placeholder="Filtrar por nombre (ej: Fer)"
                                    value={filtroNombre}
                                    onChange={(e) => setFiltroNombre(e.target.value)}
                                    style={{ flex: 1,padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', margin: 0, backgroundColor: 'var(--surface)', color: 'var(--text-primary)' }}
                                />
                                <button
                                    className='btn-global btn-primario'
                                    onClick={confirmarSeleccion}
                                    disabled={!clienteSeleccionadoId}
                                    style={{
                                        width: 'auto',
                                        margin: 0
                                    }}
                                >
                                    Confirmar selección
                                </button>
                            </div>

                            {/* TABLA DE CLIENTES */}
                            
                            <div style={{maxHeight: '280px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                                <table style={{
                                    width: '100%',
                                    borderCollapse: 'collapse',
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}>
                                    <thead style={{
                                        backgroundColor: 'var(--surface-inverse)',
                                        width: '100%',
                                        display: 'table',
                                        tableLayout: 'fixed'
                                    }}>
                                        <tr style={{
                                            color: 'var(--text-on-inverse)'
                                        }}>
                                            <th style={{ padding: '8px', textAlign: 'left' }}>Nombre</th>
                                            <th style={{ padding: '8px', textAlign: 'left' }}>CUIT/L</th>
                                        </tr>
                                    </thead>
                                    <tbody style={{
                                        display: 'block', 
                                        minHeight: '200px',
                                        maxHeight: '235px',
                                        overflowY: 'auto',    //Activa el scroll solo dentro del cuerpo de la tabla
                                        width: '100%'
                                    }}>
                                        {buscando ? (
                                            <tr>
                                                {/* 👇 Nota: Quitamos el colSpan porque en modo 'block' a veces rompe el diseño. Usamos width '100%' */}
                                                <td style={{ display: 'block', width: '100%', padding: '10px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                                    Cargando clientes...
                                                </td>
                                            </tr>
                                        ) : clientes.length === 0 ? (
                                            <tr>
                                                <td style={{ display: 'block', width: '100%', padding: '10px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                                    No se encontró ningún cliente.
                                                </td>
                                            </tr>
                                        ) : (
                                            clientes.map((cliente) => {
                                                const seleccionado = clienteSeleccionadoId === cliente.id;
                                                return (
                                                    <tr
                                                        key={cliente.id}
                                                        style={{
                                                            display: 'table', //Cada fila vuelve a ser tipo tabla para que las columnas cuadren
                                                            width: '100%',
                                                            tableLayout: 'fixed',
                                                            cursor: 'pointer',
                                                            backgroundColor: seleccionado ? 'var(--accent-soft)' : 'transparent',
                                                            color: 'var(--text-primary)'
                                                        }}
                                                        onClick={() => seleccionarCliente(cliente)}
                                                    >
                                                        <td style={{ padding: '8px', borderBottom: '1px solid var(--border)', textTransform: 'capitalize' }}>{cliente.nombre}</td>
                                                        <td style={{ padding: '8px', borderBottom: '1px solid var(--border)' }}>{cliente.documento || '-'}</td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>

                        </>
                    ) : (
                        <>
                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                <input
                                    type="number"
                                    placeholder="Ej: 20334445556"
                                    value={busquedaDocumento}
                                    onChange={(e) => setBusquedaDocumento(e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text-primary)' }}
                                    onKeyDown={(e) => e.key === 'Enter' && handleBuscarDocumento()}
                                />
                            </div>

                            <button
                                    className='btn-global btn-primario'
                                    onClick={handleBuscarDocumento}
                                    disabled={buscando}
                                    style={{ width: '100%', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                            >
                                {buscando ? 'Buscando en la base de datos...' : <>Buscar y Continuar <HiOutlineArrowRight /></>}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ModalBuscarCliente;
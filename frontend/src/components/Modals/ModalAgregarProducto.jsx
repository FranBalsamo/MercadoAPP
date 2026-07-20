import { useState } from 'react';
import { HiOutlinePlusCircle } from 'react-icons/hi2';
import SelectPersonalizado from '../UI/SelectPersonalizado';
import InputNumero from '../UI/InputNumero';
import '../Estilos/Modal.css';
import '../Estilos/Botones.css';
import '../Estilos/Formularios.css';

function ModalAgregarProducto({ cerrarModal, planilla, catalogoProductos, stockProductos, onStockAgregado }) {
    // Iniciamos con una fila vacía por defecto
    const [filas, setFilas] = useState([
        { id_fila: crypto.randomUUID(), id_producto: '', cantidad: '' }
    ]);
    const [error, setError] = useState('');
    const [guardando, setGuardando] = useState(false);

    // 1. Extraemos los IDs de los productos que YA están en la planilla hoy
    const idsYaEnPlanilla = stockProductos.map(item => String(item.id_producto));

    // 2. Extraemos los IDs que el usuario está seleccionando AHORA MISMO en este modal
    const idsSeleccionadosModal = filas.map(fila => String(fila.id_producto)).filter(id => id !== '');

    // --- LÓGICA DE FILAS ---
    const agregarFila = () => {
        setFilas([...filas, { id_fila: crypto.randomUUID(), id_producto: '', cantidad: '' }]);
    };

    const actualizarFila = (index, campo, valor) => {
        const nuevasFilas = [...filas];
        nuevasFilas[index][campo] = valor;
        setFilas(nuevasFilas);
    };

    const eliminarFila = (index) => {
        const nuevasFilas = filas.filter((_, i) => i !== index);
        setFilas(nuevasFilas);
    };

    // --- LÓGICA PARA GUARDAR ---
    const handleGuardar = async () => {
        setError('');

        if (filas.length === 0) {
            setError('Debes agregar al menos un producto.');
            return;
        }

        // Validación fila por fila
        for (let i = 0; i < filas.length; i++) {
            const fila = filas[i];
            const numeroFila = i + 1;

            if (!fila.id_producto || fila.id_producto === '') {
                setError(`Faltó seleccionar un producto en la fila ${numeroFila}.`);
                return;
            }

            const cantidadReal = parseFloat(fila.cantidad);
            if (!fila.cantidad || isNaN(cantidadReal) || cantidadReal <= 0) {
                setError(`La cantidad debe ser mayor a 0 en la fila ${numeroFila}.`);
                return;
            }
        }

        setGuardando(true);

        try {
            // Hacemos un bucle para enviar cada producto nuevo a tu API
            for (const fila of filas) {
                const nuevoStockDTO = {
                    id_producto: Number(fila.id_producto),
                    id_planilla: planilla.id,
                    stock: parseFloat(fila.cantidad)
                };

                // Llama al endpoint de creación (asegúrate de que sea tu URL correcta)
                const respuesta = await fetch('http://localhost:8080/api/stock/add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(nuevoStockDTO)
                });

                if (!respuesta.ok) {
                    throw new Error(`Error al guardar el producto ${fila.id_producto}`);
                }
            }

            console.log("¡Nuevos productos agregados con éxito!");
            await onStockAgregado(); // Le avisamos a VistaPuntoVenta que recargue el stock
            cerrarModal();

        } catch (err) {
            console.error(err);
            setError('Ocurrió un error al intentar guardar los productos en el servidor.');
        } finally {
            setGuardando(false);
        }
    };

    // Ordenamos el catálogo alfabéticamente para el select
    const catalogoOrdenado = [...catalogoProductos].sort((a, b) => a.nombre.localeCompare(b.nombre));

    return (
        <div className="modal-overlay">
            <div className="modal-contenido" style={{ width: '95%', maxWidth: '600px', maxHeight: '90vh' }}>

                <div className="modal-header">
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><HiOutlinePlusCircle /> Agregar Nuevo Producto</h3>
                    <button className="btn-cerrar-modal" onClick={cerrarModal}>X</button>
                </div>

                <div className="modal-body">
                    {error && (
                        <p style={{ color: 'var(--danger-soft-text)', fontWeight: 'bold', margin: '0', padding: '10px', backgroundColor: 'var(--danger-soft)', borderRadius: 'var(--radius-sm)' }}>
                            {error}
                        </p>
                    )}

                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
                        Selecciona productos del catálogo que aún no están en la planilla actual.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '10px' }}>
                        {filas.map((fila, index) => (
                            <div key={fila.id_fila} style={{ display: 'flex', gap: '10px', alignItems: 'center', backgroundColor: 'var(--surface-2)', padding: '10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>

                                <SelectPersonalizado
                                    style={{ flex: 2 }}
                                    value={fila.id_producto}
                                    onChange={(e) => actualizarFila(index, 'id_producto', e.target.value)}
                                    placeholder="-- Seleccionar Producto --"
                                    opciones={catalogoOrdenado
                                        .filter(prod => {
                                            const idString = String(prod.id);
                                            const yaEnPlanilla = idsYaEnPlanilla.includes(idString);
                                            const yaSeleccionadoAqui = idsSeleccionadosModal.includes(idString);
                                            const esMiSeleccion = String(fila.id_producto) === idString;
                                            // SOLO mostramos la opción si:
                                            // 1. NO está cargado previamente en la planilla.
                                            // 2. Y (NO lo seleccioné en otra fila de este modal, o es el que tengo seleccionado actualmente).
                                            return !yaEnPlanilla && (!yaSeleccionadoAqui || esMiSeleccion);
                                        })
                                        .map(prod => ({ value: prod.id, label: prod.nombre }))}
                                    capitalizarOpciones
                                />

                                <InputNumero
                                    min="0.5"
                                    step="0.5"
                                    placeholder="Cant."
                                    value={fila.cantidad}
                                    onChange={(e) => actualizarFila(index, 'cantidad', e.target.value)}
                                    style={{ flex: 1, padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', textAlign: 'center', backgroundColor: 'var(--surface)', color: 'var(--text-primary)' }}
                                />

                                <button
                                    type="button"
                                    className="btn-eliminar-fila"
                                    onClick={() => eliminarFila(index)}
                                    title="Eliminar fila"
                                >
                                    X
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div style={{ marginTop: '5px', marginBottom:'5px', borderTop: '1px solid var(--border)', paddingTop: '10px', display: 'flex', justifyContent: 'center'}}>
                    <button
                        type="button"
                        className="btn-global btn-secundario"
                        onClick={agregarFila}
                        style={{ fontSize: '0.9rem', padding: '8px 15px', width: '95%'}}
                    >
                        + Agregar otra fila
                    </button>
                </div>
                
                <div className="modal-footer">
                    <button className="btn-global btn-secundario" onClick={cerrarModal} disabled={guardando}>
                        Cancelar
                    </button>
                    <button className="btn-global btn-primario" onClick={handleGuardar} disabled={guardando}>
                        {guardando ? 'Guardando...' : 'Guardar Productos'}
                    </button>
                </div>

            </div>
        </div>
    );
}

export default ModalAgregarProducto;
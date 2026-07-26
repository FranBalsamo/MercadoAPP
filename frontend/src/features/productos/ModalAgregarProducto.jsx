import { useState } from 'react';
import { HiOutlinePlusCircle, HiOutlineExclamationTriangle, HiOutlineTrash } from 'react-icons/hi2';
import SelectPersonalizado from '@/shared/ui/SelectPersonalizado';
import InputNumero from '@/shared/ui/InputNumero';
import '@/shared/styles/Modal.css';
import '@/shared/styles/Botones.css';
import '@/shared/styles/Formularios.css';

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
            setError('Agregá al menos un producto.');
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
            setError('No se pudieron guardar los productos en el servidor. Probá de nuevo.');
        } finally {
            setGuardando(false);
        }
    };

    // Ordenamos el catálogo alfabéticamente para el select
    const catalogoOrdenado = [...catalogoProductos].sort((a, b) => a.nombre.localeCompare(b.nombre));

    // Al menos una fila con producto y cantidad válida cargados (si no, "Guardar" queda deshabilitado).
    const hayProductoValido = filas.some(fila => {
        const cantidadReal = parseFloat(fila.cantidad);
        return fila.id_producto !== '' && !isNaN(cantidadReal) && cantidadReal > 0;
    });

    return (
        <div className="modal-overlay">
            <div className="modal-contenido" style={{ width: '95%', maxWidth: '600px', maxHeight: '90vh', height: '95%' }}>

                <div className="modal-header">
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><HiOutlinePlusCircle /> Agregar Producto a la Planilla</h3>
                    <button className="btn-cerrar-modal" onClick={cerrarModal}>X</button>
                </div>

                <div className="modal-body" style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>

                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
                        Sumá productos del catálogo que todavía no están en la planilla de hoy.
                    </p>

                    {error && (
                        <p style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            color: 'var(--danger-soft-text)', fontWeight: 'bold', margin: 0,
                            padding: '10px 15px', backgroundColor: 'var(--danger-soft)', borderRadius: 'var(--radius-md)'
                        }}>
                            <HiOutlineExclamationTriangle style={{ flexShrink: 0 }} />
                            {error}
                        </p>
                    )}

                    <div style={{ display: 'flex', gap: '10px', padding: '0 10px', color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                        <span style={{ flex: 2 }}>Producto</span>
                        <span style={{ flex: 1 }}>Cantidad</span>
                        <span style={{ width: '36px' }} />
                    </div>

                    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', padding: '2px' }}>
                        {filas.map((fila, index) => (
                            <div key={fila.id_fila} style={{ display: 'flex', gap: '10px', alignItems: 'center', backgroundColor: 'var(--surface-2)', padding: '10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>

                                <SelectPersonalizado
                                    style={{ flex: 2 }}
                                    value={fila.id_producto}
                                    onChange={(e) => actualizarFila(index, 'id_producto', e.target.value)}
                                    placeholder="Seleccionar producto"
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
                                    placeholder="0"
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
                                    <HiOutlineTrash />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ marginTop: '5px', marginBottom: '5px', borderTop: '1px solid var(--border)', paddingTop: '10px', display: 'flex', justifyContent: 'center' }}>
                    <button
                        type="button"
                        className="btn-global btn-primario"
                        onClick={agregarFila}
                        style={{ fontSize: '0.9rem', padding: '8px 15px', width: '95%' }}
                    >
                        + Agregar otro producto
                    </button>
                </div>

                <div className="modal-footer">
                    <button className="btn-global btn-secundario" onClick={cerrarModal} disabled={guardando}>
                        Cancelar
                    </button>
                    <button className="btn-global btn-primario-green" onClick={handleGuardar} disabled={guardando || !hayProductoValido}>
                        {guardando ? 'Guardando...' : 'Guardar Productos'}
                    </button>
                </div>

            </div>
        </div>
    );
}

export default ModalAgregarProducto;

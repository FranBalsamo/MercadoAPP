import {useState, useEffect} from 'react';
import { HiOutlineDocumentText, HiOutlineExclamationTriangle, HiOutlineTrash } from 'react-icons/hi2';
import SelectPersonalizado from '@/shared/ui/SelectPersonalizado';
import InputNumero from '@/shared/ui/InputNumero';
import '@/shared/styles/Modal.css';
import '@/shared/styles/Botones.css';
import '@/shared/styles/Formularios.css';

function ModalAbrirPlanilla({cerrarModal, onPlanillaCreada}) {

    const [stockDiario, setStockDiario] = useState([
        {id_fila: crypto.randomUUID() ,id_producto: '', stock: ''}
    ]);
    const [productosDB, setProductosDB] = useState([]);
    const [error, setError] = useState('');
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {

        const traerProductos = async () => {
            try {
                const respuesta = await fetch('http://localhost:8080/api/productos/All');

                if (respuesta.ok) {
                    const datos = await respuesta.json(); //convierte la respuesta de Java a un arreglo de JavaScript
                    setProductosDB(datos);
                } else {
                    setError('Error al cargar la lista de productos del servidor.');
                }
            } catch (err) {
                console.log(err);
                setError('No se pudo establecer conexion con el servidor');
            }
        }

        traerProductos();
    }, []); //Los corchetes [], sirven para avisar a React que esto solo lo haga una sola vez al abrir el modal.

    const agregarFila = () => {
        setStockDiario([...stockDiario, {id_fila: crypto.randomUUID(), id_producto: '', stock:'' }]);
        /*Los ... se llama Spread Operator y stockDiario es la tabla vieja. En idioma humano significa: "Copia todas las filas que ya existían en la tabla vieja y pégalas aquí".*/
    }

    const actualizarFila = (index, campo, valor) => {
        const nuevaFilas = [...stockDiario];
        nuevaFilas[index][campo] = valor;
        setStockDiario(nuevaFilas);
    };

    const eliminarFila = (index) => {
        const nuevaFilas = stockDiario.filter((_, i) => i !== index);
        setStockDiario(nuevaFilas);
    };

    const handleGuardar = async () => {

        if (stockDiario.length === 0) {
            setError('Cargá al menos un producto para abrir la planilla.');
            return;
        }
        for (let i = 0; i < stockDiario.length; i++) {
            const fila = stockDiario[i];
            const numeroFila = i + 1;

            if (!fila.id_producto || fila.id_producto === '') {
                setError(`Faltó seleccionar un producto en la fila ${numeroFila}.`);
                return;
            }
            const cantidad = parseFloat(fila.stock); //parseFloat porque el stock admite fracciones (steps de 0.5)
            if (!fila.stock || isNaN(cantidad) || cantidad < 1) {
                setError(`La cantidad debe ser al menos 1 en la fila ${numeroFila}.`);
                return;
            }
        }

        setError('');
        setGuardando(true);
        try {
            console.log('Guardando planilla...', stockDiario);

            const planillaDTO = {
                stockProductos: stockDiario.map(fila => ({
                    id_producto: parseInt(fila.id_producto),
                    stock: parseFloat(fila.stock)
                }))
            };

            console.log("Enviando: ", planillaDTO);
            const respuesta = await fetch('http://localhost:8080/api/planilla/new', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(planillaDTO)
            });

            if (respuesta.ok) {
                const planillaCreada = await respuesta.json();
                console.log('Planilla abierta con exito: ', planillaCreada);

                cerrarModal();
                onPlanillaCreada(planillaCreada);

            } else {
                const mensajeError = await respuesta.text();
                setError(mensajeError ? mensajeError : 'Error en el servidor al intentar abrir la planilla.');
            }
        } catch (err) {
            console.log(err);
            setError('Error al intentar conectar con el servidor.')
        } finally {
            setGuardando(false);
        }

    };

    const idsEnUso = stockDiario.map(fila => String(fila.id_producto)).filter(id => id !== '');

    const catalogoOrdenado = [...productosDB].sort((a, b) => a.nombre.localeCompare(b.nombre));

    return(
        <div className="modal-overlay">
            <div className="modal-contenido" style={{ width: '95%', maxWidth: '600px', maxHeight: '90vh', height: '95%' }}>

                <div className="modal-header">
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><HiOutlineDocumentText /> Abrir Nueva Planilla</h3>
                    <button className="btn-cerrar-modal" onClick={cerrarModal}>X</button>
                </div>

                <div className="modal-body" style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>

                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
                        Cargá el inventario inicial de cada producto para el día de hoy.
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
                        {stockDiario.map((fila, index) => (
                            <div key={fila.id_fila} style={{ display: 'flex', gap: '10px', alignItems: 'center', backgroundColor: 'var(--surface-2)', padding: '10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>

                                <SelectPersonalizado
                                    style={{ flex: 2 }}
                                    value={fila.id_producto}
                                    onChange={(e) => actualizarFila(index, 'id_producto', e.target.value)}
                                    placeholder="Seleccionar producto"
                                    opciones={catalogoOrdenado
                                        .filter(prod => {
                                            const idProdString = String(prod.id);
                                            const estaEnUso = idsEnUso.includes(idProdString);
                                            const esMiSeleccion = String(fila.id_producto) === idProdString;
                                            return !estaEnUso || esMiSeleccion;
                                        })
                                        .map(prod => ({ value: prod.id, label: prod.nombre }))}
                                    capitalizarOpciones
                                />

                                <InputNumero
                                    min="1"
                                    step="0.5"
                                    placeholder="0"
                                    value={fila.stock}
                                    onChange={(e) => actualizarFila(index, 'stock', e.target.value)}
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
                    <button className="btn-global btn-secundario" onClick={cerrarModal} disabled={guardando}>Cancelar</button>
                    <button className="btn-global btn-primario-green" onClick={handleGuardar} disabled={guardando}>
                        {guardando ? 'Abriendo...' : 'Abrir Planilla'}
                    </button>
                </div>

            </div>
        </div>
    );
}

export default ModalAbrirPlanilla;

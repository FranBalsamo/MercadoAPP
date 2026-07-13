import { useState } from "react";
import { HiOutlineTicket } from 'react-icons/hi2';
import "../Estilos/Botones.css";
import AlertaEmergente from "../Alertas/AlertaEmergente";

function ListaBoletas({ abrirModalBoleta, abrirModalModificarBoleta, eliminarBoleta ,boletas = [], clientes = [] }) {
    const [error, setError] = useState('');
    const [busqueda, setBusqueda] = useState('');
    const [mensajeAlerta, setMensajeAlerta] = useState(null);
    const [configOrden, setConfigOrden] = useState({ columna: null, direccion: 'asc' });

    const nombreCliente = (id_cliente) => {
        const clienteEncontrado = clientes.find(cliente => cliente.id === id_cliente);
        if (!clienteEncontrado) return '-';
        return clienteEncontrado.nombre;
    }

    const formaPagoLegible = (formaPago) => {
        const nombres = {
            EFECTIVO: 'Efectivo',
            MERCADO_PAGO: 'Mercado Pago',
            TRANSFERENCIA_BANCARIA: 'Transferencia Bancaria',
            OTROS: 'Otros',
        };
        return nombres[formaPago] || '-';
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

            if (configOrden.columna === 'entrega') {
                const pesoA = a.estadoEntrega === 'ENTREGADO' ? 1 : 0;
                const pesoB = b.estadoEntrega === 'ENTREGADO' ? 1 : 0;
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

    const intentarEliminar = (boleta) => {
        const estaPagada = boleta.estadoPago === 'PAGADO';
        const estaEntregada = boleta.estadoEntrega === 'ENTREGADO';

        if (estaPagada || estaEntregada) {
            const motivos = [];
            if (estaPagada) motivos.push('Pagada');
            if (estaEntregada) motivos.push('Entregada');

            setMensajeAlerta(`La boleta #${boleta.id} no puede ser eliminada porque está ${motivos.join(' y ')}.`);
            return;
        }

        eliminarBoleta(boleta);
    };

    return (
        <div style={{ flex: 3, backgroundColor: 'var(--surface)', border: '1px solid var(--border)', padding: '20px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px', marginBottom: '10px' }}>
                <input
                    type="text"
                    placeholder="Filtrar boletas por nombre..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '5px 10px', width: '50%', outline: 'none', backgroundColor: 'var(--surface)', color: 'var(--text-primary)' }}
                />
                <h3 style={{ color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>Boletas Cargadas <HiOutlineTicket /></h3>
            </div>

            {/* ZONA DE LA TABLA */}
            <div style={{ flexGrow: 1, overflowY: 'auto', marginBottom: '20px', paddingRight: '5px' }}>

                {boletasProcesadas.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', marginTop: '50px' }}>
                        {boletas.length === 0
                            ? "Aún no hay boletas cargadas en esta caja..."
                            : "No se encontró ninguna boleta para ese cliente."}
                    </p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
                        <thead style={{ backgroundColor: 'var(--surface-inverse)', position: 'sticky', top: 0 }}>
                            <tr style={{ color: 'var(--text-on-inverse)' }}>
                                <th
                                    onClick={() => solicitarOrden('nombre')}
                                    style={{ padding: '12px', cursor: 'pointer', userSelect: 'none' }}
                                    title="Ordenar por Cliente"
                                >
                                    Cliente {obtenerIconoOrden('nombre')}
                                </th>
                                <th
                                    onClick={() => solicitarOrden('pago')}
                                    style={{ padding: '12px', cursor: 'pointer', userSelect: 'none' }}
                                    title="Ordenar por Estado de Pago"
                                >
                                    Pago {obtenerIconoOrden('pago')}
                                </th>
                                <th
                                    onClick={() => solicitarOrden('entrega')}
                                    style={{ padding: '12px', cursor: 'pointer', userSelect: 'none' }}
                                    title="Ordenar por Estado de Entrega"
                                >
                                    Entrega {obtenerIconoOrden('entrega')}
                                </th>
                                <th style={{ padding: '12px' }}>Forma de Pago</th>
                                <th style={{ padding: '12px' }}>Total</th>
                                <th style={{ padding: '12px', textAlign: 'center' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {boletasProcesadas.map((boleta, index) => (
                                <tr key={boleta.id || index} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
                                    <td style={{ padding: '12px', fontWeight: 'bold', textTransform: 'capitalize', color: 'var(--text-primary)' }}>
                                        {nombreCliente(boleta.id_cliente)}
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <span style={{
                                            padding: '4px 8px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 'bold',
                                            backgroundColor: boleta.estadoPago === 'PAGADO' ? 'var(--success-soft)' : 'var(--danger-soft)',
                                            color: boleta.estadoPago === 'PAGADO' ? 'var(--success-soft-text)' : 'var(--danger-soft-text)'
                                        }}>
                                            {boleta.estadoPago}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <span style={{
                                            padding: '4px 8px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 'bold',
                                            backgroundColor: boleta.estadoEntrega === 'ENTREGADO' ? 'var(--info-soft)' : 'var(--danger-soft)',
                                            color: boleta.estadoEntrega === 'ENTREGADO' ? 'var(--info-soft-text)' : 'var(--danger-soft-text)'
                                        }}>
                                            {boleta.estadoEntrega}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                                        {boleta.estadoPago === 'NO_PAGADO' ? '-' : formaPagoLegible(boleta.formaPago)}
                                    </td>
                                    <td style={{ padding: '12px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                        {boleta.total.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                                    </td>
                                    <td style={{ padding: '12px', textAlign: 'center', display: 'flex', gap: '15px', justifyContent: 'center', alignItems: 'center' }}>
                                        <button
                                            className='btn-global btn-primario'
                                            onClick={() => abrirModalModificarBoleta(boleta, nombreCliente(boleta.id_cliente))}
                                            style={{
                                                fontSize:'0.9rem', padding: '4px 8px',
                                            }}
                                            title="Modificar Boleta"
                                        >
                                            Modificar
                                        </button>
                                        <button
                                            className='btn-eliminar-fila'
                                            onClick={() => intentarEliminar(boleta)}
                                            style={{ width: '25px', height: '25px',padding:'4px 8px',fontSize: '1.2rem',fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
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

            <div style={{ paddingTop: '20px', borderTop: '1px dashed var(--border)', display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end' }}>
                <button
                    className='btn-global btn-primario'
                    onClick={abrirModalBoleta}
                    style={{ padding: '10px 20px', fontSize: '1.1rem' }}
                >
                    + Cargar Nueva Boleta
                </button>
            </div>

            <AlertaEmergente 
                mensaje={mensajeAlerta} 
                onClose={() => setMensajeAlerta(null)} 
            />
        </div>
    );
}

export default ListaBoletas;
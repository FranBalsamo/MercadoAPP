import '../Estilos/Formularios.css';

const OPCIONES_PAGO = [
    { value: 'NO_PAGADO', label: 'No Pagado', color: 'var(--danger)' },
    { value: 'PAGADO', label: 'Pagado', color: 'var(--success)' },
];

// Selector deslizante de 2 estados para estadoPago, con el mismo lenguaje visual que
// SelectorEstadoEntrega (ver ese componente): reemplaza el checkbox "Pagado" suelto.
function SelectorEstadoPago({ value, onChange }) {
    const indiceActivo = Math.max(0, OPCIONES_PAGO.findIndex((o) => o.value === value));
    const colorActivo = OPCIONES_PAGO[indiceActivo].color;

    return (
        <div
            className="segmented-entrega"
            style={{ '--segmented-indice': indiceActivo, '--segmented-color': colorActivo, '--segmented-columnas': 2 }}
        >
            <div className="segmented-entrega-fondo" />
            {OPCIONES_PAGO.map((opcion) => (
                <button
                    key={opcion.value}
                    type="button"
                    className={`segmented-entrega-opcion ${value === opcion.value ? 'activa' : ''}`}
                    onClick={() => onChange(opcion.value)}
                >
                    {opcion.label}
                </button>
            ))}
        </div>
    );
}

export default SelectorEstadoPago;

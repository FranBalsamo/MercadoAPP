import '../Estilos/Formularios.css';

const OPCIONES_ENTREGA = [
    { value: 'NO_ENTREGADO', label: 'No Entregado', color: 'var(--danger)' },
    { value: 'PARCIAL', label: 'Entrega Parcial', color: 'var(--warning)' },
    { value: 'ENTREGADO', label: 'Entregado', color: 'var(--success)' },
];

// Selector deslizante de 3 estados para estadoEntrega: el fondo se desplaza a la opcion
// elegida y toma el color semantico que le corresponde (rojo/amarillo/verde), en vez de
// mostrar 3 radio buttons sueltos.
function SelectorEstadoEntrega({ value, onChange, deshabilitarParcial = false }) {
    const indiceActivo = Math.max(0, OPCIONES_ENTREGA.findIndex((o) => o.value === value));
    const colorActivo = OPCIONES_ENTREGA[indiceActivo].color;

    return (
        <div
            className="segmented-entrega"
            style={{ '--segmented-indice': indiceActivo, '--segmented-color': colorActivo }}
        >
            <div className="segmented-entrega-fondo" />
            {OPCIONES_ENTREGA.map((opcion) => (
                <button
                    key={opcion.value}
                    type="button"
                    className={`segmented-entrega-opcion ${value === opcion.value ? 'activa' : ''}`}
                    onClick={() => onChange(opcion.value)}
                    disabled={opcion.value === 'PARCIAL' && deshabilitarParcial}
                >
                    {opcion.label}
                </button>
            ))}
        </div>
    );
}

export default SelectorEstadoEntrega;

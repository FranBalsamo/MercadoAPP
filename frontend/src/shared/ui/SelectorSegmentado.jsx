import '../styles/Formularios.css';

// Selector deslizante generico con el mismo lenguaje visual que SelectorEstadoEntrega/
// SelectorEstadoPago, pero sin colores semanticos fijos (usa el color de acento por
// defecto): para elecciones simples de pocas opciones donde no tiene sentido un select
// buscable (ej. Tipo de Documento, Tipo de Cliente). 'opciones' es un array de
// { value, label, disabled? }.
function SelectorSegmentado({ value, onChange, opciones, color = 'var(--accent)' }) {
    const indiceActivo = Math.max(0, opciones.findIndex((o) => o.value === value));

    return (
        <div
            className="segmented-entrega"
            style={{ '--segmented-indice': indiceActivo, '--segmented-color': color, '--segmented-columnas': opciones.length }}
        >
            <div className="segmented-entrega-fondo" />
            {opciones.map((opcion) => (
                <button
                    key={opcion.value}
                    type="button"
                    className={`segmented-entrega-opcion ${value === opcion.value ? 'activa' : ''}`}
                    onClick={() => onChange(opcion.value)}
                    disabled={opcion.disabled}
                >
                    {opcion.label}
                </button>
            ))}
        </div>
    );
}

export default SelectorSegmentado;

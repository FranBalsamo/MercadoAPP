import { useState } from 'react';
import { HiOutlineTrash } from 'react-icons/hi2';

function CampoDirecciones({ direcciones, onChange, multiple }) {
    const [nuevaDireccion, setNuevaDireccion] = useState('');

    if (!multiple) {
        return (
            <input
                type="text"
                placeholder="Opcional"
                value={direcciones[0] || ''}
                onChange={(e) => onChange(e.target.value ? [e.target.value] : [])}
            />
        );
    }

    const agregarDireccion = () => {
        if (!nuevaDireccion.trim()) return;
        onChange([...direcciones, nuevaDireccion.trim()]);
        setNuevaDireccion('');
    };

    const quitarDireccion = (indice) => {
        onChange(direcciones.filter((_, i) => i !== indice));
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
                <input
                    type="text"
                    placeholder="Nueva sucursal..."
                    value={nuevaDireccion}
                    onChange={(e) => setNuevaDireccion(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            agregarDireccion();
                        }
                    }}
                    style={{ flex: 1 }}
                />
                <button type="button" className="btn-global btn-primario" onClick={agregarDireccion} style={{ padding: '8px 14px' }}>
                    + Agregar
                </button>
            </div>

            {direcciones.length > 0 && (
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {direcciones.map((direccion, indice) => (
                        <li
                            key={indice}
                            style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '6px 10px'
                            }}
                        >
                            <span style={{ textTransform: 'capitalize' }}>{direccion}</span>
                            <button
                                type="button"
                                className="btn-eliminar-fila"
                                onClick={() => quitarDireccion(indice)}
                                title="Eliminar dirección"
                                style={{ padding: '2px 8px' }}
                            >
                                <HiOutlineTrash />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default CampoDirecciones;

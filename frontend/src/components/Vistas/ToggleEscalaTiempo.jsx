function ToggleEscalaTiempo({ escala, onCambiar }) {
    const estiloBoton = (activo) => ({
        padding: '6px 14px', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold',
        backgroundColor: activo ? 'var(--accent)' : 'var(--surface)',
        color: activo ? 'var(--text-on-accent)' : 'var(--text-primary)'
    });

    return (
        <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
            <button onClick={() => onCambiar('semana')} style={estiloBoton(escala === 'semana')}>
                Semana
            </button>
            <button onClick={() => onCambiar('mes')} style={estiloBoton(escala === 'mes')}>
                Mes
            </button>
        </div>
    );
}

export default ToggleEscalaTiempo;

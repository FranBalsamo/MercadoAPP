function ToggleEscalaTiempo({ escala, onCambiar }) {
    const estiloBoton = (activo) => ({
        padding: '6px 14px', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold',
        backgroundColor: activo ? '#3498db' : 'white',
        color: activo ? 'white' : '#2c3e50'
    });

    return (
        <div style={{ display: 'flex', border: '1px solid #ddd', borderRadius: '6px', overflow: 'hidden' }}>
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

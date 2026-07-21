import iconoApp from '@/assets/icono-app.png';

function PantallaCarga({ tardandoMucho }) {
    return (
        <div style={{
            width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: '16px', backgroundColor: 'var(--bg)'
        }}>
            <img src={iconoApp} alt="MercadoApp" style={{ width: '64px', height: '64px', borderRadius: 'var(--radius-lg)' }} />
            <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>MercadoApp</h2>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Iniciando...</p>
            {tardandoMucho && (
                <p style={{ margin: '8px 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '320px', textAlign: 'center' }}>
                    Está tardando más de lo normal. Si es la primera vez que abrís la app, puede llevar un poco más de tiempo.
                </p>
            )}
        </div>
    );
}

export default PantallaCarga;

import { HiOutlineExclamationTriangle } from 'react-icons/hi2';

// Estilo unico de mensaje de error para toda la app (antes convivian variantes sueltas:
// texto plano sin caja, caja sin icono, icono sin caja...). Con esto, cualquier cambio de
// estilo futuro se hace en un solo lugar.
function MensajeError({ mensaje }) {
    if (!mensaje) return null;

    return (
        <p style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            color: 'var(--danger-soft-text)', fontWeight: 'bold', margin: 0,
            padding: '10px 15px', backgroundColor: 'var(--danger-soft)', borderRadius: 'var(--radius-md)',
            fontSize: '0.9rem'
        }}>
            <HiOutlineExclamationTriangle style={{ flexShrink: 0 }} />
            {mensaje}
        </p>
    );
}

export default MensajeError;

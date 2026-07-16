import { useState } from 'react';
import TabEmpresa from './TabEmpresa';
import TabBaseDeDatos from './TabBaseDeDatos';
import TabBackup from './TabBackup';
import { HiOutlineCog6Tooth, HiOutlineBuildingOffice2, HiOutlineCircleStack, HiOutlineShieldExclamation } from 'react-icons/hi2';
import '../Estilos/Botones.css';

const PESTANIAS = [
    { id: 'empresa', etiqueta: 'Empresa', icono: HiOutlineBuildingOffice2 },
    { id: 'baseDeDatos', etiqueta: 'Base de Datos', icono: HiOutlineCircleStack },
    { id: 'backup', etiqueta: 'Backup', icono: HiOutlineShieldExclamation },
];

function VistaConfiguracion() {
    const [pestaniaActiva, setPestaniaActiva] = useState('empresa');

    return (
        <main style={{ padding: '20px', backgroundColor: 'var(--bg)', minHeight: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', padding: '15px 20px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
                <h2 style={{ margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}><HiOutlineCog6Tooth /> Configuración</h2>
            </div>

            <div style={{ display: 'flex', gap: '10px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', padding: '10px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
                {PESTANIAS.map(p => (
                    <button
                        key={p.id}
                        onClick={() => setPestaniaActiva(p.id)}
                        style={{
                            padding: '10px 20px', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                            fontSize: '0.95rem', fontWeight: 'bold',
                            display: 'flex', alignItems: 'center', gap: '8px',
                            backgroundColor: pestaniaActiva === p.id ? 'var(--surface-inverse)' : 'transparent',
                            color: pestaniaActiva === p.id ? 'var(--text-on-inverse)' : 'var(--text-primary)'
                        }}
                    >
                        <p.icono /> {p.etiqueta}
                    </button>
                ))}
            </div>

            <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', padding: '20px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
                {pestaniaActiva === 'empresa' && <TabEmpresa />}
                {pestaniaActiva === 'baseDeDatos' && <TabBaseDeDatos />}
                {pestaniaActiva === 'backup' && <TabBackup />}
            </div>

        </main>
    );
}

export default VistaConfiguracion;

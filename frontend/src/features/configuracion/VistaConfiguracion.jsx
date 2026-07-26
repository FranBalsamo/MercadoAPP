import { useLayoutEffect, useRef, useState } from 'react';
import TabEmpresa from './TabEmpresa';
import TabBaseDeDatos from './TabBaseDeDatos';
import TabBackup from './TabBackup';
import TabActualizaciones from './TabActualizaciones';
import { HiOutlineCog6Tooth, HiOutlineBuildingOffice2, HiOutlineCircleStack, HiOutlineShieldExclamation, HiOutlineArrowPath } from 'react-icons/hi2';
import '@/shared/styles/Botones.css';

const PESTANIAS = [
    { id: 'empresa', etiqueta: 'Empresa', icono: HiOutlineBuildingOffice2 },
    { id: 'baseDeDatos', etiqueta: 'Base de Datos', icono: HiOutlineCircleStack },
    { id: 'backup', etiqueta: 'Backup', icono: HiOutlineShieldExclamation },
    { id: 'actualizaciones', etiqueta: 'Actualizaciones', icono: HiOutlineArrowPath },
];

function VistaConfiguracion({
    pestaniaInicial = 'empresa',
    versionApp,
    updateDisponible,
    buscandoActualizacion,
    yaSeRevisoActualizacion,
    erroActualizacion,
    buscarActualizaciones,
    instalandoActualizacion,
    progresoInstalacion,
    instalarActualizacion,
}) {
    const [pestaniaActiva, setPestaniaActiva] = useState(pestaniaInicial);
    const botonesRef = useRef({});
    const [indicador, setIndicador] = useState({ left: 0, width: 0, listo: false });

    // Mide la posicion/ancho real del boton activo (no son todos del mismo ancho: el
    // texto de cada pestania es distinto) para poder deslizar el fondo resaltado hasta
    // ahi con una transicion CSS, en vez de que cambie de golpe.
    useLayoutEffect(() => {
        const medir = () => {
            const boton = botonesRef.current[pestaniaActiva];
            if (boton) {
                setIndicador({ left: boton.offsetLeft, width: boton.offsetWidth, listo: true });
            }
        };
        medir();
        window.addEventListener('resize', medir);
        return () => window.removeEventListener('resize', medir);
    }, [pestaniaActiva]);

    return (
        <main style={{ padding: '20px', backgroundColor: 'var(--bg)', minHeight: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', padding: '15px 20px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
                <h2 style={{ margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}><HiOutlineCog6Tooth /> Configuración</h2>
            </div>

            <div style={{ position: 'relative', display: 'flex', gap: '10px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', padding: '10px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{
                    position: 'absolute',
                    top: '10px',
                    bottom: '10px',
                    left: indicador.left,
                    width: indicador.width,
                    backgroundColor: 'var(--surface-inverse)',
                    borderRadius: 'var(--radius-sm)',
                    transition: indicador.listo ? 'left 0.25s cubic-bezier(0.4, 0, 0.2, 1), width 0.25s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
                }} />
                {PESTANIAS.map(p => (
                    <button
                        key={p.id}
                        ref={(el) => { botonesRef.current[p.id] = el; }}
                        onClick={() => setPestaniaActiva(p.id)}
                        style={{
                            position: 'relative',
                            padding: '10px 20px', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                            fontSize: '0.95rem', fontWeight: 'bold',
                            display: 'flex', alignItems: 'center', gap: '8px',
                            backgroundColor: 'transparent',
                            color: pestaniaActiva === p.id ? 'var(--text-on-inverse)' : 'var(--text-primary)',
                            transition: 'color 0.2s ease',
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
                {pestaniaActiva === 'actualizaciones' && <TabActualizaciones
                    versionApp={versionApp}
                    updateDisponible={updateDisponible}
                    buscandoActualizacion={buscandoActualizacion}
                    yaSeRevisoActualizacion={yaSeRevisoActualizacion}
                    erroActualizacion={erroActualizacion}
                    buscarActualizaciones={buscarActualizaciones}
                    instalandoActualizacion={instalandoActualizacion}
                    progresoInstalacion={progresoInstalacion}
                    instalarActualizacion={instalarActualizacion}
                />}
            </div>

        </main>
    );
}

export default VistaConfiguracion;

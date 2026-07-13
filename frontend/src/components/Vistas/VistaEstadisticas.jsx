import { useState } from 'react';
import GraficoProductosVendidos from './GraficoProductosVendidos';
import ProductosStockCritico from './ProductosStockCritico';
import GraficoFormaPago from './GraficoFormaPago';
import ComparativaMensual from './ComparativaMensual';
import TicketPromedio from './TicketPromedio';
import { HiOutlineChartBar, HiOutlineBanknotes, HiOutlineCube } from 'react-icons/hi2';
import '../Estilos/Botones.css';

const PESTANIAS = [
    { id: 'ventas', etiqueta: 'Ventas', icono: HiOutlineBanknotes },
    { id: 'productos', etiqueta: 'Productos', icono: HiOutlineCube },
];

function VistaEstadisticas({ volver }) {
    const [pestaniaActiva, setPestaniaActiva] = useState('ventas');

    const panelStyle = {
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        padding: '20px',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column'
    };

    return (
        <main style={{ padding: '20px', backgroundColor: 'var(--bg)', minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: '20px' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', padding: '15px 20px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
                <h2 style={{ margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}><HiOutlineChartBar /> Estadísticas</h2>
                <button className="btn-global btn-secundario" onClick={volver} style={{ fontSize: '1rem' }}>
                    ← Volver al Inicio
                </button>
            </div>

            {/* PESTAÑAS */}
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

            {/* Cada estadística nueva va en su propio panel dentro de la pestaña que corresponda */}
            {pestaniaActiva === 'ventas' && (
                <>
                    <div style={panelStyle}>
                        <ComparativaMensual />
                    </div>
                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                        <div style={{ ...panelStyle, flex: 1, minWidth: '320px' }}>
                            <GraficoFormaPago />
                        </div>
                        <div style={{ ...panelStyle, flex: 1, minWidth: '320px' }}>
                            <TicketPromedio />
                        </div>
                    </div>
                </>
            )}

            {pestaniaActiva === 'productos' && (
                <>
                    <div style={panelStyle}>
                        <GraficoProductosVendidos alturaBarras={240} />
                    </div>
                    <div style={panelStyle}>
                        <ProductosStockCritico limite={10} />
                    </div>
                </>
            )}

        </main>
    );
}

export default VistaEstadisticas;

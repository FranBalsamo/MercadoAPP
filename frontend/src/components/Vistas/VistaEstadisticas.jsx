import { useState } from 'react';
import GraficoProductosVendidos from './GraficoProductosVendidos';
import ProductosStockCritico from './ProductosStockCritico';
import GraficoFormaPago from './GraficoFormaPago';
import ComparativaMensual from './ComparativaMensual';
import TicketPromedio from './TicketPromedio';
import '../Estilos/Botones.css';

const PESTANIAS = [
    { id: 'ventas', etiqueta: '💰 Ventas' },
    { id: 'productos', etiqueta: '📦 Productos' },
];

function VistaEstadisticas({ volver }) {
    const [pestaniaActiva, setPestaniaActiva] = useState('ventas');

    const panelStyle = {
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column'
    };

    return (
        <main style={{ padding: '20px', backgroundColor: '#f4f6f8', minHeight: 'calc(100vh - 70px)', display: 'flex', flexDirection: 'column', gap: '20px' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '15px 20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <h2 style={{ margin: 0, color: '#2c3e50' }}>📊 Estadísticas</h2>
                <button className="btn-global btn-secundario" onClick={volver} style={{ fontSize: '1rem' }}>
                    ← Volver al Inicio
                </button>
            </div>

            {/* PESTAÑAS */}
            <div style={{ display: 'flex', gap: '10px', backgroundColor: 'white', padding: '10px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                {PESTANIAS.map(p => (
                    <button
                        key={p.id}
                        onClick={() => setPestaniaActiva(p.id)}
                        style={{
                            padding: '10px 20px', border: 'none', borderRadius: '6px', cursor: 'pointer',
                            fontSize: '0.95rem', fontWeight: 'bold',
                            backgroundColor: pestaniaActiva === p.id ? '#2c3e50' : 'transparent',
                            color: pestaniaActiva === p.id ? 'white' : '#2c3e50'
                        }}
                    >
                        {p.etiqueta}
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

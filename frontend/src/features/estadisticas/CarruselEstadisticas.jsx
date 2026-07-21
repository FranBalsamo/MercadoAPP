import { useState } from 'react';
import GraficoProductosVendidos from './GraficoProductosVendidos';
import GraficoFormaPago from './GraficoFormaPago';
import TicketPromedio from './TicketPromedio';
import ComparativaMensual from './ComparativaMensual';
import ProductosStockCritico from './ProductosStockCritico';
import '@/shared/styles/Botones.css';

const ESTADISTICAS = [
    { id: 'productos-vendidos', render: () => <GraficoProductosVendidos limite={6} alturaBarras={110} ajustarAlAncho={true} /> },
    { id: 'forma-pago', render: () => <GraficoFormaPago diametroTorta={110} /> },
    { id: 'ticket-promedio', render: () => <TicketPromedio /> },
    { id: 'comparativa-mensual', render: () => <ComparativaMensual /> },
    { id: 'stock-critico', render: () => <ProductosStockCritico limite={6} /> },
];

function CarruselEstadisticas() {
    const [indice, setIndice] = useState(0);
    // Solo montamos (y por lo tanto solo pedimos datos de) la estadística que ya se visitó al menos una vez,
    // para no disparar los fetch de las 5 estadísticas apenas se carga Inicio.
    const [visitadas, setVisitadas] = useState(() => new Set([0]));
    const cantidad = ESTADISTICAS.length;

    const irA = (nuevoIndice) => {
        setIndice(nuevoIndice);
        setVisitadas(prev => (prev.has(nuevoIndice) ? prev : new Set(prev).add(nuevoIndice)));
    };

    const irAnterior = () => irA((indice - 1 + cantidad) % cantidad);
    const irSiguiente = () => irA((indice + 1) % cantidad);

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button className="btn-flecha-carrusel" onClick={irAnterior} aria-label="Estadística anterior">◀</button>

                <div style={{ flexGrow: 1, overflow: 'hidden' }}>
                    <div style={{
                        display: 'flex',
                        width: `${cantidad * 100}%`,
                        transform: `translateX(-${indice * (100 / cantidad)}%)`,
                        transition: 'transform 0.35s ease'
                    }}>
                        {ESTADISTICAS.map((estadistica, i) => (
                            <div key={estadistica.id} style={{ width: `${100 / cantidad}%`, flexShrink: 0, padding: '0 8px' }}>
                                {visitadas.has(i) ? estadistica.render() : null}
                            </div>
                        ))}
                    </div>
                </div>

                <button className="btn-flecha-carrusel" onClick={irSiguiente} aria-label="Siguiente estadística">▶</button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '15px' }}>
                {ESTADISTICAS.map((estadistica, i) => (
                    <span
                        key={estadistica.id}
                        onClick={() => irA(i)}
                        style={{
                            width: i === indice ? '22px' : '8px', height: '8px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                            backgroundColor: i === indice ? 'var(--accent)' : 'var(--border-strong)',
                            transition: 'width 0.2s ease, background-color 0.2s ease'
                        }}
                    />
                ))}
            </div>
        </div>
    );
}

export default CarruselEstadisticas;

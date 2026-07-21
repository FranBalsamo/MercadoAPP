import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { HiOutlineCalendarDays, HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi2';
import { formatearFechaLocal } from '@/shared/utils/rangoFechas';
import { formatearFechaVisual } from '@/shared/utils/formatoFecha';
import './SelectorFecha.css';

const DIAS_SEMANA = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

// Lunes = 0 ... Domingo = 6 (getDay() nativo empieza en domingo = 0).
const offsetSemanaLunes = (fecha) => (fecha.getDay() + 6) % 7;

// Genera una grilla de 42 dias (6 semanas) que cubre el mes pedido, con dias de relleno
// de los meses vecinos para completar las semanas.
const generarGrilla = (anio, mes) => {
    const primerDiaMes = new Date(anio, mes, 1);
    const inicioGrilla = new Date(anio, mes, 1 - offsetSemanaLunes(primerDiaMes));
    return Array.from({ length: 42 }, (_, i) => {
        const dia = new Date(inicioGrilla);
        dia.setDate(inicioGrilla.getDate() + i);
        return dia;
    });
};

const restarDias = (fecha, cantidad) => {
    const copia = new Date(fecha);
    copia.setDate(copia.getDate() - cantidad);
    return copia;
};

// Selector de rango de fechas con calendario propio (campo + popover), en vez de los
// inputs nativos type="date" (cuyo picker es del sistema operativo y no se puede
// personalizar). Selecciona con 2 clicks: el primero fija el inicio del rango, el
// segundo fija el fin (si nunca se hace el segundo click, queda un unico dia — la
// busqueda "por un dia puntual" pedida). La seleccion queda en un estado temporal
// (no se avisa al padre via onCambiar) para que el usuario pueda ver bien el rango
// elegido antes de aplicarlo con el boton "Confirmar".
function SelectorFecha({ desde, hasta, onCambiar, placeholder = 'Seleccionar fechas', style }) {
    const [abierto, setAbierto] = useState(false);
    const [posicion, setPosicion] = useState(null);
    const [mesVisible, setMesVisible] = useState(() => {
        const base = desde ? new Date(`${desde}T00:00:00`) : new Date();
        return { anio: base.getFullYear(), mes: base.getMonth() };
    });
    const [seleccionEnCurso, setSeleccionEnCurso] = useState(null);
    const [tempDesde, setTempDesde] = useState(desde);
    const [tempHasta, setTempHasta] = useState(hasta);

    const disparadorRef = useRef(null);
    const popoverRef = useRef(null);

    const MARGEN = 6;
    const ALTURA_ESTIMADA = 420;

    const calcularPosicion = () => {
        if (!disparadorRef.current) return;
        const rect = disparadorRef.current.getBoundingClientRect();
        const espacioAbajo = window.innerHeight - rect.bottom - MARGEN;
        const espacioArriba = rect.top - MARGEN;
        const haciaArriba = espacioAbajo < ALTURA_ESTIMADA && espacioArriba > espacioAbajo;

        setPosicion({
            left: rect.left,
            top: haciaArriba ? undefined : rect.bottom + MARGEN,
            bottom: haciaArriba ? window.innerHeight - rect.top + MARGEN : undefined,
            haciaArriba,
        });
    };

    const abrir = () => {
        const base = desde ? new Date(`${desde}T00:00:00`) : new Date();
        setMesVisible({ anio: base.getFullYear(), mes: base.getMonth() });
        setSeleccionEnCurso(null);
        setTempDesde(desde);
        setTempHasta(hasta);
        calcularPosicion();
        setAbierto(true);
    };

    useEffect(() => {
        if (!abierto) return;

        const alClickFuera = (e) => {
            if (
                disparadorRef.current && !disparadorRef.current.contains(e.target) &&
                popoverRef.current && !popoverRef.current.contains(e.target)
            ) {
                setAbierto(false);
            }
        };
        const alEscape = (e) => { if (e.key === 'Escape') setAbierto(false); };
        const alScrollOResize = () => setAbierto(false);

        document.addEventListener('mousedown', alClickFuera);
        document.addEventListener('keydown', alEscape);
        window.addEventListener('scroll', alScrollOResize, true);
        window.addEventListener('resize', alScrollOResize);
        return () => {
            document.removeEventListener('mousedown', alClickFuera);
            document.removeEventListener('keydown', alEscape);
            window.removeEventListener('scroll', alScrollOResize, true);
            window.removeEventListener('resize', alScrollOResize);
        };
    }, [abierto]);

    const grilla = useMemo(() => generarGrilla(mesVisible.anio, mesVisible.mes), [mesVisible]);
    const hoyISO = useMemo(() => formatearFechaLocal(new Date()), []);

    const alClickDia = (iso) => {
        if (!seleccionEnCurso) {
            // Primer click: fija el inicio (rango de un solo dia por ahora).
            setTempDesde(iso);
            setTempHasta(iso);
            setSeleccionEnCurso(iso);
            return;
        }
        // Segundo click: completa el rango (invirtiendo si el segundo dia es anterior al primero).
        const nuevoDesde = iso < seleccionEnCurso ? iso : seleccionEnCurso;
        const nuevoHasta = iso < seleccionEnCurso ? seleccionEnCurso : iso;
        setTempDesde(nuevoDesde);
        setTempHasta(nuevoHasta);
        setSeleccionEnCurso(null);
    };

    const aplicarPreset = (calcular) => {
        const { desde: d, hasta: h } = calcular();
        setTempDesde(d);
        setTempHasta(h);
        setSeleccionEnCurso(null);
    };

    const limpiar = () => {
        setTempDesde('');
        setTempHasta('');
        setSeleccionEnCurso(null);
    };

    const confirmar = () => {
        onCambiar({ desde: tempDesde, hasta: tempHasta });
        setAbierto(false);
    };

    const cambiarMes = (delta) => {
        setMesVisible((prev) => {
            const fecha = new Date(prev.anio, prev.mes + delta, 1);
            return { anio: fecha.getFullYear(), mes: fecha.getMonth() };
        });
    };

    const etiqueta = desde && hasta
        ? (desde === hasta ? formatearFechaVisual(desde) : `${formatearFechaVisual(desde)} – ${formatearFechaVisual(hasta)}`)
        : placeholder;

    const PRESETS = [
        { label: 'Hoy', calcular: () => ({ desde: hoyISO, hasta: hoyISO }) },
        { label: 'Últimos 7 días', calcular: () => ({ desde: formatearFechaLocal(restarDias(new Date(), 6)), hasta: hoyISO }) },
        { label: 'Últimos 30 días', calcular: () => ({ desde: formatearFechaLocal(restarDias(new Date(), 29)), hasta: hoyISO }) },
        { label: 'Este mes', calcular: () => ({ desde: formatearFechaLocal(new Date(new Date().getFullYear(), new Date().getMonth(), 1)), hasta: hoyISO }) },
    ];

    return (
        <div className="selector-fecha" style={style}>
            <button
                type="button"
                ref={disparadorRef}
                className={`selector-fecha-disparador ${abierto ? 'abierto' : ''}`}
                onClick={() => (abierto ? setAbierto(false) : abrir())}
            >
                <HiOutlineCalendarDays className="selector-fecha-icono" />
                <span className={`selector-fecha-etiqueta ${desde && hasta ? '' : 'selector-fecha-placeholder'}`}>
                    {etiqueta}
                </span>
            </button>

            {abierto && posicion && createPortal(
                <div
                    ref={popoverRef}
                    className={`selector-fecha-popover ${posicion.haciaArriba ? 'hacia-arriba' : ''}`}
                    style={{ top: posicion.top, bottom: posicion.bottom, left: posicion.left }}
                >
                    <div className="selector-fecha-atajos">
                        {PRESETS.map((preset) => (
                            <button
                                key={preset.label}
                                type="button"
                                className="selector-fecha-atajo"
                                onClick={() => aplicarPreset(preset.calcular)}
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>

                    <div className="selector-fecha-panel-derecho">
                        <div className="selector-fecha-calendario">
                            <div className="selector-fecha-nav">
                                <button type="button" className="selector-fecha-nav-boton" onClick={() => cambiarMes(-1)} aria-label="Mes anterior">
                                    <HiOutlineChevronLeft />
                                </button>
                                <span className="selector-fecha-mes-actual">{MESES[mesVisible.mes]} {mesVisible.anio}</span>
                                <button type="button" className="selector-fecha-nav-boton" onClick={() => cambiarMes(1)} aria-label="Mes siguiente">
                                    <HiOutlineChevronRight />
                                </button>
                            </div>

                            <div className="selector-fecha-semana">
                                {DIAS_SEMANA.map((d, i) => <span key={i}>{d}</span>)}
                            </div>

                            <div className="selector-fecha-dias">
                                {grilla.map((fecha) => {
                                    const iso = formatearFechaLocal(fecha);
                                    const fueraDeMes = fecha.getMonth() !== mesVisible.mes;
                                    const esHoy = iso === hoyISO;
                                    const enRango = !!(tempDesde && tempHasta && iso >= tempDesde && iso <= tempHasta);
                                    const esLimite = iso === tempDesde || iso === tempHasta;

                                    return (
                                        <button
                                            key={iso}
                                            type="button"
                                            className={[
                                                'selector-fecha-dia',
                                                fueraDeMes ? 'fuera-de-mes' : '',
                                                esHoy ? 'hoy' : '',
                                                enRango ? 'en-rango' : '',
                                                esLimite ? 'limite' : '',
                                            ].filter(Boolean).join(' ')}
                                            onClick={() => alClickDia(iso)}
                                        >
                                            {fecha.getDate()}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="selector-fecha-footer">
                            <span className="selector-fecha-preview">
                                {tempDesde && tempHasta
                                    ? (tempDesde === tempHasta
                                        ? formatearFechaVisual(tempDesde)
                                        : `${formatearFechaVisual(tempDesde)} – ${formatearFechaVisual(tempHasta)}`)
                                    : 'Sin fechas seleccionadas'}
                            </span>
                            <div className="selector-fecha-footer-botones">
                                <button type="button" className="selector-fecha-limpiar" onClick={limpiar}>Limpiar</button>
                                <button type="button" className="selector-fecha-confirmar" onClick={confirmar}>Confirmar</button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}

export default SelectorFecha;

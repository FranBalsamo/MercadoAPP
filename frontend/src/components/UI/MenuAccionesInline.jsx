import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import '../Estilos/MenuAcciones.css';

// Una celda animada de ancho variable: mide el ancho natural de su botón (no se estira, así
// que su tamaño real no depende de que el contenedor esté colapsado) y anima el ancho del
// wrapper entre 0 y ese valor medido, para poder "revelarlo"/"esconderlo" con una transición
// prolija sin adivinar anchos fijos por etiqueta. Se usa tanto para las acciones como para el
// propio disparador "...", para que TODO colapse/expanda con la misma animación (si el
// disparador se sacara del DOM de golpe en vez de animarlo, la fila daba un salto brusco de
// ancho al abrir/cerrar).
function CeldaAnimada({ visible, children, className = '' }) {
    const botonRef = useRef(null);
    const [anchoNatural, setAnchoNatural] = useState(0);

    useLayoutEffect(() => {
        if (botonRef.current) {
            setAnchoNatural(botonRef.current.getBoundingClientRect().width);
        }
    });

    return (
        <div
            className={`menu-acciones-celda ${visible ? 'abierta' : ''} ${className}`}
            style={{ flexBasis: visible ? anchoNatural : 0 }}
        >
            {typeof children === 'function' ? children(botonRef, visible) : children}
        </div>
    );
}

// Menú de acciones "..." que se abre EN LA MISMA LÍNEA (no como dropdown): las acciones se
// reparten a ambos lados del botón disparador (las primeras a la izquierda, el resto a la
// derecha, preservando el orden de lectura) y se revelan con una animación de ancho hacia
// afuera, como si "salieran" del centro; el disparador se colapsa a la vez para ocupar menos
// espacio mientras está abierto. Pensado como estándar para reemplazar filas de botones
// sueltos en tablas — soporta de 2 a 4 acciones.
// 'acciones' es un array de { label, onClick, variante? } (variante: 'primario' | 'peligro').
// 'mostrarPorHover' (opcional) permite que la fila contenedora controle la apertura al pasar
// el cursor, ademas del click manual sobre el disparador.
function MenuAccionesInline({ acciones, mostrarPorHover = false }) {
    const [abiertoManual, setAbiertoManual] = useState(false);
    const contenedorRef = useRef(null);

    const visible = abiertoManual || mostrarPorHover;

    useEffect(() => {
        if (!visible) return;
        const alClickFuera = (e) => {
            if (contenedorRef.current && !contenedorRef.current.contains(e.target)) {
                setAbiertoManual(false);
            }
        };
        const alEscape = (e) => { if (e.key === 'Escape') setAbiertoManual(false); };
        document.addEventListener('mousedown', alClickFuera);
        document.addEventListener('keydown', alEscape);
        return () => {
            document.removeEventListener('mousedown', alClickFuera);
            document.removeEventListener('keydown', alEscape);
        };
    }, [visible]);

    const ejecutarAccion = (accion) => {
        accion.onClick();
        setAbiertoManual(false);
    };

    const cantidadIzquierda = Math.floor(acciones.length / 2);
    const accionesIzquierda = acciones.slice(0, cantidadIzquierda);
    const accionesDerecha = acciones.slice(cantidadIzquierda);

    const renderizarAccion = (accion, key) => (
        <CeldaAnimada key={key} visible={visible}>
            {(ref) => (
                <button
                    ref={ref}
                    type="button"
                    className={`menu-acciones-boton ${accion.variante || ''}`}
                    onClick={() => ejecutarAccion(accion)}
                    tabIndex={visible ? 0 : -1}
                >
                    {accion.label}
                </button>
            )}
        </CeldaAnimada>
    );

    return (
        <div className="menu-acciones-inline" ref={contenedorRef}>
            {accionesIzquierda.map((accion, i) => renderizarAccion(accion, `i-${i}`))}
            <CeldaAnimada visible={!visible}>
                {(ref) => (
                    <button
                        ref={ref}
                        type="button"
                        className="menu-acciones-trigger"
                        onClick={() => setAbiertoManual(true)}
                        aria-label="Más acciones"
                        title="Más acciones"
                        tabIndex={!visible ? 0 : -1}
                    >
                        •••
                    </button>
                )}
            </CeldaAnimada>
            {accionesDerecha.map((accion, i) => renderizarAccion(accion, `d-${i}`))}
        </div>
    );
}

export default MenuAccionesInline;

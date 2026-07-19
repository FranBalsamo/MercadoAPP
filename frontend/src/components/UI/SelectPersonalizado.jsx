import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { HiOutlineChevronDown } from 'react-icons/hi2';
import '../Estilos/Formularios.css';

// Select con el mismo "contrato" que un <select> nativo (value / onChange(e) con e.target.value),
// para poder reemplazar los <select> existentes sin tocar la lógica que ya los usa.
// 'opciones' es un array de { value, label }.
//
// La lista desplegable se renderiza en un portal a document.body (no como hijo del
// disparador): si se dejara adentro, cualquier ancestro con overflow:hidden (como
// '.modal-contenido', necesario para los bordes redondeados) la recortaría apenas
// el trigger quedara cerca de un borde, como pasa con el select de forma de pago
// dentro del footer del modal de boleta.
function SelectPersonalizado({ value, onChange, opciones, placeholder = 'Seleccionar...', disabled = false, style, capitalizarOpciones = false }) {
    const [abierto, setAbierto] = useState(false);
    const [posicion, setPosicion] = useState(null);
    const disparadorRef = useRef(null);
    const listaRef = useRef(null);

    const MARGEN = 6;
    const ALTURA_MAXIMA_DESEADA = 240;

    const calcularPosicion = () => {
        if (!disparadorRef.current) return;
        const rect = disparadorRef.current.getBoundingClientRect();
        const espacioAbajo = window.innerHeight - rect.bottom - MARGEN;
        const espacioArriba = rect.top - MARGEN;

        // Si no entra hacia abajo pero hay mas lugar hacia arriba, se abre para arriba
        // (si no, la lista queda cortada por el borde de la ventana, aunque ya haya
        // escapado del recorte del modal gracias al portal).
        const haciaArriba = espacioAbajo < ALTURA_MAXIMA_DESEADA && espacioArriba > espacioAbajo;

        setPosicion({
            left: rect.left,
            width: rect.width,
            haciaArriba,
            top: haciaArriba ? undefined : rect.bottom + MARGEN,
            bottom: haciaArriba ? window.innerHeight - rect.top + MARGEN : undefined,
            maxHeight: Math.max(120, Math.min(ALTURA_MAXIMA_DESEADA, haciaArriba ? espacioArriba : espacioAbajo)),
        });
    };

    const alternarAbierto = () => {
        if (!abierto) calcularPosicion();
        setAbierto((prev) => !prev);
    };

    useEffect(() => {
        if (!abierto) return;

        const alClickFuera = (e) => {
            if (
                disparadorRef.current && !disparadorRef.current.contains(e.target) &&
                listaRef.current && !listaRef.current.contains(e.target)
            ) {
                setAbierto(false);
            }
        };
        const alEscape = (e) => {
            if (e.key === 'Escape') setAbierto(false);
        };
        // Si se hace scroll (ej. el modal-body) o se redimensiona la ventana, la posicion
        // calculada queda vieja: mas simple y seguro cerrar el menu que perseguir al trigger.
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

    const opcionActual = opciones.find((o) => String(o.value) === String(value));

    const elegir = (opcion) => {
        onChange({ target: { value: opcion.value } });
        setAbierto(false);
    };

    return (
        <div className="select-personalizado" style={style}>
            <button
                type="button"
                ref={disparadorRef}
                className={`select-personalizado-disparador ${abierto ? 'abierto' : ''}`}
                onClick={alternarAbierto}
                disabled={disabled}
            >
                <span className={`select-personalizado-etiqueta ${opcionActual ? '' : 'select-personalizado-placeholder'} ${capitalizarOpciones ? 'select-personalizado-capitalizado' : ''}`}>
                    {opcionActual ? opcionActual.label : placeholder}
                </span>
                <HiOutlineChevronDown className={`select-personalizado-flecha ${abierto ? 'abierta' : ''}`} />
            </button>

            {abierto && posicion && createPortal(
                <ul
                    ref={listaRef}
                    className={`select-personalizado-lista ${posicion.haciaArriba ? 'hacia-arriba' : ''}`}
                    role="listbox"
                    style={{
                        top: posicion.top,
                        bottom: posicion.bottom,
                        left: posicion.left,
                        width: posicion.width,
                        maxHeight: posicion.maxHeight,
                    }}
                >
                    {opciones.map((opcion) => (
                        <li
                            key={opcion.value}
                            role="option"
                            aria-selected={String(opcion.value) === String(value)}
                            className={`select-personalizado-opcion ${String(opcion.value) === String(value) ? 'seleccionada' : ''} ${capitalizarOpciones ? 'select-personalizado-capitalizado' : ''}`}
                            onClick={() => elegir(opcion)}
                        >
                            {opcion.label}
                        </li>
                    ))}
                </ul>,
                document.body
            )}
        </div>
    );
}

export default SelectPersonalizado;

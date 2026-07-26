import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { HiOutlineChevronDown } from 'react-icons/hi2';
import '../styles/Formularios.css';

// Select con el mismo "contrato" que un <select> nativo (value / onChange(e) con e.target.value),
// para poder reemplazar los <select> existentes sin tocar la lógica que ya los usa.
// 'opciones' es un array de { value, label }.
//
// El disparador es un <input> de texto (no un <button>): permite escribir para filtrar
// las opciones por coincidencia parcial del label (case-insensitive), ademas de abrirse
// y navegarse con las flechas del teclado como un <select> nativo.
//
// La lista desplegable se renderiza en un portal a document.body (no como hijo del
// disparador): si se dejara adentro, cualquier ancestro con overflow:hidden (como
// '.modal-contenido', necesario para los bordes redondeados) la recortaría apenas
// el trigger quedara cerca de un borde, como pasa con el select de forma de pago
// dentro del footer del modal de boleta.
function SelectPersonalizado({ value, onChange, opciones, placeholder = 'Seleccionar...', disabled = false, style, capitalizarOpciones = false }) {
    const [abierto, setAbierto] = useState(false);
    const [posicion, setPosicion] = useState(null);
    const [resaltado, setResaltado] = useState(-1);
    const [busqueda, setBusqueda] = useState('');
    // contenedorRef: el <div> completo (input + flecha) — usado para medir el ancho real
    // del disparador y para detectar clicks afuera. inputRef: el <input>, solo para foco.
    const contenedorRef = useRef(null);
    const inputRef = useRef(null);
    const listaRef = useRef(null);

    const MARGEN = 6;
    const ALTURA_MAXIMA_DESEADA = 240;

    const calcularPosicion = () => {
        if (!contenedorRef.current) return;
        const rect = contenedorRef.current.getBoundingClientRect();
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

    const opcionesFiltradas = useMemo(() => {
        const consulta = busqueda.trim().toLowerCase();
        if (!consulta) return opciones;
        return opciones.filter((o) => o.label.toLowerCase().includes(consulta));
    }, [opciones, busqueda]);

    const indiceDeValor = () => opciones.findIndex((o) => String(o.value) === String(value));

    const abrir = (indiceInicial) => {
        calcularPosicion();
        setResaltado(indiceInicial);
        setAbierto(true);
    };

    const elegir = (opcion) => {
        onChange({ target: { value: opcion.value } });
        setAbierto(false);
    };

    // Al escribir se filtran las opciones por coincidencia parcial del label (sin importar
    // mayusculas/minusculas), resaltando siempre la primera coincidencia.
    const manejarCambioTexto = (e) => {
        setBusqueda(e.target.value);
        setResaltado(0);
        if (!abierto) calcularPosicion();
        setAbierto(true);
    };

    const alEnfocar = () => {
        if (disabled || abierto) return;
        const indiceActual = indiceDeValor();
        abrir(indiceActual >= 0 ? indiceActual : 0);
    };

    const alClickFlecha = () => {
        if (disabled) return;
        if (abierto) {
            setAbierto(false);
        } else {
            inputRef.current?.focus();
        }
    };

    // Permite moverse entre las opciones (filtradas) con las flechas del teclado
    // (igual que un <select> nativo), ademas de confirmar con Enter.
    const manejarTeclaDisparador = (e) => {
        if (disabled || opciones.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (!abierto) {
                const indiceActual = indiceDeValor();
                abrir(indiceActual >= 0 ? indiceActual : 0);
            } else {
                setResaltado((prev) => Math.min(opcionesFiltradas.length - 1, prev + 1));
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (!abierto) {
                const indiceActual = indiceDeValor();
                abrir(indiceActual >= 0 ? indiceActual : opcionesFiltradas.length - 1);
            } else {
                setResaltado((prev) => Math.max(0, prev - 1));
            }
        } else if (e.key === 'Enter' && abierto) {
            e.preventDefault();
            if (opcionesFiltradas[resaltado]) elegir(opcionesFiltradas[resaltado]);
        } else if (e.key === 'Tab' && abierto) {
            if (opcionesFiltradas.length === 1) {
                // Una sola coincidencia posible: Tab la confirma y sigue de largo al siguiente
                // campo (sin preventDefault, para no interrumpir la navegacion normal del
                // formulario) — asi no hace falta un Enter aparte para confirmar.
                elegir(opcionesFiltradas[0]);
            } else if (opcionesFiltradas.length >= 2) {
                // Todavia hay mas de una opcion posible (o no se escribio nada y se ven todas):
                // Tab/Shift+Tab navegan el resaltado entre ellas, igual que las flechas, en vez
                // de salir del campo — recien al llegar a una sola coincidencia (o con Enter)
                // se confirma.
                e.preventDefault();
                if (e.shiftKey) {
                    setResaltado((prev) => Math.max(0, prev - 1));
                } else {
                    setResaltado((prev) => Math.min(opcionesFiltradas.length - 1, prev + 1));
                }
            } else {
                // "Sin resultados": no hay nada para elegir ni para navegar. Se cierra y se
                // deja que Tab siga su curso normal para no dejar al usuario trabado ahi.
                setAbierto(false);
            }
        }
    };

    // Al cerrarse (Escape, click afuera, selección) se limpia el texto escrito, para que
    // el input vuelva a mostrar el label de la opción elegida en vez de la búsqueda.
    useEffect(() => {
        if (!abierto) setBusqueda('');
    }, [abierto]);

    // Mantiene la opcion resaltada visible dentro de la lista al navegar con el teclado.
    useEffect(() => {
        if (!abierto || resaltado < 0 || !listaRef.current) return;
        listaRef.current.children[resaltado]?.scrollIntoView({ block: 'nearest' });
    }, [abierto, resaltado]);

    // Si el select se abre mientras un ancestro (ej. el modal contenedor) todavia esta
    // animando su entrada ('transform: scale(...)' en Modal.css), la posicion calculada
    // al abrir queda vieja: getBoundingClientRect() devuelve el tamaño/posicion a mitad de
    // esa animacion, no el final, y la lista queda mal alineada. Se recalcula en cada frame
    // durante un rato despues de abrir para que se auto-corrija apenas la animacion termine.
    useEffect(() => {
        if (!abierto) return;
        const inicio = performance.now();
        let frame;
        const recalcular = (ahora) => {
            calcularPosicion();
            if (ahora - inicio < 300) frame = requestAnimationFrame(recalcular);
        };
        frame = requestAnimationFrame(recalcular);
        return () => cancelAnimationFrame(frame);
    }, [abierto]);

    useEffect(() => {
        if (!abierto) return;

        const alClickFuera = (e) => {
            if (
                contenedorRef.current && !contenedorRef.current.contains(e.target) &&
                listaRef.current && !listaRef.current.contains(e.target)
            ) {
                setAbierto(false);
            }
        };
        const alEscape = (e) => {
            if (e.key === 'Escape') setAbierto(false);
        };
        // Si se hace scroll fuera de la lista (ej. el modal-body) o se redimensiona la
        // ventana, la posicion calculada queda vieja: mas simple y seguro cerrar el menu
        // que perseguir al trigger. El scroll DENTRO de la lista (para ver mas opciones)
        // no debe cerrarla.
        const alScrollOResize = (e) => {
            if (listaRef.current && e.target && listaRef.current.contains(e.target)) return;
            setAbierto(false);
        };

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

    return (
        <div className="select-personalizado" style={style}>
            <div ref={contenedorRef} className={`select-personalizado-disparador ${abierto ? 'abierto' : ''} ${disabled ? 'deshabilitado' : ''}`}>
                <input
                    type="text"
                    ref={inputRef}
                    className={`select-personalizado-input ${capitalizarOpciones ? 'select-personalizado-capitalizado' : ''}`}
                    value={abierto ? busqueda : (opcionActual ? opcionActual.label : '')}
                    placeholder={placeholder}
                    disabled={disabled}
                    autoComplete="off"
                    onFocus={alEnfocar}
                    onClick={alEnfocar}
                    onChange={manejarCambioTexto}
                    onKeyDown={manejarTeclaDisparador}
                />
                <HiOutlineChevronDown
                    className={`select-personalizado-flecha ${abierto ? 'abierta' : ''}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={alClickFlecha}
                />
            </div>

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
                    {opcionesFiltradas.length === 0 && (
                        <li className="select-personalizado-sin-resultados">Sin resultados</li>
                    )}
                    {opcionesFiltradas.map((opcion, indice) => (
                        <li
                            key={opcion.value}
                            role="option"
                            aria-selected={String(opcion.value) === String(value)}
                            className={`select-personalizado-opcion ${String(opcion.value) === String(value) ? 'seleccionada' : ''} ${indice === resaltado ? 'resaltada' : ''} ${capitalizarOpciones ? 'select-personalizado-capitalizado' : ''}`}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => elegir(opcion)}
                            onMouseEnter={() => setResaltado(indice)}
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

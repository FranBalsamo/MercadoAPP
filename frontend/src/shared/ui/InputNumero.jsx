import { useRef } from 'react';
import { HiOutlineChevronUp, HiOutlineChevronDown } from 'react-icons/hi2';
import '../styles/Formularios.css';

// Input numerico con flechas de +/- propias en vez de las nativas del navegador (que no
// se pueden re-estilar para que sigan el diseño de la app). El 'style' que se le pasa
// define el look de toda la "caja" (borde, fondo, padding, ancho, etc.) y se aplica al
// div contenedor, no al <input> nativo, para poder reemplazar los inputs existentes sin
// perder los estilos por-instancia que ya tenian (ej. borde rojo cuando se excede el stock).
function InputNumero({ value, onChange, min, max, step = 1, placeholder, disabled = false, style, onBlur }) {
    const inputRef = useRef(null);

    // stepUp/stepDown cambian el value del <input> nativo por fuera de React, asi que hace
    // falta disparar un evento 'input' real para que React lo detecte y llame a onChange.
    const disparaCambioReact = () => {
        inputRef.current?.dispatchEvent(new Event('input', { bubbles: true }));
    };

    const incrementar = () => {
        if (disabled || !inputRef.current) return;
        inputRef.current.stepUp();
        disparaCambioReact();
    };

    const decrementar = () => {
        if (disabled || !inputRef.current) return;
        inputRef.current.stepDown();
        disparaCambioReact();
    };

    // Un <input type="number"> nativo solo acepta el punto como separador decimal: la coma
    // (la forma natural de escribir decimales en Argentina, ej. "0,5") se ignora directamente
    // al tipear, asi que nunca llegaba a cargarse una cantidad fraccionaria escribiendola con
    // coma. Se intercepta la tecla coma y se la trata como si fuera un punto.
    const manejarTecla = (e) => {
        if (e.key !== ',' || disabled) return;
        e.preventDefault();
        const valorActual = String(value ?? '');
        if (valorActual.includes('.')) return; // ya hay un separador decimal cargado
        onChange({ target: { value: valorActual + '.' } });
    };

    return (
        <div className={`input-numero ${disabled ? 'deshabilitado' : ''}`} style={style}>
            <input
                ref={inputRef}
                type="number"
                className="input-numero-campo"
                min={min}
                max={max}
                step={step}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                onKeyDown={manejarTecla}
                onBlur={onBlur}
                disabled={disabled}
            />
            <div className="input-numero-flechas">
                <button type="button" tabIndex={-1} onClick={incrementar} disabled={disabled} aria-label="Aumentar">
                    <HiOutlineChevronUp />
                </button>
                <button type="button" tabIndex={-1} onClick={decrementar} disabled={disabled} aria-label="Disminuir">
                    <HiOutlineChevronDown />
                </button>
            </div>
        </div>
    );
}

export default InputNumero;

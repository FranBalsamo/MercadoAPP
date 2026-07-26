import React from 'react';
import { HiOutlineExclamationTriangle } from 'react-icons/hi2';
import './Alerta.css';

// textoConfirmar/textoCancelar: por defecto genericos, pero para acciones irreversibles
// (eliminar, reemplazar datos) conviene pasar el verbo exacto ("Eliminar boleta" en vez de
// "Confirmar") para que el boton diga que va a pasar, no una confirmacion generica.
function AlertaConfirmacion({ mensaje, onConfirmar, onCancelar, textoConfirmar = 'Confirmar', textoCancelar = 'Cancelar' }) {
    return (
        <div className="alerta-overlay">
            <div className="alerta-contenido">
                <div className="alerta-header">
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><HiOutlineExclamationTriangle /> Confirmar Acción</h3>
                </div>

                <div className="alerta-mensaje">
                    <p>{mensaje}</p>
                </div>

                <div className="alerta-botones">
                    <button className="botones-cancelar" onClick={onCancelar}>
                        {textoCancelar}
                    </button>
                    <button className="botones-confirmacion" onClick={onConfirmar}>
                        {textoConfirmar}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AlertaConfirmacion;
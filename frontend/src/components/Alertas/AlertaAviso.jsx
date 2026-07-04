import React from 'react';
import '../Estilos/Alerta.css';

function AlertaAviso({ titulo = '⚠️ Aviso', mensaje, onAceptar }) {
    return (
        <div className="alerta-overlay">
            <div className="alerta-contenido">
                <div className="alerta-header">
                    <h3 style={{ margin: 0 }}>{titulo}</h3>
                </div>

                <div className="alerta-mensaje">
                    <p>{mensaje}</p>
                </div>

                <div className="alerta-botones">
                    <button className="botones-confirmacion" onClick={onAceptar}>
                        Aceptar
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AlertaAviso;

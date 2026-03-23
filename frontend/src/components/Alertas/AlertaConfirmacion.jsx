import React from 'react';
import '../Estilos/Alerta.css'

function AlertaConfirmacion({ mensaje, onConfirmar, onCancelar }) {
    return (
        <div className="alerta-overlay">
            <div className="alerta-contenido">
                <div className="alerta-header">
                    <h3>⚠️ Alerta Confirmacion</h3>
                </div>
                <div className="alerta-mensaje">
                    <p>{mensaje}</p>
                </div>

                <div className="alerta-botones">
                    <button className="botones-confirmacion" onClick={onConfirmar}>Confirmar</button>
                    <button className="botones-cancelar" onClick={onCancelar}>Cancelar</button>    
                </div>
            </div>
        </div>
        
    );
}

export default AlertaConfirmacion;
import React from 'react';
import { HiOutlineExclamationTriangle } from 'react-icons/hi2';
import '../Estilos/Alerta.css';

function AlertaConfirmacion({ mensaje, onConfirmar, onCancelar }) {
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
                        Cancelar
                    </button>    
                    <button className="botones-confirmacion" onClick={onConfirmar}>
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AlertaConfirmacion;
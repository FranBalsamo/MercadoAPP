import { useEffect } from 'react';
import { HiOutlineCheckCircle, HiOutlineExclamationTriangle } from 'react-icons/hi2';
import '../Estilos/AlertaEmergente.css';

function AlertaEmergente({ mensaje, onClose, tipo = 'error' }) {

    useEffect(() => {
        if (!mensaje) return;

        const temporizador = setTimeout(() => {
            onClose();
        }, 3500); // 3500 milisegundos = 3.5 segundos

        return () => clearTimeout(temporizador);
    }, [mensaje, onClose]);

    if (!mensaje) return null;

    return (
        <div className="alerta-emergente-contenedor">
            <div className={`alerta-emergente-contenido ${tipo === 'exito' ? 'exito' : ''}`}>
                <span style={{ fontSize: '1.2rem', display: 'inline-flex' }}>{tipo === 'exito' ? <HiOutlineCheckCircle /> : <HiOutlineExclamationTriangle />}</span>
                <span>{mensaje}</span>
            </div>
        </div>
    );
}

export default AlertaEmergente;
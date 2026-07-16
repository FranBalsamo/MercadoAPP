import { useEffect, useState } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import {
    HiOutlineShoppingBag,
    HiOutlineMinus,
    HiOutlineSquare2Stack,
    HiOutlineStop,
    HiOutlineXMark,
} from 'react-icons/hi2';
import './Estilos/TitleBar.css';

const ventana = getCurrentWindow();

function TitleBar() {
    const [maximizada, setMaximizada] = useState(false);

    useEffect(() => {
        let cancelado = false;

        ventana.isMaximized().then((valor) => {
            if (!cancelado) setMaximizada(valor);
        });

        const desuscribir = ventana.onResized(() => {
            ventana.isMaximized().then((valor) => {
                if (!cancelado) setMaximizada(valor);
            });
        });

        return () => {
            cancelado = true;
            desuscribir.then((fn) => fn());
        };
    }, []);

    return (
        <header className="titlebar">
            <div
                className="titlebar-drag"
                data-tauri-drag-region
                onDoubleClick={() => ventana.toggleMaximize()}
            >
                <span className="titlebar-icono"><HiOutlineShoppingBag /></span>
                <span className="titlebar-texto">MercadoApp</span>
            </div>

            <div className="titlebar-controles">
                <button
                    className="titlebar-boton"
                    onClick={() => ventana.minimize()}
                    title="Minimizar"
                    aria-label="Minimizar"
                >
                    <HiOutlineMinus />
                </button>
                <button
                    className="titlebar-boton"
                    onClick={() => ventana.toggleMaximize()}
                    title={maximizada ? 'Restaurar' : 'Maximizar'}
                    aria-label={maximizada ? 'Restaurar' : 'Maximizar'}
                >
                    {maximizada ? <HiOutlineSquare2Stack /> : <HiOutlineStop />}
                </button>
                <button
                    className="titlebar-boton titlebar-boton-cerrar"
                    onClick={() => ventana.close()}
                    title="Cerrar"
                    aria-label="Cerrar"
                >
                    <HiOutlineXMark />
                </button>
            </div>
        </header>
    );
}

export default TitleBar;

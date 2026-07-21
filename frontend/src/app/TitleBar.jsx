import { useEffect, useMemo, useState } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import {
    HiOutlineMinus,
    HiOutlineSquare2Stack,
    HiOutlineStop,
    HiOutlineXMark,
} from 'react-icons/hi2';
import iconoApp from '@/assets/icono-app.png';
import './TitleBar.css';

function TitleBar() {
    // getCurrentWindow() explota si no hay un puente real de Tauri (por ej. abriendo
    // el servidor de Vite en un navegador comun mientras se desarrolla la UI). Lo
    // resolvemos de forma defensiva para que la barra se vea bien en ambos casos,
    // aunque los botones solo hagan algo dentro de la app de escritorio real.
    const ventana = useMemo(() => {
        try {
            return getCurrentWindow();
        } catch {
            return null;
        }
    }, []);

    const [maximizada, setMaximizada] = useState(false);

    useEffect(() => {
        if (!ventana) return;
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
    }, [ventana]);

    return (
        <header className="titlebar">
            <div
                className="titlebar-drag"
                data-tauri-drag-region
                onDoubleClick={() => ventana?.toggleMaximize()}
            >
                <span className="titlebar-icono"><img src={iconoApp} alt="" /></span>
                <span className="titlebar-texto">MercadoApp</span>
            </div>

            <div className="titlebar-controles">
                <button
                    className="titlebar-boton"
                    onClick={() => ventana?.minimize()}
                    title="Minimizar"
                    aria-label="Minimizar"
                >
                    <HiOutlineMinus />
                </button>
                <button
                    className="titlebar-boton"
                    onClick={() => ventana?.toggleMaximize()}
                    title={maximizada ? 'Restaurar' : 'Maximizar'}
                    aria-label={maximizada ? 'Restaurar' : 'Maximizar'}
                >
                    {maximizada ? <HiOutlineSquare2Stack /> : <HiOutlineStop />}
                </button>
                <button
                    className="titlebar-boton titlebar-boton-cerrar"
                    onClick={() => ventana?.close()}
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

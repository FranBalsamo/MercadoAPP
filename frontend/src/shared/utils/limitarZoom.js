import { useEffect } from 'react';

const ZOOM_MAXIMO = 1.25;

// El escalado del SO (ej. 150% en Windows) escala toda la ventana WebView2 automaticamente,
// y eso es independiente del "zoom" propio del webview (setZoom). Para que la app nunca se
// vea mas grande que un 125% efectivo, calculamos un zoom COMPENSATORIO: si el SO esta al
// 150% (scaleFactor 1.5) aplicamos zoom 1.25/1.5 = 0.833 para que el resultado visual final
// quede en 125%; si el SO esta al 100% o 125% (scaleFactor <= 1.25) no se toca nada.
async function aplicarZoomSegunEscala() {
    try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        const { getCurrentWebview } = await import('@tauri-apps/api/webview');

        const ventana = getCurrentWindow();
        const webview = getCurrentWebview();

        const escalaActual = await ventana.scaleFactor();
        const zoomCompensado = escalaActual > ZOOM_MAXIMO ? ZOOM_MAXIMO / escalaActual : 1;

        await webview.setZoom(zoomCompensado);
        return ventana;
    } catch {
        // Fuera de un contexto Tauri real (ej. previsualizacion en un navegador comun) no hay
        // nada que limitar.
        return null;
    }
}

// Hook para invocar una unica vez desde la raiz de la app: aplica el limite al montar y
// vuelve a recalcularlo si la ventana cambia de monitor (cada monitor puede tener un DPI
// distinto).
export function useLimitarZoom() {
    useEffect(() => {
        let cancelado = false;
        let quitarListener = null;

        (async () => {
            const ventana = await aplicarZoomSegunEscala();
            if (cancelado || !ventana) return;

            quitarListener = await ventana.onScaleChanged(() => {
                aplicarZoomSegunEscala();
            });
        })();

        return () => {
            cancelado = true;
            if (quitarListener) quitarListener();
        };
    }, []);
}

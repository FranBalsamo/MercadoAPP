import { useEffect, useMemo, useRef } from 'react';
import { HiOutlinePrinter } from 'react-icons/hi2';
import '@/shared/styles/Modal.css';

// Vista previa de impresion generica: recibe un documento jsPDF ya armado (el mismo que
// usa "Exportar PDF" en cada Vista) y lo muestra en un iframe dentro de un modal con el
// estilo propio de la app, en vez de mandarlo directo a la impresora sin mostrar nada antes.
// El boton "Imprimir" dispara el dialogo nativo de impresion de Windows sobre ese mismo
// iframe (el visor de PDF del navegador responde a contentWindow.print()).
function ModalVistaPreviaImpresion({ doc, titulo = 'Vista previa de impresión', cerrarModal }) {
    const iframeRef = useRef(null);
    const blobUrl = useMemo(() => (doc ? doc.output('bloburl') : null), [doc]);

    // El blob queda "vivo" en memoria hasta que se libera explicitamente: si no lo
    // revocamos al cerrar el modal, se va acumulando uno por cada vez que se abre.
    useEffect(() => {
        return () => {
            if (blobUrl) URL.revokeObjectURL(blobUrl);
        };
    }, [blobUrl]);

    const imprimir = () => {
        iframeRef.current?.contentWindow?.print();
    };

    return (
        <div className="modal-overlay">
            <div className="modal-contenido" style={{ width: '95%', maxWidth: '850px', height: '90vh' }}>
                <div className="modal-header">
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <HiOutlinePrinter /> {titulo}
                    </h3>
                    <button className="btn-cerrar-modal" onClick={cerrarModal}>X</button>
                </div>

                <div className="modal-body" style={{ flex: 1, minHeight: 0, padding: 0 }}>
                    {blobUrl ? (
                        <iframe
                            ref={iframeRef}
                            src={blobUrl}
                            title={titulo}
                            style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                        />
                    ) : (
                        <p style={{ margin: 'auto', color: 'var(--text-muted)' }}>Generando vista previa...</p>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="btn-global btn-secundario" onClick={cerrarModal}>Cancelar</button>
                    <button
                        className="btn-global btn-primario-green"
                        onClick={imprimir}
                        disabled={!blobUrl}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <HiOutlinePrinter /> Imprimir
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ModalVistaPreviaImpresion;

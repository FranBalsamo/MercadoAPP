import { HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi2';

// Paginador generico para listados que piden paginas al backend (Spring Data Pageable).
// 'pagina' es 0-indexed (para calzar directo con el parametro que espera el backend).
function Paginador({ pagina, totalPaginas, totalElementos, onCambiarPagina, cargando = false }) {
    if (totalPaginas <= 1) return null;

    const esPrimera = pagina <= 0;
    const esUltima = pagina >= totalPaginas - 1;

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', padding: '10px 0', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {typeof totalElementos === 'number' ? `${totalElementos} resultado${totalElementos === 1 ? '' : 's'} — ` : ''}
                Página {pagina + 1} de {totalPaginas}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
                <button
                    type="button"
                    className="btn-global btn-secundario"
                    onClick={() => onCambiarPagina(pagina - 1)}
                    disabled={esPrimera || cargando}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px' }}
                >
                    <HiOutlineChevronLeft /> Anterior
                </button>
                <button
                    type="button"
                    className="btn-global btn-secundario"
                    onClick={() => onCambiarPagina(pagina + 1)}
                    disabled={esUltima || cargando}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px' }}
                >
                    Siguiente <HiOutlineChevronRight />
                </button>
            </div>
        </div>
    );
}

export default Paginador;

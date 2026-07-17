import {
    HiOutlineHome,
    HiOutlineDocumentText,
    HiOutlineCube,
    HiOutlineUsers,
    HiOutlineTicket,
    HiOutlineChartBar,
    HiOutlinePlus,
    HiOutlineArrowRightCircle,
    HiOutlineSun,
    HiOutlineMoon,
    HiOutlineShoppingBag,
    HiOutlineCog6Tooth,
    HiOutlineBanknotes,
} from 'react-icons/hi2';
import './Estilos/Sidebar.css';

function Sidebar({
    vistaActiva,
    tema,
    alternarTema,
    volverInicio,
    abrirVistaPlanillas,
    abrirModalPlanilla,
    abrirVistaProductos,
    abrirModalProducto,
    abrirVistaClientes,
    abrirModalCliente,
    abrirVistaBuscarBoletas,
    abrirVistaOperaciones,
    abrirVistaEstadisticas,
    abrirVistaConfiguracion,
    planillaActiva,
    abrirPlanilla,
}) {
    const hayPlanillaAbierta = !!planillaActiva;

    const items = [
        {
            id: 'inicio',
            label: 'Inicio',
            icono: HiOutlineHome,
            activaEn: ['inicio'],
            onClick: volverInicio,
        },
        {
            id: 'planillas',
            label: 'Planillas',
            icono: HiOutlineDocumentText,
            activaEn: ['planillas', 'puntoDeVenta', 'planillaCerrada'],
            onClick: abrirVistaPlanillas,
            accion: hayPlanillaAbierta
                ? { titulo: 'Ir a la planilla abierta', icono: HiOutlineArrowRightCircle, activa: true, onClick: () => abrirPlanilla(planillaActiva) }
                : { titulo: 'Nueva planilla', icono: HiOutlinePlus, onClick: abrirModalPlanilla },
        },
        {
            id: 'productos',
            label: 'Productos',
            icono: HiOutlineCube,
            activaEn: ['productos'],
            onClick: abrirVistaProductos,
            accion: { titulo: 'Nuevo producto', icono: HiOutlinePlus, onClick: abrirModalProducto },
        },
        {
            id: 'clientes',
            label: 'Clientes',
            icono: HiOutlineUsers,
            activaEn: ['clientes', 'deudasCliente'],
            onClick: abrirVistaClientes,
            accion: { titulo: 'Nuevo cliente', icono: HiOutlinePlus, onClick: abrirModalCliente },
        },
        {
            id: 'buscarBoletas',
            label: 'Boletas',
            icono: HiOutlineTicket,
            activaEn: ['buscarBoletas'],
            onClick: abrirVistaBuscarBoletas,
        },
        {
            id: 'operaciones',
            label: 'Operaciones',
            icono: HiOutlineBanknotes,
            activaEn: ['operaciones'],
            onClick: abrirVistaOperaciones,
        },
        {
            id: 'estadisticas',
            label: 'Estadísticas',
            icono: HiOutlineChartBar,
            activaEn: ['estadisticas'],
            onClick: abrirVistaEstadisticas,
        },
        {
            id: 'configuracion',
            label: 'Configuración',
            icono: HiOutlineCog6Tooth,
            activaEn: ['configuracion'],
            onClick: abrirVistaConfiguracion,
        },
    ];

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <span className="sidebar-logo-badge"><HiOutlineShoppingBag /></span>
                <span className="sidebar-logo-texto">MercadoApp</span>
            </div>

            <nav className="sidebar-nav">
                {items.map((item) => {
                    const Icono = item.icono;
                    const activo = item.activaEn.includes(vistaActiva);
                    return (
                        <div
                            key={item.id}
                            className={`sidebar-item ${activo ? 'activo' : ''}`}
                            onClick={item.onClick}
                        >
                            <Icono className="sidebar-item-icono" />
                            <span className="sidebar-item-label">{item.label}</span>
                            {item.accion && (
                                <button
                                    className={`sidebar-item-accion ${item.accion.activa ? 'activa' : ''}`}
                                    title={item.accion.titulo}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        item.accion.onClick();
                                    }}
                                >
                                    <item.accion.icono />
                                </button>
                            )}
                        </div>
                    );
                })}
            </nav>

            <button className="sidebar-toggle-tema" onClick={alternarTema} title="Cambiar tema">
                {tema === 'dark' ? <HiOutlineSun /> : <HiOutlineMoon />}
                <span>{tema === 'dark' ? 'Modo claro' : 'Modo oscuro'}</span>
            </button>
        </aside>
    );
}

export default Sidebar;

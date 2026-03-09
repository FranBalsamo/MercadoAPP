import './Estilos/Header.css';

function Header({abrirModalProducto, abrirModalCliente, abrirModalPlanilla}) {
    return (
        <header className="header-principal">
            <nav className="navegacion">
                {/*Planilla*/}
                <div className="nav-item">
                    <span className="nav-titulo">Planillas</span>
                    <div className="dropdown-menu">
                        <button onClick={() => console.log('Buscado planillas...')}>Ver todos</button>
                        <button onClick={abrirModalPlanilla}>Nueva Planilla</button>
                    </div>
                </div>
                {/*Productos*/}
                <div className="nav-item">
                    <span className="nav-titulo">Productos</span>
                    <div className="dropdown-menu">
                        <button onClick={() => console.log('Buscando productos...')}>Ver todos</button>
                        <button onClick={abrirModalProducto}>Nuevo producto</button>
                    </div>
                </div>
                {/*Clientes*/}
                <div className="nav-item">
                    <span className="nav-titulo">Clientes</span>
                    <div className="dropdown-menu">
                        <button onClick={() => console.log('Buscado clientes...')}>Ver todos</button>
                        <button onClick={abrirModalCliente}>Nuevo cliente</button>
                    </div>
                </div>
            </nav>

            <div className="logo-contenedor">
                <h2>🛒 MercadoApp</h2>
            </div>
      </header>  
    );
}

export default Header;
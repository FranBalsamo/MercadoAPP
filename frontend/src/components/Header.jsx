import './Header.css';

function Header() {
    return (
        <header className="header-principal">
            <nav className="navegacion">
                {/*Planilla*/}
                <div className="nav-item">
                    <span className="nav-titulo">Planillas</span>
                    <div className="dropdown-menu">
                        <button onClick={() => console.log('Buscado planillas...')}>Ver todos</button>
                        <button onClick={() => console.log('Abriendo form nuevo cliente...')}>Nueva Planilla</button>
                    </div>
                </div>
                {/*Productos*/}
                <div className="nav-item">
                    <span className="nav-titulo">Productos</span>
                    <div className="dropdown-menu">
                        <button onClick={() => console.log('Buscando productos...')}>Ver todos</button>
                        <button onClick={() => console.log('Abriendo form nuevo producto...')}>Nuevo producto</button>
                    </div>
                </div>
                {/*Clientes*/}
                <div className="nav-item">
                    <span className="nav-titulo">Clientes</span>
                    <div className="dropdown-menu">
                        <button onClick={() => console.log('Buscado clientes...')}>Ver todos</button>
                        <button onClick={() => console.log('Abriendo form nuevo cliente...')}>Nuevo cliente</button>
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
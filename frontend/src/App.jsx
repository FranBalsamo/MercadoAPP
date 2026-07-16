import { useState, useEffect } from "react";
import reactLogo from "./assets/react.svg";
import TitleBar from "./components/TitleBar";
import Sidebar from "./components/Sidebar"
import ModalProducto from "./components/Modals/ModalProducto";
import ModalCliente from "./components/Modals/ModalCliente";
import ModalPlanilla from "./components/Modals/ModalPlanilla";
import VistaInicio from "./components/Vistas/VistaInicio";
import VistaPuntoVenta from "./components/Vistas/VistaPuntoVenta";
import VistaClientes from "./components/Vistas/VistaClientes";
import VistaProductos from "./components/Vistas/VistaProductos";
import VistaPlanillas from "./components/Vistas/VistaPlanillas";
import VistaPlanillaCerrada from "./components/Vistas/VistaPlanillaCerrada";
import VistaClienteDeudas from "./components/Vistas/VistaClienteDeudas";
import VistaEstadisticas from "./components/Vistas/VistaEstadisticas";
import VistaBuscarBoletas from "./components/Vistas/VistaBuscarBoletas";
import VistaConfiguracion from "./components/Vistas/VistaConfiguracion";
import PantallaCarga from "./components/PantallaCarga";

import "./components/Estilos/tokens.css";
import "./App.css";

function App() {

  const [tema, setTema] = useState(() => localStorage.getItem('tema') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tema);
    localStorage.setItem('tema', tema);
  }, [tema]);

  const alternarTema = () => {
    setTema(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const [mostrarModalProd, setMostrarModalProd] = useState(false);
  const [mostrarModalCliente, setMostrarModalCliente] = useState(false);
  const [mostrarModalPlanilla, setMostrarModalPlanilla] = useState(false);
  const [vistaActiva, setVistaActiva] = useState('inicio');
  const [vistaAnterior, setVistaAnterior] = useState('inicio');
  const [planillaActiva, setPlanillaActiva] = useState(null);
  const [planillaParaResumen, setPlanillaParaResumen] = useState(null);
  const [clienteParaDeudas, setClienteParaDeudas] = useState(null);
  const [actualizarClientes, setActualizarClientes] = useState(0);
  const [actualizarProductos, setActualizarProductos] = useState(0);

  // El backend (y en la app instalada, tambien la base local) arrancan en paralelo a la ventana:
  // hasta que no responda, no tiene sentido mostrar la app (fetches fallando en cascada).
  const [backendListo, setBackendListo] = useState(false);
  const [tardandoMucho, setTardandoMucho] = useState(false);

  useEffect(() => {
    let cancelado = false;
    const inicioEspera = Date.now();

    const revisarBackend = async () => {
      try {
        const respuesta = await fetch('http://localhost:8080/api/sistema/db-info');
        if (respuesta.ok) {
          if (!cancelado) setBackendListo(true);
          return;
        }
      } catch (error) {
        // El backend todavia no esta arriba; se reintenta mas abajo.
      }
      if (!cancelado) {
        if (Date.now() - inicioEspera > 15000) setTardandoMucho(true);
        setTimeout(revisarBackend, 800);
      }
    };

    revisarBackend();
    return () => { cancelado = true; };
  }, []);

  // Al iniciar la app buscamos si quedó una planilla abierta de una sesión anterior
  // (por ejemplo, si se cerró el programa sin cerrar la caja), para no perder ese estado.
  useEffect(() => {
    if (!backendListo) return;
    const buscarPlanillaAbierta = async () => {
      try {
        const respuesta = await fetch('http://localhost:8080/api/planilla/abierta');
        if (respuesta.status === 200) {
          const planillaAbierta = await respuesta.json();
          setPlanillaActiva(planillaAbierta);
        }
      } catch (error) {
        console.error("Error al buscar la planilla abierta:", error);
      }
    };
    buscarPlanillaAbierta();
  }, [backendListo]);

  const avisarRecargaClientes = () => {
    setActualizarClientes(prev => prev + 1);
  };

  const avisarRecargaProductos = () => {
    setActualizarProductos(prev => prev + 1);
  };

  const volverInicio = () => {
    setVistaActiva('inicio');
    setVistaAnterior('inicio');
  }
  
  const abrirPlanilla = (dtoPlanilla) => {
    setPlanillaActiva(dtoPlanilla);
    setVistaActiva('puntoDeVenta');
  }

  const abrirPlanillaCerrada = (dtoPlanilla) => {
    setPlanillaParaResumen(dtoPlanilla);
    setVistaActiva('planillaCerrada');
  };

  const cerrarPlanilla = () => {
    setVistaActiva('inicio');
    setPlanillaActiva(null);
  }

  const abrirVistaClientes = () => {
    setVistaAnterior(vistaActiva);
    setVistaActiva('clientes');
  }

  const cerrarVistaClientes = () => {
    setVistaActiva(vistaAnterior);
  }

  const abrirVistaPlanillas = () => {
    setVistaAnterior(vistaActiva);
    setVistaActiva('planillas');
  }

  const abrirVistaProductos = () => {
    setVistaAnterior(vistaActiva);
    setVistaActiva('productos');
  }

  const abrirVistaDeudasCliente = (cliente) => {
    setClienteParaDeudas(cliente);
    setVistaActiva('deudasCliente');
  }

  const abrirVistaEstadisticas = () => {
    setVistaAnterior(vistaActiva);
    setVistaActiva('estadisticas');
  }

  const abrirVistaBuscarBoletas = () => {
    setVistaAnterior(vistaActiva);
    setVistaActiva('buscarBoletas');
  }

  const abrirVistaConfiguracion = () => {
    setVistaAnterior(vistaActiva);
    setVistaActiva('configuracion');
  }

  const abrirModalPlanilla = () => {
    setMostrarModalPlanilla(true);
  }
  const cerrarModalPlanilla = () => {
    setMostrarModalPlanilla(false);
  }
  const abrirModalCliente = () => {
    setMostrarModalCliente(true);
  }
  const cerrarModalCliente = () => {
    setMostrarModalCliente(false);
  }
  const abrirModalProd = () => {
    setMostrarModalProd(true);
  };
  const cerrarModalProd = () => {
    setMostrarModalProd(false);
  };

  const MostrarVistas = () => {
    if (vistaActiva === 'clientes') {
      return <VistaClientes
        senalRecarga={actualizarClientes}
        abrirModalNuevoCliente={abrirModalCliente}
        abrirVistaDeudasCliente={abrirVistaDeudasCliente}
      />
    }
    else if (vistaActiva === 'deudasCliente') {
      return <VistaClienteDeudas
        cliente={clienteParaDeudas}
        volver={() => setVistaActiva('clientes')}
      />
    }
    else if (vistaActiva === 'productos') {
      return <VistaProductos
        senalRecarga={actualizarProductos}
        abrirModalNuevoProducto={abrirModalProd}
      />
    }
    else if (vistaActiva === 'planillas') {
      return <VistaPlanillas
        abrirPlanilla={abrirPlanilla}
        abrirPlanillaCerrada={abrirPlanillaCerrada}
      />
    }
    else if (vistaActiva === 'puntoDeVenta') {
      return <VistaPuntoVenta
        cerrarPlanilla={cerrarPlanilla}
        planilla={planillaActiva}
      />  
    }
    else if (vistaActiva === 'planillaCerrada') {
      return <VistaPlanillaCerrada
        planilla={planillaParaResumen}
        volver={() => setVistaActiva('planillas')}
      />;
    }
    else if (vistaActiva === 'estadisticas') {
      return <VistaEstadisticas
        volver={() => setVistaActiva(vistaAnterior)}
      />
    }
    else if (vistaActiva === 'buscarBoletas') {
      return <VistaBuscarBoletas />
    }
    else if (vistaActiva === 'configuracion') {
      return <VistaConfiguracion />
    }
    return <VistaInicio
      abrirModalPlanilla={abrirModalPlanilla}
      abrirPlanilla={abrirPlanilla}
      abrirPlanillaCerrada={abrirPlanillaCerrada}
      planilla={planillaActiva}
    />
  }

  if (!backendListo) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <TitleBar />
        <div style={{ flex: 1, minHeight: 0 }}>
          <PantallaCarga tardandoMucho={tardandoMucho} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <TitleBar />
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <Sidebar
          vistaActiva={vistaActiva}
          tema={tema}
          alternarTema={alternarTema}
          volverInicio={volverInicio}
          abrirModalProducto={abrirModalProd}
          abrirModalCliente={abrirModalCliente}
          abrirModalPlanilla={abrirModalPlanilla}
          abrirVistaClientes={abrirVistaClientes}
          abrirVistaPlanillas={abrirVistaPlanillas}
          abrirVistaProductos={abrirVistaProductos}
          abrirVistaEstadisticas={abrirVistaEstadisticas}
          abrirVistaBuscarBoletas={abrirVistaBuscarBoletas}
          abrirVistaConfiguracion={abrirVistaConfiguracion}
          planillaActiva={planillaActiva}
          abrirPlanilla={abrirPlanilla}
        />

        <div style={{ flexGrow: 1, minWidth: 0, overflowY: 'auto' }}>
          {MostrarVistas()}
        </div>

        {mostrarModalProd && <ModalProducto
          cerrarModal={cerrarModalProd}
          onProductoAgregado={avisarRecargaProductos}
        />}
        {mostrarModalCliente && <ModalCliente
          cerrarModal={cerrarModalCliente}
          onClienteAgregado={avisarRecargaClientes}
        />}
        {mostrarModalPlanilla && <ModalPlanilla
          cerrarModal={cerrarModalPlanilla}
          onPlanillaCreada={abrirPlanilla}
        />}
      </div>
    </div>
  );
}

export default App;

import { useState, useEffect } from "react";
import reactLogo from "./assets/react.svg";
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

  // Al iniciar la app buscamos si quedó una planilla abierta de una sesión anterior
  // (por ejemplo, si se cerró el programa sin cerrar la caja), para no perder ese estado.
  useEffect(() => {
    const buscarPlanillaAbierta = async () => {
      try {
        const respuesta = await fetch('http://localhost:8080/api/planilla/abierta');
        if (respuesta.ok) {
          const planillaAbierta = await respuesta.json();
          setPlanillaActiva(planillaAbierta);
        }
      } catch (error) {
        console.error("Error al buscar la planilla abierta:", error);
      }
    };
    buscarPlanillaAbierta();
  }, []);

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

  return (
    <div style={{ display: 'flex' }}>
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

      <div style={{ flexGrow: 1, minWidth: 0 }}>
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
  );
}

export default App;

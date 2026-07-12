import { useState } from "react";
import reactLogo from "./assets/react.svg";
import Header from "./components/Header"
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

import "./App.css";

function App() {

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
    return <VistaInicio
      abrirModalPlanilla={abrirModalPlanilla}
      abrirPlanilla={abrirPlanilla}
      abrirPlanillaCerrada={abrirPlanillaCerrada}
      planilla={planillaActiva}
    />
  }

  return (
    <div>
      <Header
        abrirModalProducto={abrirModalProd}
        abrirModalCliente={abrirModalCliente}
        abrirModalPlanilla={abrirModalPlanilla} 
        abrirVistaClientes={abrirVistaClientes}
        abrirVistaPlanillas={abrirVistaPlanillas}
        abrirVistaProductos={abrirVistaProductos}
        abrirVistaEstadisticas={abrirVistaEstadisticas}
        abrirVistaBuscarBoletas={abrirVistaBuscarBoletas}
        volverInicio={volverInicio}
      />


      {MostrarVistas()}

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

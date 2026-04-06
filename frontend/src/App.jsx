import { useState } from "react";
import reactLogo from "./assets/react.svg";
import Header from "./components/Header"
import ModalProducto from "./components/Modals/ModalProducto";
import ModalCliente from "./components/Modals/ModalCliente";
import ModalPlanilla from "./components/Modals/ModalPlanilla";
import VistaInicio from "./components/Vistas/VistaInicio";
import VistaPuntoVenta from "./components/Vistas/VistaPuntoVenta";
import VistaClientes from "./components/Vistas/VistaClientes";

import "./App.css";

function App() {

  const [mostrarModalProd, setMostrarModalProd] = useState(false);
  const [mostrarModalCliente, setMostrarModalCliente] = useState(false);
  const [mostrarModalPlanilla, setMostrarModalPlanilla] = useState(false);
  const [vistaActiva, setVistaActiva] = useState('inicio');
  const [vistaAnterior, setVistaAnterior] = useState('inicio');
  const [planillaActiva, setPlanillaActiva] = useState(null);
  const [actualizarClientes, setActualizarClientes] = useState(0);
  const avisarRecargaClientes = () => {
    setActualizarClientes(prev => prev + 1);
  };

  const volverInicio = () => {
    setVistaActiva('inicio');
    setVistaAnterior('inicio');
  }
  
  const abrirPlanilla = (dtoPlanilla) => {
    setPlanillaActiva(dtoPlanilla);
    setVistaActiva('puntoDeVenta');
  }

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
      />
    }
    else if (vistaActiva === 'puntoDeVenta') {
      return <VistaPuntoVenta
        cerrarPlanilla={cerrarPlanilla}
        planilla={planillaActiva}
      />  
    }
    return <VistaInicio/>
  }

  return (
    <div>
      <Header
        abrirModalProducto={abrirModalProd}
        abrirModalCliente={abrirModalCliente}
        abrirModalPlanilla={abrirModalPlanilla} 
        abrirVistaClientes={abrirVistaClientes}
        volverInicio={volverInicio}
      />

      
      {MostrarVistas()}
      
      {mostrarModalProd && <ModalProducto cerrarModal={cerrarModalProd} />}
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

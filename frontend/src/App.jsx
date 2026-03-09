import { useState } from "react";
import reactLogo from "./assets/react.svg";
import Header from "./components/Header"
import ModalProducto from "./components/Modals/ModalProducto";
import ModalCliente from "./components/Modals/ModalCliente";
import ModalPlanilla from "./components/Modals/ModalPlanilla";
import VistaInicio from "./components/Vistas/VistaInicio";
import VistaPuntoVenta from "./components/Vistas/VistaPuntoVenta";

import "./App.css";

function App() {

  const [mostrarModalProd, setMostrarModalProd] = useState(false);
  const [mostrarModalCliente, setMostrarModalCliente] = useState(false);
  const [mostrarModalPlanilla, setMostrarModalPlanilla] = useState(false);
  const [vistaActiva, setVistaActiva] = useState('inicio');
  const [planillaActiva, setPlanillaActiva] = useState(null);

  const abrirPlanilla = (dtoPlanilla) => {
    setPlanillaActiva(dtoPlanilla);
    setVistaActiva('puntoDeVenta');
  }
  const cerrarPlanilla = () => {
    setVistaActiva('inicio');
    setPlanillaActiva(null);
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
  }

  return (
    <div>
      <Header
        abrirModalProducto={abrirModalProd}
        abrirModalCliente={abrirModalCliente}
        abrirModalPlanilla={abrirModalPlanilla} 
      />

      {vistaActiva === 'inicio' ? (
        <VistaInicio />
      ) : (
          <VistaPuntoVenta
            cerrarPlanilla={cerrarPlanilla}
            planilla={planillaActiva}
          />  
      )}
      
      {mostrarModalProd && <ModalProducto cerrarModal={cerrarModalProd} />}
      {mostrarModalCliente && <ModalCliente cerrarModal={cerrarModalCliente} />}
      {mostrarModalPlanilla && <ModalPlanilla
        cerrarModal={cerrarModalPlanilla}
        onPlanillaCreada={abrirPlanilla}
      />}  
    </div>
  );
}

export default App;

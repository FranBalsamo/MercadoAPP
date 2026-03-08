import { useState } from "react";
import reactLogo from "./assets/react.svg";
import Header from "./components/Header"
import ModalProducto from "./components/ModalProducto";
import ModalCliente from "./components/ModalCliente";
import ModalPlanilla from "./components/ModelPlanilla";
import "./App.css";

function App() {

  const [mostrarModalProd, setMostrarModalProd] = useState(false);
  const [mostrarModalCliente, setMostrarModalCliente] = useState(false);
  const [mostrarModalPlanilla, setMostrarModalPlanilla] = useState(false);
  
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
      <Header abrirModalProducto={abrirModalProd} abrirModalCliente={abrirModalCliente} abrirModalPlanilla={abrirModalPlanilla} />
      
      <main style={{ padding: '20px' }}>
        <h1>Bienvenidos a MercadoApp</h1>
        <p>Seleccione una opcion en el menu superior para comenzar.</p>
      </main>

      {mostrarModalProd && <ModalProducto cerrarModal={cerrarModalProd} />}
      {mostrarModalCliente && <ModalCliente cerrarModal={cerrarModalCliente} />}
      {mostrarModalPlanilla && <ModalPlanilla cerrarModal={cerrarModalPlanilla} />}  
    </div>
  );
}

export default App;

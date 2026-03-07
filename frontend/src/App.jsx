import { useState } from "react";
import reactLogo from "./assets/react.svg";
import Header from "./components/Header"

import "./App.css";

function App() {
  return (
    <div>
      <Header />
      <main style={{ padding: '20px' }}>
        <h1>Bienvenidos a MercadoApp</h1>
        <p>Seleccione una opcion en el menu superior para comenzar.</p>
      </main>
    </div>
  );
}

export default App;

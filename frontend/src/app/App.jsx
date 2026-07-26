import { useState, useEffect, useRef } from "react";
import { getVersion } from "@tauri-apps/api/app";
import { invoke } from "@tauri-apps/api/core";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { esTauriApp } from "@/shared/utils/esTauriApp";
import AlertaEmergente from "@/shared/ui/AlertaEmergente";
import TitleBar from "./TitleBar";
import Sidebar from "./Sidebar";
import PantallaCarga from "./PantallaCarga";
import ModalProducto from "@/features/productos/ModalProducto";
import ModalCliente from "@/features/clientes/ModalCliente";
import ModalAbrirPlanilla from "@/features/planillas/ModalAbrirPlanilla";
import VistaInicio from "@/features/inicio/VistaInicio";
import VistaPuntoVenta from "@/features/planillas/VistaPuntoVenta";
import VistaClientes from "@/features/clientes/VistaClientes";
import VistaProductos from "@/features/productos/VistaProductos";
import VistaPlanillas from "@/features/planillas/VistaPlanillas";
import VistaPlanillaCerrada from "@/features/planillas/VistaPlanillaCerrada";
import VistaClienteDeudas from "@/features/clientes/VistaClienteDeudas";
import VistaEstadisticas from "@/features/estadisticas/VistaEstadisticas";
import VistaBuscarBoletas from "@/features/boletas/VistaBuscarBoletas";
import VistaBuscarOperaciones from "@/features/cobros/VistaBuscarOperaciones";
import VistaConfiguracion from "@/features/configuracion/VistaConfiguracion";
import { useLimitarZoom } from "@/shared/utils/limitarZoom";

import "@/shared/styles/tokens.css";
import "./App.css";

function App() {

  useLimitarZoom();

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
  const [pestaniaConfigInicial, setPestaniaConfigInicial] = useState('empresa');
  const [planillaActiva, setPlanillaActiva] = useState(null);
  const [planillaParaResumen, setPlanillaParaResumen] = useState(null);
  const [clienteParaDeudas, setClienteParaDeudas] = useState(null);
  const [actualizarClientes, setActualizarClientes] = useState(0);
  const [actualizarProductos, setActualizarProductos] = useState(0);

  // El backend (y en la app instalada, tambien la base local) arrancan en paralelo a la ventana:
  // hasta que no responda, no tiene sentido mostrar la app (fetches fallando en cascada).
  const [backendListo, setBackendListo] = useState(false);
  const [tardandoMucho, setTardandoMucho] = useState(false);

  // Antes, si el backup automatico empezaba a fallar (ej. carpeta sin permisos), el unico
  // aviso quedaba adentro de Configuracion > Backup: nadie se enteraba salvo que entrara a
  // mirar esa pestania puntual. Ahora se revisa periodicamente y se avisa en toda la app.
  const [alertaBackupFallo, setAlertaBackupFallo] = useState(false);
  // Se dispara solo la primera vez que se detecta un backup nuevo EXITOSO durante esta sesion
  // (no en el primer chequeo al abrir la app, para no avisar de un backup de hace rato).
  const [avisoBackupExitoso, setAvisoBackupExitoso] = useState(null);
  const ultimaEjecucionBackupRef = useRef(null);
  const primerChequeoBackupRef = useRef(true);

  // Estado de actualizaciones: vive aca (no adentro de TabActualizaciones) para que sobreviva
  // a la navegacion — antes, con el estado adentro del tab, si el usuario se iba de
  // Configuracion mientras se instalaba una actualizacion (o simplemente volvia despues),
  // perdia el progreso y la pestania volvia a "Empresa" por defecto.
  const [versionApp, setVersionApp] = useState('');
  const [updateDisponible, setUpdateDisponible] = useState(null);
  const [buscandoActualizacion, setBuscandoActualizacion] = useState(false);
  const [yaSeRevisoActualizacion, setYaSeRevisoActualizacion] = useState(false);
  const [erroActualizacion, setErrorActualizacion] = useState('');
  const [instalandoActualizacion, setInstalandoActualizacion] = useState(false);
  const [progresoInstalacion, setProgresoInstalacion] = useState(0);

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

  useEffect(() => {
    if (!backendListo) return;
    let cancelado = false;

    const revisarBackupAutomatico = async () => {
      try {
        const respuesta = await fetch('http://localhost:8080/api/backup/config');
        if (respuesta.ok) {
          const config = await respuesta.json();
          const fallo = config.activo && (config.ultimoResultado || '').startsWith('ERROR');
          if (!cancelado) setAlertaBackupFallo(fallo);

          // Si "ultimaEjecucion" cambio desde el chequeo anterior, se genero un backup nuevo
          // recien. El primer chequeo (al abrir la app) solo sirve para "tomar la posta" del
          // valor actual, sin avisar — si no, avisaria de un backup que capaz paso hace horas.
          const ejecucionActual = config.ultimaEjecucion;
          if (!cancelado && ejecucionActual && ejecucionActual !== ultimaEjecucionBackupRef.current) {
            const esPrimerChequeo = primerChequeoBackupRef.current;
            ultimaEjecucionBackupRef.current = ejecucionActual;
            primerChequeoBackupRef.current = false;
            if (!esPrimerChequeo && !fallo) {
              setAvisoBackupExitoso('Backup automático completado.');
            }
          }
        }
      } catch (error) {
        // Sin conexion momentanea: no tiene sentido alarmar por esto puntualmente.
      }
    };

    revisarBackupAutomatico();
    const intervalo = setInterval(revisarBackupAutomatico, 5 * 60 * 1000);
    return () => { cancelado = true; clearInterval(intervalo); };
  }, [backendListo]);

  // Version instalada, para mostrarla en Configuracion > Actualizaciones.
  useEffect(() => {
    if (!esTauriApp()) return;
    getVersion().then(setVersionApp).catch((err) => console.error('No se pudo leer la versión actual:', err));
  }, []);

  const buscarActualizaciones = async () => {
    if (!esTauriApp()) return;
    setBuscandoActualizacion(true);
    setErrorActualizacion('');
    setYaSeRevisoActualizacion(false);
    try {
      const resultado = await check();
      setUpdateDisponible(resultado || null);
      setYaSeRevisoActualizacion(true);
    } catch (err) {
      console.error('Error al buscar actualizaciones:', err);
      setErrorActualizacion('No se pudo conectar con el servidor de actualizaciones. Revisá tu conexión a internet.');
    } finally {
      setBuscandoActualizacion(false);
    }
  };

  // Chequeo automatico en segundo plano (al abrir la app y despues cada 6hs), para poder
  // avisar de una version nueva sin que el usuario tenga que entrar a buscarla el mismo.
  useEffect(() => {
    if (!backendListo || !esTauriApp()) return;
    let cancelado = false;

    const revisarSilencioso = async () => {
      try {
        const resultado = await check();
        if (!cancelado && resultado) setUpdateDisponible(resultado);
      } catch (error) {
        // Sin conexion momentanea: no tiene sentido alarmar por esto puntualmente.
      }
    };

    revisarSilencioso();
    const intervalo = setInterval(revisarSilencioso, 6 * 60 * 60 * 1000);
    return () => { cancelado = true; clearInterval(intervalo); };
  }, [backendListo]);

  const instalarActualizacion = async () => {
    if (!updateDisponible) return;
    setInstalandoActualizacion(true);
    setErrorActualizacion('');
    setProgresoInstalacion(0);
    try {
      // El instalador corre en modo pasivo mientras la app sigue viva, y necesita
      // sobreescribir el .bin del backend y mysqld.exe: si siguen corriendo, Windows
      // los tiene bloqueados y la instalacion falla con "Error opening file for writing".
      // Los apagamos antes de descargar/instalar para liberar esos archivos a tiempo.
      await invoke('detener_backend_para_actualizar').catch((err) =>
        console.error('No se pudo detener el backend local antes de actualizar:', err)
      );

      let totalDescargado = 0;
      let tamanioTotal = 0;
      await updateDisponible.downloadAndInstall((evento) => {
        if (evento.event === 'Started') {
          tamanioTotal = evento.data.contentLength || 0;
        } else if (evento.event === 'Progress') {
          totalDescargado += evento.data.chunkLength;
          if (tamanioTotal > 0) setProgresoInstalacion(Math.round((totalDescargado / tamanioTotal) * 100));
        } else if (evento.event === 'Finished') {
          setProgresoInstalacion(100);
        }
      });
      await relaunch();
    } catch (err) {
      console.error('Error al instalar la actualización:', err);
      setErrorActualizacion('Ocurrió un error al descargar o instalar la actualización.');
      setInstalandoActualizacion(false);
    }
  };

  const irAConfiguracionBackup = () => abrirVistaConfiguracion('backup');
  const irAConfiguracionActualizaciones = () => abrirVistaConfiguracion('actualizaciones');

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

  const abrirVistaOperaciones = () => {
    setVistaAnterior(vistaActiva);
    setVistaActiva('operaciones');
  }

  const abrirVistaConfiguracion = (pestania) => {
    // Si no se pide una pestania puntual (ej. desde el sidebar) y hay una actualizacion
    // esperando (encontrada o instalandose), se entra directo ahi en vez de "Empresa" —
    // asi no hace falta ir a buscarla de nuevo cada vez que se vuelve a Configuracion.
    const pestaniaFinal = pestania || ((updateDisponible || instalandoActualizacion) ? 'actualizaciones' : 'empresa');
    setPestaniaConfigInicial(pestaniaFinal);
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
    else if (vistaActiva === 'operaciones') {
      return <VistaBuscarOperaciones />
    }
    else if (vistaActiva === 'configuracion') {
      return <VistaConfiguracion
        pestaniaInicial={pestaniaConfigInicial}
        versionApp={versionApp}
        updateDisponible={updateDisponible}
        buscandoActualizacion={buscandoActualizacion}
        yaSeRevisoActualizacion={yaSeRevisoActualizacion}
        erroActualizacion={erroActualizacion}
        buscarActualizaciones={buscarActualizaciones}
        instalandoActualizacion={instalandoActualizacion}
        progresoInstalacion={progresoInstalacion}
        instalarActualizacion={instalarActualizacion}
      />
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
      {alertaBackupFallo && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap',
          backgroundColor: 'var(--danger-soft)', color: 'var(--danger-soft-text)',
          borderBottom: '1px solid var(--danger)',
          padding: '8px 15px', flexShrink: 0
        }}>
          <span style={{ fontWeight: 'bold' }}>
            ⚠️ El backup automático no se pudo generar. Revisá la carpeta de destino.
          </span>
          <button className="btn-global btn-secundario" onClick={irAConfiguracionBackup}>
            Ver Backup
          </button>
        </div>
      )}
      {updateDisponible && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap',
          backgroundColor: 'var(--info-soft)', color: 'var(--info-soft-text)',
          borderBottom: '1px solid var(--border)',
          padding: '8px 15px', flexShrink: 0
        }}>
          <span style={{ fontWeight: 'bold' }}>
            🆕 Hay una versión nueva disponible: {updateDisponible.version}
          </span>
          <button className="btn-global btn-secundario" onClick={irAConfiguracionActualizaciones}>
            {instalandoActualizacion ? `Instalando... ${progresoInstalacion}%` : 'Ver actualización'}
          </button>
        </div>
      )}
      <AlertaEmergente
        mensaje={avisoBackupExitoso}
        tipo="exito"
        onClose={() => setAvisoBackupExitoso(null)}
      />
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
          abrirVistaOperaciones={abrirVistaOperaciones}
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
        {mostrarModalPlanilla && <ModalAbrirPlanilla
          cerrarModal={cerrarModalPlanilla}
          onPlanillaCreada={abrirPlanilla}
        />}
      </div>
    </div>
  );
}

export default App;

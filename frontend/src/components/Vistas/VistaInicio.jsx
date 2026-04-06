import "../Estilos/VistaInicio.css"

function VistaInicio() {
    return (
        <main>
            <div
                className="rowBox"
                style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    gap: "20px"
                }}
            >
                <div className="Box">
                    Ultimas 3 planillas cargadas
                </div>

                <div
                    className="Box"
                    style={{
                        width: "50%",
                        height: "100%"
                    }}
                >
                    ventana
                </div>
                
                <div className="Box">
                    3 clientes mas deudores
                </div>
            
            </div>
            
            <div
                className="rowBox"
                style={{
                    padding: 0,
                    margin: 0,
                }}
            >
                <div
                    className="Box"
                    style={{
                }}>
                    Notas+
                </div>
            
            </div>
        </main>
    );
}

export default VistaInicio;
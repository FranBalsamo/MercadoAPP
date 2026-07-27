// jsPDF no puede leer variables CSS: estos son los mismos colores del TEMA CLARO de
// tokens.css convertidos a RGB (0-255), para que los documentos impresos (planillas,
// deudas) mantengan la identidad visual de la app en vez de colores sueltos elegidos
// aparte. Siempre se usa el tema claro aca, sin importar el tema activo en pantalla:
// se imprime sobre papel blanco, y un fondo oscuro desperdiciaria tinta / se veria mal.
export const COLOR_TEXTO_PRIMARIO = [26, 29, 35];         // --text-primary
export const COLOR_TEXTO_SECUNDARIO = [92, 99, 112];      // --text-secondary
export const COLOR_TEXTO_MUTED = [108, 113, 120];         // --text-muted
export const COLOR_ACENTO = [79, 70, 229];                // --accent
export const COLOR_EXITO = [5, 150, 105];                 // --success
export const COLOR_PELIGRO = [220, 38, 38];               // --danger
export const COLOR_ADVERTENCIA = [217, 119, 6];           // --warning
export const COLOR_INFO = [37, 99, 235];                  // --info
export const COLOR_SUPERFICIE_INVERSA = [30, 37, 48];     // --surface-inverse (headers de tabla)
export const COLOR_TEXTO_SOBRE_INVERSA = [245, 246, 248]; // --text-on-inverse
export const COLOR_BORDE = [228, 231, 236];               // --border
export const COLOR_SUPERFICIE_2 = [241, 243, 246];        // --surface-2 (filas alternadas)

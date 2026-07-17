#!/usr/bin/env node
/*
 * Carga datos de prueba en MercadoApp usando la API REST del backend (productos, clientes,
 * planillas y boletas), para poder visualizar y probar las vistas con datos variados en
 * varias fechas (rango de fechas en Boletas/Planillas, estadisticas, deudas, etc.). Genera
 * planillas cerradas repartidas en los ultimos ~2 meses (densas en las ultimas 2 semanas,
 * mas espaciadas antes de eso) para poder probar tambien las estadisticas por semana/mes.
 *
 * Requisitos:
 *  - Backend corriendo en http://localhost:8080 (docker compose up, o la app en modo dev).
 *  - Docker Compose disponible en PATH: se usa para "backdatear" la fecha de las planillas
 *    historicas directamente en MySQL, ya que la API siempre las crea con la fecha de hoy
 *    (Planilla.java fija "this.fecha = LocalDate.now()" al construir la entidad).
 *
 * Uso:
 *   node scripts/cargar-datos-prueba.mjs
 *
 * Es seguro correrlo varias veces: los productos/clientes que ya existen no se duplican
 * (se detectan por nombre/documento), y si hay una planilla abierta en este momento no se
 * toca (para no interferir con lo que ya estes probando a mano).
 */

import { execSync } from 'node:child_process';

const BASE_URL = process.env.MERCADOAPP_API_URL || 'http://localhost:8080/api';
const DB_SERVICE = process.env.MERCADOAPP_DB_SERVICE || 'db';
const DB_NAME = process.env.DB_NAME || 'mercado_db';
const DB_ROOT_PASSWORD = process.env.DB_ROOT_PASSWORD || 'root';

// Dias (hacia atras, sin contar hoy) en los que se genera una planilla cerrada: densa en las
// ultimas 2 semanas (una planilla por dia, para que "Ultimos 7/30 dias" tengan datos bien
// poblados) y mas espaciada en el resto de los ~2 meses (una cada 3 dias), para cubrir
// varios meses/semanas distintos sin disparar cientos de llamadas a la API.
function calcularDiasHistoricos() {
    const dias = [];
    for (let d = 1; d <= 14; d++) dias.push(d);
    for (let d = 17; d <= 60; d += 3) dias.push(d);
    return dias.sort((a, b) => b - a); // de mas antiguo a mas reciente
}

const PRODUCTOS_BASE = [
    { nombre: 'banana', descripcion: '' },
    { nombre: 'manzana', descripcion: '' },
    { nombre: 'pera', descripcion: '' },
    { nombre: 'papa', descripcion: '' },
    { nombre: 'cebolla', descripcion: '' },
    { nombre: 'tomate', descripcion: '' },
    { nombre: 'zanahoria', descripcion: '' },
    { nombre: 'naranja', descripcion: '' },
];

const CLIENTES_BASE = [
    { documento: '20111222333', nombre: 'juan perez', telefono: '1122334455', tipoCliente: 'PERSONA', direcciones: [] },
    { documento: '27333444555', nombre: 'maria lopez', telefono: '1155667788', tipoCliente: 'PERSONA', direcciones: [] },
    { documento: '23987654321', nombre: 'carlos gomez', telefono: '1166778899', tipoCliente: 'PERSONA', direcciones: [] },
    { documento: '30712345678', nombre: 'supermercado el sol', telefono: '1144556677', tipoCliente: 'SUPERMERCADO', direcciones: ['av. siempre viva 123', 'ruta 8 km 45'] },
    { documento: '30798765432', nombre: 'almacen la esquina', telefono: '1133445566', tipoCliente: 'SUPERMERCADO', direcciones: ['calle falsa 456'] },
];

const FORMAS_PAGO = ['EFECTIVO', 'MERCADO_PAGO', 'TRANSFERENCIA_BANCARIA', 'OTROS'];

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(lista) {
    return lista[randomInt(0, lista.length - 1)];
}

function mezclar(lista) {
    return [...lista].sort(() => Math.random() - 0.5);
}

async function apiFetch(path, options = {}) {
    const respuesta = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    });
    if (!respuesta.ok && respuesta.status !== 409) {
        const texto = await respuesta.text().catch(() => '');
        throw new Error(`${options.method || 'GET'} ${path} -> ${respuesta.status} ${texto}`);
    }
    return respuesta;
}

async function asegurarProducto({ nombre, descripcion }) {
    const resCrear = await apiFetch('/productos/new', { method: 'POST', body: JSON.stringify({ nombre, descripcion }) });
    if (resCrear.status === 201) {
        const creado = await resCrear.json();
        console.log(`  + producto creado: ${nombre} (id ${creado.id})`);
        return creado.id;
    }
    const resBuscar = await apiFetch(`/productos/nombre/${encodeURIComponent(nombre)}`);
    const existente = await resBuscar.json();
    console.log(`  = producto ya existia: ${nombre} (id ${existente.id})`);
    return existente.id;
}

async function asegurarCliente({ documento, nombre, telefono, tipoCliente, direcciones }) {
    const resCrear = await apiFetch('/clientes/new', {
        method: 'POST',
        body: JSON.stringify({ documento, nombre, telefono, tipoCliente, direcciones }),
    });
    if (resCrear.status === 201) {
        const creado = await resCrear.json();
        console.log(`  + cliente creado: ${nombre} (id ${creado.id})`);
        return creado.id;
    }
    const resBuscar = await apiFetch(`/clientes/buscar/documento/${encodeURIComponent(documento)}`);
    const existente = await resBuscar.json();
    console.log(`  = cliente ya existia: ${nombre} (id ${existente.id})`);
    return existente.id;
}

async function crearPlanillaConStock(idsProductos) {
    const cantidadProductos = randomInt(3, Math.min(5, idsProductos.length));
    const productosElegidos = mezclar(idsProductos).slice(0, cantidadProductos);

    const stockProductos = productosElegidos.map((id_producto) => ({
        id_producto,
        stock: randomInt(20, 60),
    }));

    const res = await apiFetch('/planilla/new', { method: 'POST', body: JSON.stringify({ stockProductos }) });
    return res.json();
}

async function crearBoletasParaPlanilla(planilla, idsClientes) {
    const cantidadBoletas = randomInt(2, 4);
    const stockRestante = new Map(planilla.stockProductos.map((sp) => [sp.id_producto, sp.stock - sp.stock_vendido]));

    for (let i = 0; i < cantidadBoletas; i++) {
        const productosDisponibles = [...stockRestante.entries()].filter(([, disponible]) => disponible >= 1);
        if (productosDisponibles.length === 0) break;

        const cantidadItems = randomInt(1, Math.min(3, productosDisponibles.length));
        const itemsElegidos = mezclar(productosDisponibles).slice(0, cantidadItems);

        const estadoPago = Math.random() < 0.7 ? 'PAGADO' : 'NO_PAGADO';
        const sorteoEntrega = Math.random();
        const estadoEntrega = sorteoEntrega < 0.6 ? 'ENTREGADO' : sorteoEntrega < 0.8 ? 'NO_ENTREGADO' : 'PARCIAL';

        const ventas = itemsElegidos.map(([id_producto, disponible]) => {
            const cantidad = Math.min(disponible, randomInt(1, 8));
            stockRestante.set(id_producto, disponible - cantidad);
            return {
                id_producto,
                cantidad,
                precio_unitario: randomInt(500, 3000),
                precio_vacio: 0,
                cantidad_entregada: estadoEntrega === 'PARCIAL' ? Math.floor(cantidad / 2) : 0,
            };
        });

        const boletaDTO = {
            id_planilla: planilla.id,
            id_cliente: randomChoice(idsClientes),
            estadoPago,
            estadoEntrega,
            formaPago: estadoPago === 'PAGADO' ? randomChoice(FORMAS_PAGO) : null,
            ventas,
        };

        await apiFetch('/boleta/new', { method: 'POST', body: JSON.stringify(boletaDTO) });
    }
}

function backdatearPlanilla(idPlanilla, diasAtras) {
    const sql = `UPDATE planillas SET fecha = DATE_SUB(CURDATE(), INTERVAL ${diasAtras} DAY) WHERE id = ${idPlanilla};`;
    execSync(
        `docker compose exec -T ${DB_SERVICE} mysql -u root -p${DB_ROOT_PASSWORD} ${DB_NAME} -e "${sql}"`,
        { stdio: 'pipe' }
    );
}

async function main() {
    console.log('== Cargando datos de prueba en MercadoApp ==\n');

    console.log('Productos:');
    const idsProductos = [];
    for (const producto of PRODUCTOS_BASE) {
        idsProductos.push(await asegurarProducto(producto));
    }

    console.log('\nClientes:');
    const idsClientes = [];
    for (const cliente of CLIENTES_BASE) {
        idsClientes.push(await asegurarCliente(cliente));
    }

    console.log('\nPlanillas historicas:');
    const resAbierta = await apiFetch('/planilla/abierta');
    const hayPlanillaAbierta = resAbierta.status === 200;

    if (hayPlanillaAbierta) {
        // La API solo permite una planilla ABIERTA a la vez (PlanillaService.newPlanilla),
        // asi que mientras haya una abierta no se puede crear ninguna otra (ni siquiera para
        // cerrarla enseguida). Se aborta en vez de tocarla, para no interferir con lo que ya
        // este probando el usuario a mano.
        const abierta = await resAbierta.json();
        console.log(`  Hay una planilla abierta (#${abierta.id}, ${abierta.fecha}). No se creo ninguna planilla nueva.`);
        console.log('  Cerrala desde la app y volve a correr el script para generar las planillas historicas.');
    } else {
        const diasHistoricos = calcularDiasHistoricos();
        console.log(`  Generando ${diasHistoricos.length} planillas repartidas en los ultimos ${diasHistoricos[0]} dias...`);
        for (const diasAtras of diasHistoricos) {
            const planilla = await crearPlanillaConStock(idsProductos);
            await crearBoletasParaPlanilla(planilla, idsClientes);
            await apiFetch(`/planilla/close/${planilla.id}`, { method: 'PUT' });
            backdatearPlanilla(planilla.id, diasAtras);
            console.log(`  planilla #${planilla.id} -> hace ${diasAtras} dia(s)`);
        }

        const planillaHoy = await crearPlanillaConStock(idsProductos);
        await crearBoletasParaPlanilla(planillaHoy, idsClientes);
        console.log(`  planilla #${planillaHoy.id} -> hoy (queda ABIERTA para seguir probando desde la app)`);
    }

    console.log('\nListo. Ya podes ver los datos en la app (Planillas, Boletas, Clientes, Estadisticas).');
}

main().catch((error) => {
    console.error('\nError al cargar los datos de prueba:', error.message);
    process.exit(1);
});

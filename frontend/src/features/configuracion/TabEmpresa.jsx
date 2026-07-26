import { useState, useEffect } from 'react';
import { HiOutlineBuildingOffice2, HiOutlinePhoto, HiOutlineTrash } from 'react-icons/hi2';
import MensajeError from '@/shared/ui/MensajeError';

// Reduce cualquier imagen a un ancho máximo antes de convertirla a base64,
// para no guardar logos de varios MB en la base de datos.
const redimensionarImagen = (archivo, anchoMaximo = 400) => {
    return new Promise((resolve, reject) => {
        const lector = new FileReader();
        lector.onerror = () => reject(new Error('No se pudo leer el archivo.'));
        lector.onload = () => {
            const img = new Image();
            img.onerror = () => reject(new Error('El archivo no es una imagen válida.'));
            img.onload = () => {
                const escala = Math.min(1, anchoMaximo / img.width);
                const canvas = document.createElement('canvas');
                canvas.width = img.width * escala;
                canvas.height = img.height * escala;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/png'));
            };
            img.src = lector.result;
        };
        lector.readAsDataURL(archivo);
    });
};

function TabEmpresa() {
    const [empresa, setEmpresa] = useState({ nombre: '', cuit: '', direccion: '', telefono: '', email: '', logoBase64: '' });
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [mensaje, setMensaje] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const cargarEmpresa = async () => {
            try {
                const respuesta = await fetch('http://localhost:8080/api/empresa');
                if (respuesta.ok) {
                    const datos = await respuesta.json();
                    setEmpresa({
                        nombre: datos.nombre || '',
                        cuit: datos.cuit || '',
                        direccion: datos.direccion || '',
                        telefono: datos.telefono || '',
                        email: datos.email || '',
                        logoBase64: datos.logoBase64 || '',
                    });
                }
            } catch (err) {
                console.error(err);
                setError('No se pudo cargar la información de la empresa.');
            } finally {
                setCargando(false);
            }
        };
        cargarEmpresa();
    }, []);

    const actualizarCampo = (campo, valor) => {
        setEmpresa(prev => ({ ...prev, [campo]: valor }));
    };

    const handleSubirLogo = async (e) => {
        const archivo = e.target.files?.[0];
        if (!archivo) return;
        try {
            const base64 = await redimensionarImagen(archivo);
            actualizarCampo('logoBase64', base64);
        } catch (err) {
            console.error(err);
            setError('No se pudo procesar la imagen seleccionada.');
        }
        e.target.value = '';
    };

    const handleGuardar = async () => {
        setGuardando(true);
        setError('');
        setMensaje('');
        try {
            const respuesta = await fetch('http://localhost:8080/api/empresa/edit', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(empresa),
            });
            if (!respuesta.ok) {
                setError('Error en el servidor al guardar los datos.');
                return;
            }
            setMensaje('Datos guardados correctamente.');
        } catch (err) {
            console.error(err);
            setError('Error de conexión con el servidor.');
        } finally {
            setGuardando(false);
        }
    };

    if (cargando) {
        return <p style={{ color: 'var(--text-muted)' }}>Cargando datos de la empresa...</p>;
    }

    const campoStyle = { width: '100%', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text-primary)', outline: 'none' };
    const labelStyle = { fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-primary)' };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '700px' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                <HiOutlineBuildingOffice2 /> Datos de la Empresa
            </h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Esta información se usa para personalizar los PDFs de boletas y planillas.
            </p>

            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '120px', height: '120px', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border)',
                        backgroundColor: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
                    }}>
                        {empresa.logoBase64
                            ? <img src={empresa.logoBase64} alt="Logo de la empresa" style={{ maxWidth: '100%', maxHeight: '100%' }} />
                            : <HiOutlinePhoto style={{ fontSize: '2.5rem', color: 'var(--text-muted)' }} />
                        }
                    </div>
                    <label className="btn-global btn-secundario" style={{ cursor: 'pointer', fontSize: '0.85rem' }}>
                        Subir logo
                        <input type="file" accept="image/*" onChange={handleSubirLogo} style={{ display: 'none' }} />
                    </label>
                    {empresa.logoBase64 && (
                        <button
                            className="btn-global btn-secundario"
                            style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => actualizarCampo('logoBase64', '')}
                        >
                            <HiOutlineTrash /> Quitar
                        </button>
                    )}
                </div>

                <div style={{ flex: 1, minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                        <label style={labelStyle}>Nombre del negocio:</label>
                        <input type="text" value={empresa.nombre} onChange={(e) => actualizarCampo('nombre', e.target.value)} style={campoStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}>CUIT:</label>
                        <input type="text" value={empresa.cuit} onChange={(e) => actualizarCampo('cuit', e.target.value)} style={campoStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}>Dirección:</label>
                        <input type="text" value={empresa.direccion} onChange={(e) => actualizarCampo('direccion', e.target.value)} style={campoStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}>Teléfono:</label>
                        <input type="text" value={empresa.telefono} onChange={(e) => actualizarCampo('telefono', e.target.value)} style={campoStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}>Email:</label>
                        <input type="email" value={empresa.email} onChange={(e) => actualizarCampo('email', e.target.value)} style={campoStyle} />
                    </div>
                </div>
            </div>

            <MensajeError mensaje={error} />
            {mensaje && <div style={{ color: 'var(--success)', fontWeight: 'bold', fontSize: '0.9rem' }}>{mensaje}</div>}

            <div>
                <button className="btn-global btn-primario-green" onClick={handleGuardar} disabled={guardando}>
                    {guardando ? 'Guardando...' : 'Guardar Cambios'}
                </button>
            </div>
        </div>
    );
}

export default TabEmpresa;

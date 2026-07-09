import { useState, useEffect } from 'react';

function InputMoneda({ value, onChange, placeholder, style }) {
    const [centavos, setCentavos] = useState(Math.round((Number(value) || 0) * 100));

    useEffect(() => {
        const centavosProp = Math.round((Number(value) || 0) * 100);
        if (centavosProp !== centavos) setCentavos(centavosProp);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    const formateado = centavos > 0
        ? (centavos / 100).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })
        : '';

    const handleChange = (e) => {
        const soloDigitos = e.target.value.replace(/\D/g, '');
        const nuevosCentavos = soloDigitos ? parseInt(soloDigitos, 10) : 0;
        setCentavos(nuevosCentavos);
        onChange(nuevosCentavos / 100);
    };

    return (
        <input
            type="text"
            inputMode="numeric"
            placeholder={placeholder || '$0,00'}
            value={formateado}
            onChange={handleChange}
            style={style}
        />
    );
}

export default InputMoneda;

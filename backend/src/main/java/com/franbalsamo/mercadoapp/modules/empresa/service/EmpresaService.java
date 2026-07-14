package com.franbalsamo.mercadoapp.modules.empresa.service;

import com.franbalsamo.mercadoapp.modules.empresa.model.Empresa;
import com.franbalsamo.mercadoapp.modules.empresa.model.EmpresaDTO;
import com.franbalsamo.mercadoapp.modules.empresa.repository.EmpresaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class EmpresaService {

    @Autowired
    private EmpresaRepository empresaRepository;

    @Autowired
    private EmpresaMapper empresaMapper;

    // Solo existe una fila de Empresa; si todavia no fue configurada se crea vacia.
    public EmpresaDTO getEmpresa() {
        Empresa empresa = empresaRepository.findFirstByOrderByIdAsc()
                .orElseGet(() -> empresaRepository.save(new Empresa()));
        return empresaMapper.toDTO(empresa);
    }

    public EmpresaDTO actualizarEmpresa(EmpresaDTO empresaDTO) {
        Empresa empresa = empresaRepository.findFirstByOrderByIdAsc()
                .orElseGet(Empresa::new);

        empresa.setNombre(empresaDTO.getNombre());
        empresa.setCuit(empresaDTO.getCuit());
        empresa.setDireccion(empresaDTO.getDireccion());
        empresa.setTelefono(empresaDTO.getTelefono());
        empresa.setEmail(empresaDTO.getEmail());

        if (empresaDTO.getLogoBase64() != null) {
            empresa.setLogoBase64(empresaDTO.getLogoBase64());
        }

        Empresa empresaGuardada = empresaRepository.save(empresa);
        return empresaMapper.toDTO(empresaGuardada);
    }
}

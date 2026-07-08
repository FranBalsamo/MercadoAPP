package com.franbalsamo.mercadoapp.shared.config;

import org.modelmapper.ModelMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration //Esta notacion sirve para que Spring lea la clase Configuracion antes de arrancar
public class ModelMapperConfig {

    @Bean //Esta notacion sirve para que Spring cree este objeto y lo guarde para alguien lo use con @Autowired
    public ModelMapper modelMapper() {
        return new ModelMapper();
    }
}

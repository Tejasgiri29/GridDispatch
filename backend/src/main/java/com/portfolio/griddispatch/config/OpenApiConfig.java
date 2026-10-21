package com.portfolio.griddispatch.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.parameters.Parameter;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springdoc.core.customizers.OperationCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI gridDispatchOpenAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("GridDispatch Logistics & Fleet API")
                .description("Carbon-Aware Autonomous Logistics, Fleet Telemetry, Dispatch, and Energy Scheduling Platform.")
                .version("v1.0.0")
                .contact(new Contact().name("Tejasgiri Gosavi").email("tejasgirigosavi29@gmail.com"))
                .license(new License().name("MIT").url("https://opensource.org/licenses/MIT")))
            .addSecurityItem(new SecurityRequirement().addList("BearerAuth"))
            .components(new Components()
                .addSecuritySchemes("BearerAuth", new SecurityScheme()
                    .name("BearerAuth")
                    .type(SecurityScheme.Type.HTTP)
                    .scheme("bearer")
                    .bearerFormat("JWT")));
    }

    @Bean
    public OperationCustomizer globalHeadersCustomizer() {
        return (operation, handlerMethod) -> {
            operation.addParametersItem(new Parameter()
                .in("header")
                .name("X-Tenant-ID")
                .description("Multi-tenant organization identifier")
                .required(false)
                .example("tenant-logistics-us"));
            return operation;
        };
    }
}

package com.copart.vehiclesearch.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.EncodedResourceResolver;

import java.time.Duration;

/**
 * Serves the frontend build (copied into classpath:/static) with caching that suits each kind of file.
 * The build also writes Brotli and gzip copies (.br, .gz) of text files, sent to browsers that accept them.
 */
@Configuration
public class StaticResourceConfig implements WebMvcConfigurer {

    private static final String STATIC = "classpath:/static/";

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Vite puts a hash of the content in these file names, so a changed file always gets a new URL
        // and browsers can keep each one for a year without asking again.
        registry.addResourceHandler("/assets/**")
                .addResourceLocations(STATIC + "assets/")
                .setCacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic().immutable())
                .resourceChain(true)
                .addResolver(new EncodedResourceResolver());

        // Vehicle photos keep their names when they are replaced, so browsers keep them for a day.
        registry.addResourceHandler("/vehicles/**")
                .addResourceLocations(STATIC + "vehicles/")
                .setCacheControl(CacheControl.maxAge(Duration.ofDays(1)).cachePublic());

        // Everything else, mainly index.html: browsers check for a new version on every visit
        // (a quick 304 when nothing changed), so a new deploy shows up right away.
        registry.addResourceHandler("/**")
                .addResourceLocations(STATIC)
                .setCacheControl(CacheControl.noCache())
                .resourceChain(true)
                .addResolver(new EncodedResourceResolver());
    }
}

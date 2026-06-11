# Despliegue

Tres rutas de distribución soportadas, en orden de complejidad creciente.

## Opción A: Archivo único distribuido

**Cuándo:** uso individual, demos, pruebas piloto, envío rápido a una comuna.

1. Ejecutar `npm run build`
2. El archivo `dist/SITREP_Maquina_LosRios.html` es autosuficiente
3. Enviar por correo, USB, Drive, intranet, etc.
4. El usuario lo abre con doble clic

**Limitaciones:**
- Geocodificación funciona pero con fallbacks (Photon es el más resiliente desde `file://`)
- No se instala como app (no hay manifest accesible desde `file://`)
- Service worker no se registra

## Opción B: Netlify Drop (recomendado para piloto regional)

**Cuándo:** quieres una URL pública para que el equipo regional la abra desde cualquier dispositivo, sin preocuparse por dónde está el archivo.

1. Ejecutar `npm run build`
2. Ir a https://app.netlify.com/drop
3. Arrastrar **toda la carpeta `dist/`** (no solo el HTML)
4. Recibes una URL del tipo `https://nombre-aleatorio.netlify.app`
5. Compartir esa URL con el equipo

**Ventajas:**
- HTTPS gratis → geocodificación al 100%, service worker registrado, PWA instalable
- Tablets y celulares pueden instalar la app desde el navegador (botón "Instalar app")
- Funciona offline después de la primera visita

**Para actualizar:** vuelves a arrastrar `dist/`. Netlify mantiene la misma URL.

## Opción C: Servidor institucional propio

**Cuándo:** uso oficial sostenido en SENAPRED Regional, integración con intranet, dominio institucional, control de auditoría.

### Requisitos mínimos
- Servidor con HTTPS habilitado (certificado SSL válido)
- Capacidad de servir archivos estáticos: cualquier nginx, Apache, IIS, Caddy
- Acceso a internet para que los usuarios consulten OpenStreetMap (puede mediarse con proxy si la política institucional lo requiere)

### Pasos
1. Ejecutar `npm run build` en máquina de desarrollo
2. Copiar contenido de `dist/` al directorio raíz del servidor
3. Configurar HTTPS:
   - **nginx:** redirigir todo http → https
   - **Apache:** módulo SSL + redirect en `.htaccess`
4. Verificar:
   - Acceder a `https://sitrep.intranet/`
   - Abrir DevTools → Application → Manifest debe leerse OK
   - Application → Service Workers debe mostrar el SW registrado

### Configuración nginx ejemplo
```nginx
server {
    listen 443 ssl http2;
    server_name sitrep.senapred-losrios.cl;

    ssl_certificate     /etc/letsencrypt/live/sitrep.../fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sitrep.../privkey.pem;

    root /var/www/sitrep;
    index SITREP_Maquina_LosRios.html;

    # Cache largo para íconos
    location ~* \.(png|svg|ico)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Cache corto para el shell
    location ~* \.html$ {
        expires 1h;
        add_header Cache-Control "public";
    }

    # Service worker debe servirse con Service-Worker-Allowed
    location = /service-worker.js {
        add_header Service-Worker-Allowed "/";
        expires 0;
        add_header Cache-Control "no-cache";
    }
}

server {
    listen 80;
    server_name sitrep.senapred-losrios.cl;
    return 301 https://$host$request_uri;
}
```

### Bloqueo de servicios externos (firewall corporativo)

Si la red institucional bloquea acceso a OpenStreetMap, agregar a la **lista blanca** del firewall:

- `*.openstreetmap.org` — tiles del mapa
- `nominatim.openstreetmap.org` — geocodificador 1
- `photon.komoot.io` — geocodificador 2
- `unpkg.com` — librería Leaflet
- `cdnjs.cloudflare.com` — html2pdf
- `fonts.googleapis.com`, `fonts.gstatic.com` — tipografía IBM Plex

Alternativa más controlada: descargar Leaflet, html2pdf y las fuentes a la carpeta `public/assets/` y modificar `src/index.html` para referenciarlos localmente. Eso elimina la dependencia de CDN externos pero aumenta el tamaño del despliegue.

## Instalación como PWA en dispositivos

Una vez servido por HTTPS (Opción B o C), los usuarios pueden **instalar la app**:

### En Chrome / Edge (Windows, macOS, Android, ChromeOS)
1. Abrir la URL
2. Aparece ícono de instalación en la barra de direcciones (a la derecha)
3. Clic → "Instalar SITREP Los Ríos"

### En Safari iOS / iPadOS
1. Abrir la URL en Safari
2. Botón Compartir → "Añadir a pantalla de inicio"

### En Firefox Android
1. Menú → "Instalar"

Una vez instalada, la app:
- Aparece como ícono en escritorio / pantalla de inicio
- Se abre en ventana propia sin barra del navegador
- Funciona sin conexión (excepto geocodificación nueva)
- Recibe actualizaciones automáticas cuando se publican

## Plan de despliegue recomendado para SENAPRED Los Ríos

**Fase 1 — Piloto (semanas 1-2):** Netlify Drop con URL compartida al equipo regional. Cero infraestructura, retroalimentación rápida.

**Fase 2 — Validación (mes 1-2):** mismo Netlify, agregar dominio personalizado (`sitrep-piloto.senapred-losrios.cl`) si está disponible.

**Fase 3 — Producción (mes 3+):** migrar a servidor institucional propio. Coordinar con TI de la Delegación Presidencial Regional para alojamiento, HTTPS, copia de respaldos.

**Fase 4 — Multi-usuario (futuro):** si emerge la necesidad de que varios usuarios trabajen en el mismo SITREP, agregar backend con base de datos (ver `BACKEND_DESIGN.md` — pendiente).

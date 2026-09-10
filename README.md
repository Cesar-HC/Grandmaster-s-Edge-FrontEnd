# Grandmaster's Edge - Frontend

Interfaz web de usuario para la plataforma interactiva de ajedrez en línea **Grandmaster's Edge**. Desarrollada con **Angular** y componentes estilizados, permite a los usuarios registrarse, visualizar estadísticas, retar oponentes mediante emparejamiento por ELO y disputar partidas en tiempo real con tableros interactivos sincronizados vía WebSockets.

---

## Tecnologías Utilizadas

* **Framework:** Angular 17+ (o superior)
* **Lenguaje:** TypeScript / HTML5 / SCSS
* **Cliente WebSocket:** STOMP / SockJS Client
* **Entorno de Ejecución:** Node.js (v18 o v20 recomendado)
* **Gestor de Paquetes:** npm

---

## Requisitos Previos

* **Node.js:** Versión LTS instalada (`node -v`).
* **npm:** Instalado junto con Node.js (`npm -v`).
* **Backend:** Tener el servicio de Spring Boot corriendo localmente en `http://localhost:8080`.

---

## Guía de Instalación y Ejecución Local

---

### Paso 1. Instalar Dependencias

Instala los módulos de Node necesarios para el proyecto:

```bash
npm install
```

---

### Paso 2. Verificar Configuración de Entorno Local

Asegúrate de que tu archivo de entorno (por ejemplo, `src/environments/environment.ts`) apunte al backend local:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api'
};
```

---

### Paso 3. Iniciar el Servidor de Desarrollo

Levanta la aplicación con el comando estándar de npm:

```bash
npm start
```

*(O alternativamente: `ng serve -o`)*

Una vez completada la compilación, abre tu navegador en:
**`http://localhost:4200`**

---

## Flujo de Prueba Rápido

1. Asegúrate de que el backend (`AjedrezBackendApplication`) esté activo y con la base de datos PostgreSQL inicializada.
2. Ingresa a `http://localhost:4200` y regístrate como un nuevo jugador.
3. Inicia sesión con tus credenciales.
4. Explora las secciones de clasificación, salas personalizadas o presiona **Buscar Partida** para entrar a la cola de emparejamiento.

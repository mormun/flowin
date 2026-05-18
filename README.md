# Flowin

**Flowin** es una aplicación web de gestión de tickets orientada a la administración de incidencias, solicitudes y tareas de soporte técnico. El sistema permite registrar usuarios, crear tickets, asignarlos a técnicos, añadir comentarios, gestionar estados, categorías, adjuntos y notificaciones.

El proyecto está desarrollado con **Next.js**, **TypeScript**, **Prisma**, **PostgreSQL** y **NextAuth**, e incluye configuración para ejecución local y despliegue mediante Docker.

---

## Índice

- [Características principales](#características-principales)
- [Tecnologías utilizadas](#tecnologías-utilizadas)
- [Roles de usuario](#roles-de-usuario)
- [Modelo de datos](#modelo-de-datos)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Requisitos previos](#requisitos-previos)
- [Variables de entorno](#variables-de-entorno)
- [Instalación en local](#instalación-en-local)
- [Ejecución con Docker](#ejecución-con-docker)
- [Scripts disponibles](#scripts-disponibles)
- [Autenticación](#autenticación)
- [Funcionalidades principales](#funcionalidades-principales)
- [Posibles mejoras futuras](#posibles-mejoras-futuras)
- [Autor](#autor)

---

## Características principales

Flowin permite gestionar el ciclo de vida completo de un ticket dentro de una organización.

Entre sus funcionalidades principales se incluyen:

- Registro e inicio de sesión de usuarios.
- Autenticación mediante credenciales.
- Autenticación mediante Google OAuth.
- Gestión de roles.
- Creación de tickets.
- Consulta de tickets propios.
- Bandeja de tickets asignados a técnicos.
- Panel de administración.
- Gestión de usuarios.
- Gestión de categorías.
- Gestión de estados.
- Asignación de tickets.
- Comentarios en tickets.
- Adjuntos asociados a tickets.
- Sistema de notificaciones.
- Persistencia de datos en PostgreSQL.
- Acceso a base de datos mediante Prisma ORM.
- Despliegue mediante Docker y Docker Compose.

---

## Tecnologías utilizadas

El proyecto utiliza las siguientes tecnologías principales:

| Tecnología | Uso |
|---|---|
| Next.js | Framework principal de la aplicación |
| React | Construcción de la interfaz de usuario |
| TypeScript | Tipado estático del código |
| Prisma | ORM para acceso a base de datos |
| PostgreSQL | Sistema gestor de base de datos |
| NextAuth | Sistema de autenticación |
| bcryptjs | Cifrado y verificación de contraseñas |
| Docker | Contenerización de la aplicación |
| Docker Compose | Orquestación de aplicación y base de datos |
| Tailwind CSS | Estilos de la interfaz |
| shadcn / Radix UI | Componentes de interfaz |
| Sonner | Notificaciones visuales |

---

## Roles de usuario

La aplicación contempla diferentes perfiles de usuario:

### Usuario

Puede crear tickets, consultar sus propias solicitudes y participar en los comentarios de sus incidencias.

### Técnico

Puede acceder a la bandeja de tickets asignados, gestionar incidencias y participar en la resolución de tickets.

### Administrador

Puede acceder a las funcionalidades de administración, incluyendo la gestión de usuarios, categorías, estados y tickets.

---

## Modelo de datos

El modelo de datos se gestiona mediante Prisma y PostgreSQL.

Las entidades principales son:

### `users`

Representa a los usuarios del sistema.

Campos principales:

- `id`
- `name`
- `surname`
- `email`
- `role`
- `active`
- `password_hash`
- `registration_date`

### `tickets`

Representa las incidencias o solicitudes creadas en el sistema.

Campos principales:

- `id`
- `title`
- `description`
- `category_id`
- `status_id`
- `priority`
- `created_by`
- `assigned_to`
- `created_at`
- `updated_at`
- `closed_at`

### `categories`

Representa las categorías disponibles para clasificar los tickets.

Campos principales:

- `id`
- `name`
- `description`
- `active`

### `status`

Representa los estados posibles de un ticket.

Campos principales:

- `id`
- `name`
- `description`
- `active`

### `comments`

Representa los comentarios asociados a un ticket.

Campos principales:

- `id`
- `ticket_id`
- `user_id`
- `content`
- `is_system`
- `created_at`

### `attachments`

Representa los archivos adjuntos asociados a un ticket.

Campos principales:

- `id`
- `ticket_id`
- `filename`
- `file_path`
- `created_at`

### `notifications`

Representa las notificaciones generadas para los usuarios.

Campos principales:

- `id`
- `user_id`
- `title`
- `message`
- `read`
- `created_at`
- `ticket_id`

---

## Estructura del proyecto

La estructura principal del proyecto es la siguiente:

```bash
flowin/
├── prisma/
│   └── schema.prisma
├── public/
│   └── uploads/
├── src/
│   ├── app/
│   │   ├── api/
│   │   ├── dashboard/
│   │   └── ...
│   ├── components/
│   ├── lib/
│   ├── auth.ts
│   └── proxy.ts
├── .env.example
├── Dockerfile
├── docker-compose.yaml
├── package.json
└── README.md
-- BORRADO PARA EL RESET
DROP TABLE IF EXISTS attachments CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS status CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- TABLA USERS
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(80),
  surname VARCHAR (100),
  email VARCHAR(150) UNIQUE NOT NULL,
  role VARCHAR(20) DEFAULT 'user',
  active BOOLEAN DEFAULT TRUE,
  password_hash VARCHAR(255),
  registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLA CATEGORIAS
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT TRUE
);

-- TABLA ESTADOS
CREATE TABLE status (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT TRUE
);

-- TABLA TICKETS
CREATE TABLE tickets (
  id SERIAL PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  description TEXT,
  category_id INT,
  status_id INT,
  priority VARCHAR(20),
  created_by INT,
  assigned_to INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP,
  closed_at TIMESTAMP,

  CONSTRAINT fk_category
    FOREIGN KEY (category_id) REFERENCES categories(id),

  CONSTRAINT fk_status
    FOREIGN KEY (status_id) REFERENCES status(id),

  CONSTRAINT fk_created_by
    FOREIGN KEY (created_by) REFERENCES users(id),

  CONSTRAINT fk_assigned_to
    FOREIGN KEY (assigned_to) REFERENCES users(id)
);

-- TABLA COMENTARIOS
CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  ticket_id INT NOT NULL,
  user_id   INT,
  content   TEXT,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_ticket
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,

  CONSTRAINT fk_user
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- TABLA ADJUNTOS
CREATE TABLE attachments (
  id SERIAL PRIMARY KEY,
  ticket_id INT NOT NULL,
  filename VARCHAR(255),
  file_path TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_ticket_attachment
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
);

-- TABLA NOTIFICACIONES
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ticket_id INT,

  CONSTRAINT fk_notification_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

  CONSTRAINT fk_notification_ticket
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
);

-- INDICE NOTIFICACIONES
CREATE INDEX idx_notifications_user_read_created
  ON notifications (user_id, read, created_at DESC);

-- INSERT PARA POBLAR DATOS INICIALES

INSERT INTO users (name, surname, email, role, password_hash) VALUES 
('Admin',     'Principal',   'admin@test.com',     'admin', '$2b$10$Yaov2wz6Lt3A8W3WHkjY2u3MQPQobXl15Fs3fVW5DBsbf2Bth4mqq'),
('Carlos',    'Martínez',    'carlos@test.com',    'tech',  '$2b$10$sekcQ5UNO1s8nLo9bMRQye4mZhu1xCLlddHzZDG2zESE0EjNMqemy'),
('Laura',     'García',      'laura@test.com',     'tech',  '$2b$10$u8Xj5QMhH37I6noKY3/kRu6cY8u6BVb17HiDXIf4T/TErx4yKijeK'),
('Pedro',     'López',       'pedro@test.com',     'tech',  '$2b$10$9cvFIdz3etHitCis9nEva.IC7Exz7/wimaS3I0Bfcl9HgoXejryXi'),
('Ana',       'Rodríguez',   'ana@test.com',       'user',  '$2b$10$WgAv.q3GroJ7vHaedQypS.6kdpHfY0l59dRAleoIJT0y9jIivQt9m'),
('Miguel',    'Fernández',   'miguel@test.com',    'user',  '$2b$10$W91nsEfFiboJ8q0nkHPYX.efV/XDrk1AKZOGOB394twzN5PgCyNAe'),
('Elena',     'Sánchez',     'elena@test.com',     'user',  '$2b$10$BuFBPiR61sLJb.yAR6duYuKhswdkhNVy4EHr1oSUIAIWVsCwUl.se'),
('David',     'Torres',      'david@test.com',     'user',  '$2b$10$QVgYeK35xDXe/IPWCUyB6OW.JWMrnUHZ856VMuBlm5Jt/6L/HUc.e'),
('Sofía',     'Navarro',     'sofia@test.com',     'user',  '$2b$10$.7Dv3YifKcJg.TOs3M7c/.295BI/aXP1mrbmBJNrDOfWVjjS7DMc.'),
('Javier',    'Ruiz',        'javier@test.com',    'user',  '$2b$10$ZPjCl/2Uim9lvjjFeI2hP.UKiDyveg2KCuwikGw9IE0LotioYoIOS');


INSERT INTO categories (name, description) VALUES 
('Software',        'Problemas con aplicaciones, sistemas operativos o programas'),
('Hardware',        'Averías o fallos en equipos físicos (ordenadores, periféricos)'),
('Red y Conexión',  'Problemas de conectividad, WiFi, VPN o acceso a red corporativa'),
('Correo',          'Incidencias con cuentas de email, Outlook o calendarios compartidos'),
('Impresoras',      'Problemas con impresoras, escáneres o consumibles'),
('Accesos',         'Solicitudes de permisos, cuentas de usuario o acceso a recursos'),
('Seguridad',       'Incidencias relacionadas con antivirus, phishing o accesos no autorizados'),
('Otros',           'Consultas generales o incidencias que no encajan en otra categoría');


INSERT INTO status (name, description) VALUES 
('Nuevo',       'Ticket recién creado sin asignación'),
('En Proceso',  'Ticket asignado y en gestión activa'),
('Pendiente',   'Ticket en pausa esperando información del usuario o terceros'),
('Solucionado', 'El técnico ha proporcionado una solución, pendiente de aceptación'),
('Cerrado',     'El usuario ha aceptado la solución y el ticket queda finalizado'),
('Cancelado',   'Ticket descartado sin resolución');


INSERT INTO tickets (title, description, category_id, status_id, priority, created_by, assigned_to, created_at, updated_at, closed_at)
VALUES ('No puedo iniciar sesión en el ERP', 'Al intentar acceder al ERP corporativo aparece el mensaje "credenciales inválidas". He verificado que la contraseña es correcta.', 1, 5, 'Alta', 5, 2, NOW() - INTERVAL '25 days', NOW() - INTERVAL '22 days', NOW() - INTERVAL '22 days');
INSERT INTO tickets (title, description, category_id, status_id, priority, created_by, assigned_to, created_at, updated_at, closed_at)
VALUES ('Monitor no enciende', 'El monitor de mi puesto de trabajo no da señal. El LED de encendido no se ilumina. He probado con otro cable de corriente.', 2, 5, 'Media', 6, 3, NOW() - INTERVAL '20 days', NOW() - INTERVAL '17 days', NOW() - INTERVAL '17 days');
INSERT INTO tickets (title, description, category_id, status_id, priority, created_by, assigned_to, created_at, updated_at, closed_at)
VALUES ('Sin acceso a la VPN desde casa', 'Al conectar la VPN corporativa desde mi domicilio, se queda en "Conectando..." y finalmente da timeout.', 3, 5, 'Alta', 7, 2, NOW() - INTERVAL '15 days', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days');
INSERT INTO tickets (title, description, category_id, status_id, priority, created_by, assigned_to, created_at, updated_at)
VALUES ('Outlook no sincroniza calendario', 'El calendario de Outlook no muestra las reuniones que mis compañeros ven en sus equipos.', 4, 6, 'Baja', 8, 3, NOW() - INTERVAL '18 days', NOW() - INTERVAL '16 days');
INSERT INTO tickets (title, description, category_id, status_id, priority, created_by, assigned_to, created_at, updated_at, closed_at)
VALUES ('Impresora de planta 2 atascada', 'La impresora HP LaserJet de la segunda planta muestra error de atasco de papel pero no hay papel atascado visible.', 5, 5, 'Media', 9, 4, NOW() - INTERVAL '12 days', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days');
INSERT INTO tickets (title, description, category_id, status_id, priority, created_by, assigned_to, created_at, updated_at)
VALUES ('Solicitud de acceso a carpeta compartida de Contabilidad', 'Necesito acceso de lectura a la carpeta compartida \\servidor\contabilidad\informes para preparar el cierre trimestral.', 6, 4, 'Media', 5, 2, NOW() - INTERVAL '5 days', NOW() - INTERVAL '2 days');
INSERT INTO tickets (title, description, category_id, status_id, priority, created_by, assigned_to, created_at, updated_at)
VALUES ('Ordenador muy lento desde la última actualización', 'Desde la actualización de Windows del viernes pasado, el equipo tarda más de 5 minutos en arrancar y las aplicaciones van extremadamente lentas.', 1, 2, 'Alta', 6, 2, NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 days');
INSERT INTO tickets (title, description, category_id, status_id, priority, created_by, assigned_to, created_at, updated_at)
VALUES ('Teclado no responde correctamente', 'Varias teclas del teclado (F, G, H) no registran la pulsación o registran doble. El teclado tiene 2 años de uso.', 2, 2, 'Baja', 10, 3, NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days');
INSERT INTO tickets (title, description, category_id, status_id, priority, created_by, assigned_to, created_at, updated_at)
VALUES ('Error al enviar correos con adjuntos grandes', 'Cuando intento enviar emails con adjuntos de más de 10 MB, Outlook muestra un error de timeout y el correo se queda en bandeja de salida.', 4, 3, 'Media', 7, 4, NOW() - INTERVAL '6 days', NOW() - INTERVAL '4 days');
INSERT INTO tickets (title, description, category_id, status_id, priority, created_by, assigned_to, created_at, updated_at)
VALUES ('Wifi intermitente en sala de reuniones B', 'La conexión WiFi en la sala de reuniones B se cae cada 10-15 minutos. Afecta a las videoconferencias con clientes.', 3, 3, 'Crítica', 8, 2, NOW() - INTERVAL '8 days', NOW() - INTERVAL '5 days');
INSERT INTO tickets (title, description, category_id, status_id, priority, created_by, assigned_to, created_at)
VALUES ('Necesito instalar Adobe Acrobat Pro', 'Para el departamento legal necesitamos Adobe Acrobat Pro en mi equipo para editar y firmar documentos PDF.', 1, 1, 'Media', 5, NULL, NOW() - INTERVAL '2 hours');
INSERT INTO tickets (title, description, category_id, status_id, priority, created_by, assigned_to, created_at)
VALUES ('Ratón inalámbrico no funciona', 'El ratón Logitech inalámbrico ha dejado de funcionar. He cambiado las pilas y sigue sin responder. El receptor USB está conectado.', 2, 1, 'Baja', 9, NULL, NOW() - INTERVAL '1 hour');
INSERT INTO tickets (title, description, category_id, status_id, priority, created_by, assigned_to, created_at)
VALUES ('No puedo acceder a la intranet corporativa', 'Al intentar acceder a intranet.empresa.com aparece error 403 Forbidden. Mis compañeros de departamento sí pueden acceder.', 3, 1, 'Alta', 10, NULL, NOW() - INTERVAL '30 minutes');
INSERT INTO tickets (title, description, category_id, status_id, priority, created_by, assigned_to, created_at, updated_at)
VALUES ('Alerta de virus en mi equipo', 'El antivirus ha detectado una amenaza y muestra un aviso permanente que no puedo cerrar. No sé si el equipo está comprometido.', 7, 2, 'Crítica', 6, 4, NOW() - INTERVAL '1 day', NOW() - INTERVAL '12 hours');
INSERT INTO tickets (title, description, category_id, status_id, priority, created_by, assigned_to, created_at, updated_at)
VALUES ('Cambio de contraseña del correo corporativo', 'He olvidado la contraseña de mi cuenta de correo corporativo y no puedo restablecerla con el procedimiento habitual.', 6, 4, 'Media', 8, 3, NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day');
INSERT INTO tickets (title, description, category_id, status_id, priority, created_by, assigned_to, created_at, updated_at)
VALUES ('WiFi no funciona en sala B', 'No hay conexión WiFi en la sala de reuniones B. Imposible hacer videoconferencias.', 3, 6, 'Alta', 9, 2, NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days');
INSERT INTO tickets (title, description, category_id, status_id, priority, created_by, assigned_to, created_at, updated_at)
VALUES ('Instalar segundo monitor en mi puesto', 'Necesito un segundo monitor para trabajar con hojas de cálculo y el ERP simultáneamente. Ya tengo el monitor en la oficina.', 2, 2, 'Baja', 5, 2, NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day');
INSERT INTO tickets (title, description, category_id, status_id, priority, created_by, assigned_to, created_at)
VALUES ('Solicitud de cuenta para nuevo empleado', 'Se incorpora un nuevo empleado el próximo lunes al departamento de marketing. Necesita cuenta de correo, acceso a la intranet y al CRM.', 6, 1, 'Alta', 1, NULL, NOW() - INTERVAL '4 hours');
INSERT INTO tickets (title, description, category_id, status_id, priority, created_by, assigned_to, created_at, updated_at)
VALUES ('Portátil con pantalla rota', 'Se me ha caído el portátil y la pantalla tiene grietas. No se ve correctamente la mitad izquierda.', 2, 3, 'Alta', 7, 4, NOW() - INTERVAL '10 days', NOW() - INTERVAL '8 days');
INSERT INTO tickets (title, description, category_id, status_id, priority, created_by, assigned_to, created_at, updated_at, closed_at)
VALUES ('Excel se cierra solo al abrir archivos grandes', 'Cada vez que abro un archivo Excel de más de 50 MB, la aplicación se cierra sin mensaje de error.', 1, 5, 'Media', 10, 3, NOW() - INTERVAL '9 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days');
INSERT INTO tickets (title, description, category_id, status_id, priority, created_by, assigned_to, created_at, updated_at)
VALUES ('Escáner de documentos no detectado', 'El escáner Canon del departamento de RRHH no aparece como dispositivo disponible en ningún equipo de la red.', 5, 2, 'Media', 8, 3, NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day');
INSERT INTO tickets (title, description, category_id, status_id, priority, created_by, assigned_to, created_at)
VALUES ('Sospecha de correo phishing recibido', 'He recibido un correo supuestamente del banco de la empresa pidiendo verificar datos. No he hecho clic en ningún enlace.', 7, 1, 'Crítica', 6, NULL, NOW() - INTERVAL '15 minutes');
INSERT INTO tickets (title, description, category_id, status_id, priority, created_by, assigned_to, created_at, updated_at)
VALUES ('Configurar firma corporativa en Outlook', 'Necesito que se configure la firma corporativa estándar en mi cuenta de Outlook con los datos actualizados del departamento.', 4, 4, 'Baja', 9, 4, NOW() - INTERVAL '4 days', NOW() - INTERVAL '2 days');
INSERT INTO tickets (title, description, category_id, status_id, priority, created_by, assigned_to, created_at, updated_at)
VALUES ('Servidor de archivos inaccesible', 'Ningún usuario del departamento puede acceder al servidor de archivos compartidos. Todos reciben error "No se puede acceder a la ruta de red especificada".', 3, 2, 'Crítica', 1, 4, NOW() - INTERVAL '6 hours', NOW() - INTERVAL '4 hours');
INSERT INTO tickets (title, description, category_id, status_id, priority, created_by, assigned_to, created_at, updated_at)
VALUES ('Teams no carga las conversaciones', 'Microsoft Teams se queda en blanco al abrir cualquier conversación. He reiniciado varias veces.', 1, 6, 'Media', 5, NULL, NOW() - INTERVAL '11 days', NOW() - INTERVAL '11 days');

INSERT INTO comments (ticket_id, user_id, content, is_system, created_at) VALUES
(1, NULL, 'Ticket asignado a Carlos Martínez', TRUE, NOW() - INTERVAL '24 days'),
(1, 2, 'He revisado tu cuenta en el ERP. La contraseña fue reseteada por el sistema tras 3 intentos fallidos. Te la acabo de desbloquear.', FALSE, NOW() - INTERVAL '23 days'),
(1, 5, 'Ahora sí puedo entrar. Gracias por la rapidez.', FALSE, NOW() - INTERVAL '23 days'),
(1, NULL, 'Estado cambiado a "Solucionado"', TRUE, NOW() - INTERVAL '22 days'),
(1, NULL, 'Solución aceptada. Ticket cerrado.', TRUE, NOW() - INTERVAL '22 days');
INSERT INTO comments (ticket_id, user_id, content, is_system, created_at) VALUES
(2, NULL, 'Ticket asignado a Laura García', TRUE, NOW() - INTERVAL '19 days'),
(2, 3, 'Voy a pasar por tu puesto esta tarde para revisar el monitor y la conexión.', FALSE, NOW() - INTERVAL '19 days'),
(2, 3, 'El monitor tenía el fusible interno fundido. Lo he sustituido por uno de repuesto del almacén.', FALSE, NOW() - INTERVAL '18 days'),
(2, 6, 'Funciona perfectamente. Muchas gracias.', FALSE, NOW() - INTERVAL '17 days'),
(2, NULL, 'Solución aceptada. Ticket cerrado.', TRUE, NOW() - INTERVAL '17 days');
INSERT INTO comments (ticket_id, user_id, content, is_system, created_at) VALUES
(3, NULL, 'Ticket asignado a Carlos Martínez', TRUE, NOW() - INTERVAL '14 days'),
(3, 2, '¿Puedes indicarme qué cliente VPN estás usando y la versión? ¿Has actualizado algo recientemente?', FALSE, NOW() - INTERVAL '14 days'),
(3, 7, 'Uso FortiClient versión 7.0.3. No he actualizado nada.', FALSE, NOW() - INTERVAL '13 days'),
(3, 2, 'La versión 7.0.3 tiene un bug conocido con Windows 11. Te envío por correo el instalador de la versión 7.0.7 que lo soluciona.', FALSE, NOW() - INTERVAL '12 days'),
(3, 7, 'Instalada la nueva versión. Ya conecta correctamente.', FALSE, NOW() - INTERVAL '10 days'),
(3, NULL, 'Solución aceptada. Ticket cerrado.', TRUE, NOW() - INTERVAL '10 days');
INSERT INTO comments (ticket_id, user_id, content, is_system, created_at) VALUES
(4, NULL, 'Ticket asignado a Laura García', TRUE, NOW() - INTERVAL '17 days'),
(4, 3, '¿Estás usando Outlook de escritorio o la versión web?', FALSE, NOW() - INTERVAL '17 days'),
(4, 8, 'Perdona, al final era que tenía desactivada la sincronización. Ya funciona. Se puede cancelar.', FALSE, NOW() - INTERVAL '16 days'),
(4, NULL, 'Estado cambiado a "Cancelado"', TRUE, NOW() - INTERVAL '16 days');
INSERT INTO comments (ticket_id, user_id, content, is_system, created_at) VALUES
(5, NULL, 'Ticket asignado a Pedro López', TRUE, NOW() - INTERVAL '11 days'),
(5, 4, 'He limpiado los rodillos de arrastre y actualizado el firmware. Haz una prueba de impresión.', FALSE, NOW() - INTERVAL '9 days'),
(5, 9, 'He imprimido varias páginas y funciona correctamente.', FALSE, NOW() - INTERVAL '7 days'),
(5, NULL, 'Solución aceptada. Ticket cerrado.', TRUE, NOW() - INTERVAL '7 days');
INSERT INTO comments (ticket_id, user_id, content, is_system, created_at) VALUES
(6, NULL, 'Ticket asignado a Carlos Martínez', TRUE, NOW() - INTERVAL '4 days'),
(6, 2, 'He configurado los permisos de lectura en la carpeta de Contabilidad para tu usuario. Prueba a acceder ahora.', FALSE, NOW() - INTERVAL '2 days'),
(6, NULL, 'Estado cambiado a "Solucionado"', TRUE, NOW() - INTERVAL '2 days');
INSERT INTO comments (ticket_id, user_id, content, is_system, created_at) VALUES
(7, NULL, 'Ticket asignado a Carlos Martínez', TRUE, NOW() - INTERVAL '3 days'),
(7, 2, 'Estoy revisando remotamente tu equipo. Veo que la actualización KB5034441 ha causado problemas en varios equipos. Voy a desinstalarla.', FALSE, NOW() - INTERVAL '2 days'),
(7, 6, '¿Tardarás mucho? Lo necesito para trabajar mañana a primera hora.', FALSE, NOW() - INTERVAL '2 days'),
(7, 2, 'Lo tendré listo antes del fin de la jornada de hoy.', FALSE, NOW() - INTERVAL '1 day');
INSERT INTO comments (ticket_id, user_id, content, is_system, created_at) VALUES
(9, NULL, 'Ticket asignado a Pedro López', TRUE, NOW() - INTERVAL '5 days'),
(9, 4, '¿Puedes indicarme el tamaño exacto del archivo que intentas enviar y a qué dirección de correo?', FALSE, NOW() - INTERVAL '5 days'),
(9, NULL, 'Estado cambiado a "Pendiente"', TRUE, NOW() - INTERVAL '4 days');
INSERT INTO comments (ticket_id, user_id, content, is_system, created_at) VALUES
(10, NULL, 'Ticket asignado a Carlos Martínez', TRUE, NOW() - INTERVAL '7 days'),
(10, 2, 'He identificado el problema: el punto de acceso de la sala B necesita ser reemplazado. He solicitado uno nuevo al proveedor.', FALSE, NOW() - INTERVAL '6 days'),
(10, NULL, 'Estado cambiado a "Pendiente"', TRUE, NOW() - INTERVAL '5 days'),
(10, 2, 'El proveedor confirma envío del nuevo punto de acceso para el miércoles.', FALSE, NOW() - INTERVAL '3 days');
INSERT INTO comments (ticket_id, user_id, content, is_system, created_at) VALUES
(14, NULL, 'Ticket asignado a Pedro López', TRUE, NOW() - INTERVAL '20 hours'),
(14, 4, 'URGENTE: No apagues el equipo. He desconectado tu PC de la red remotamente. Voy a tu puesto ahora para analizarlo.', FALSE, NOW() - INTERVAL '18 hours'),
(14, 4, 'Análisis completo realizado. Era un falso positivo del antivirus tras la última actualización de firmas. He añadido la excepción correspondiente.', FALSE, NOW() - INTERVAL '12 hours');
INSERT INTO comments (ticket_id, user_id, content, is_system, created_at) VALUES
(15, NULL, 'Ticket asignado a Laura García', TRUE, NOW() - INTERVAL '2 days'),
(15, 3, 'He restablecido tu contraseña. Te envío la temporal por SMS al número que tenemos en tu ficha. Cámbiala en el primer inicio de sesión.', FALSE, NOW() - INTERVAL '1 day'),
(15, NULL, 'Estado cambiado a "Solucionado"', TRUE, NOW() - INTERVAL '1 day');
INSERT INTO comments (ticket_id, user_id, content, is_system, created_at) VALUES
(16, NULL, 'Ticket asignado a Carlos Martínez', TRUE, NOW() - INTERVAL '7 days'),
(16, 2, 'Este ticket es un duplicado del ticket #10 que ya está en gestión. Procedo a cancelar.', FALSE, NOW() - INTERVAL '7 days'),
(16, NULL, 'Estado cambiado a "Cancelado"', TRUE, NOW() - INTERVAL '7 days');
INSERT INTO comments (ticket_id, user_id, content, is_system, created_at) VALUES
(17, NULL, 'Ticket asignado a Carlos Martínez', TRUE, NOW() - INTERVAL '1 day'),
(17, 2, 'Pasaré mañana por tu puesto para conectar y configurar el segundo monitor. ¿Tienes el cable HDMI o necesitas uno?', FALSE, NOW() - INTERVAL '1 day'),
(17, 5, 'Tengo el monitor pero no el cable. ¿Podéis proporcionarlo?', FALSE, NOW() - INTERVAL '20 hours');
INSERT INTO comments (ticket_id, user_id, content, is_system, created_at) VALUES
(19, NULL, 'Ticket asignado a Pedro López', TRUE, NOW() - INTERVAL '9 days'),
(19, 4, 'El modelo de pantalla de tu portátil (Lenovo ThinkPad T14) está en stock en el proveedor. He solicitado la pieza de repuesto.', FALSE, NOW() - INTERVAL '8 days'),
(19, NULL, 'Estado cambiado a "Pendiente"', TRUE, NOW() - INTERVAL '8 days'),
(19, 4, 'Mientras tanto te he asignado un portátil de préstamo. Pasa por el despacho de soporte a recogerlo.', FALSE, NOW() - INTERVAL '7 days');
INSERT INTO comments (ticket_id, user_id, content, is_system, created_at) VALUES
(20, NULL, 'Ticket asignado a Laura García', TRUE, NOW() - INTERVAL '8 days'),
(20, 3, 'El problema era falta de memoria RAM. Tu equipo solo tiene 4 GB. He ampliado a 16 GB y ya abre archivos grandes sin problema.', FALSE, NOW() - INTERVAL '5 days'),
(20, 10, 'Acabo de abrir el archivo de 80 MB y va perfecto. Gracias.', FALSE, NOW() - INTERVAL '3 days'),
(20, NULL, 'Solución aceptada. Ticket cerrado.', TRUE, NOW() - INTERVAL '3 days');
INSERT INTO comments (ticket_id, user_id, content, is_system, created_at) VALUES
(21, NULL, 'Ticket asignado a Laura García', TRUE, NOW() - INTERVAL '1 day'),
(21, 3, 'Revisando la configuración de red del escáner. Parece que se le cambió la IP tras el mantenimiento del viernes.', FALSE, NOW() - INTERVAL '20 hours');
INSERT INTO comments (ticket_id, user_id, content, is_system, created_at) VALUES
(23, NULL, 'Ticket asignado a Pedro López', TRUE, NOW() - INTERVAL '3 days'),
(23, 4, 'He configurado la firma corporativa con tus datos actualizados. Cierra y abre Outlook para que se aplique.', FALSE, NOW() - INTERVAL '2 days'),
(23, NULL, 'Estado cambiado a "Solucionado"', TRUE, NOW() - INTERVAL '2 days');
INSERT INTO comments (ticket_id, user_id, content, is_system, created_at) VALUES
(24, NULL, 'Ticket asignado a Pedro López', TRUE, NOW() - INTERVAL '5 hours'),
(24, 4, 'Estoy investigando. El servidor de archivos no responde a ping. Accediendo físicamente a la sala de servidores.', FALSE, NOW() - INTERVAL '4 hours'),
(24, 4, 'Identificado: un disco del RAID ha fallado. El servidor entró en modo degradado. Estoy reemplazando el disco y reconstruyendo el array.', FALSE, NOW() - INTERVAL '3 hours'),
(24, 1, '¿Estimación de tiempo de recuperación? Tenemos a 30 personas sin poder trabajar.', FALSE, NOW() - INTERVAL '2 hours'),
(24, 4, 'El rebuild del RAID está al 45%. Estimamos que en 2-3 horas el servidor estará operativo al 100%.', FALSE, NOW() - INTERVAL '1 hour');
INSERT INTO comments (ticket_id, user_id, content, is_system, created_at) VALUES
(25, 5, 'Al final se ha solucionado solo después de reiniciar el equipo dos veces. Se puede cerrar.', FALSE, NOW() - INTERVAL '11 days'),
(25, NULL, 'Estado cambiado a "Cancelado"', TRUE, NOW() - INTERVAL '11 days');

INSERT INTO notifications (user_id, title, message, read, ticket_id, created_at) VALUES
(5, 'Ticket actualizado', 'El ticket #6 ha cambiado a "Solucionado".', FALSE, 6, NOW() - INTERVAL '2 days'),
(5, 'Nuevo comentario en tu ticket', 'Carlos Martínez ha respondido al ticket #17.', FALSE, 17, NOW() - INTERVAL '1 day'),
(5, 'Ticket actualizado', 'El ticket #1 ha sido cerrado.', TRUE, 1, NOW() - INTERVAL '22 days');
INSERT INTO notifications (user_id, title, message, read, ticket_id, created_at) VALUES
(6, 'Nuevo comentario en tu ticket', 'Carlos Martínez ha respondido al ticket #7.', FALSE, 7, NOW() - INTERVAL '1 day'),
(6, 'Ticket en proceso', 'El ticket #14 ha sido asignado a Pedro López.', FALSE, 14, NOW() - INTERVAL '20 hours'),
(6, 'Ticket actualizado', 'El ticket #2 ha sido cerrado.', TRUE, 2, NOW() - INTERVAL '17 days');
INSERT INTO notifications (user_id, title, message, read, ticket_id, created_at) VALUES
(7, 'Ticket actualizado', 'El ticket #9 ha cambiado a "Pendiente".', FALSE, 9, NOW() - INTERVAL '4 days'),
(7, 'Nuevo comentario en tu ticket', 'Pedro López ha respondido al ticket #19.', FALSE, 19, NOW() - INTERVAL '7 days'),
(7, 'Ticket actualizado', 'El ticket #3 ha sido cerrado.', TRUE, 3, NOW() - INTERVAL '10 days');
INSERT INTO notifications (user_id, title, message, read, ticket_id, created_at) VALUES
(8, 'Ticket actualizado', 'El ticket #15 ha cambiado a "Solucionado".', FALSE, 15, NOW() - INTERVAL '1 day'),
(8, 'Nuevo comentario en tu ticket', 'Laura García ha respondido al ticket #21.', FALSE, 21, NOW() - INTERVAL '20 hours');
INSERT INTO notifications (user_id, title, message, read, ticket_id, created_at) VALUES
(9, 'Ticket actualizado', 'El ticket #23 ha cambiado a "Solucionado".', FALSE, 23, NOW() - INTERVAL '2 days'),
(9, 'Ticket actualizado', 'El ticket #5 ha sido cerrado.', TRUE, 5, NOW() - INTERVAL '7 days');
INSERT INTO notifications (user_id, title, message, read, ticket_id, created_at) VALUES
(10, 'Nuevo comentario en tu ticket', 'Laura García ha respondido al ticket #8.', FALSE, 8, NOW() - INTERVAL '2 days'),
(10, 'Ticket actualizado', 'El ticket #20 ha sido cerrado.', TRUE, 20, NOW() - INTERVAL '3 days');
INSERT INTO notifications (user_id, title, message, read, ticket_id, created_at) VALUES
(2, 'Nuevo ticket asignado', 'Se te ha asignado el ticket #24 "Servidor de archivos inaccesible".', FALSE, 24, NOW() - INTERVAL '5 hours'),
(2, 'Nuevo ticket en la bandeja', 'Se ha creado el ticket #22 "Sospecha de correo phishing recibido".', FALSE, 22, NOW() - INTERVAL '15 minutes'),
(3, 'Nuevo comentario', 'Javier Ruiz ha respondido al ticket #8.', FALSE, 8, NOW() - INTERVAL '2 days'),
(4, 'Nuevo comentario', 'El administrador ha respondido al ticket #24.', FALSE, 24, NOW() - INTERVAL '2 hours');
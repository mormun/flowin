-- 🔴 RESET
DROP TABLE IF EXISTS attachments CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS status CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 🟢 USERS
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

-- 🟢 CATEGORY
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT TRUE
);

-- 🟢 STATUS
CREATE TABLE status (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT TRUE
);

-- 🟢 TICKETS
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

-- 🟢 COMMENTS
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

-- 🟢 ATTACHMENTS
CREATE TABLE attachments (
  id SERIAL PRIMARY KEY,
  ticket_id INT NOT NULL,
  filename VARCHAR(255),
  file_path TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_ticket_attachment
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
);

-- 🟢 NOTIFICATIONS
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

CREATE INDEX idx_notifications_user_read_created
  ON notifications (user_id, read, created_at DESC);

-- 🔵 DATOS INICIALES

-- USERS
INSERT INTO users (name, surname, email, role, password_hash)
VALUES 
('Admin',    'Principal', 'admin@test.com', 'admin', '$2b$10$n7j39dmLcyRORCPnCWOp.OkYagNAHyCdvUea4GFNy5yEE1/J2Nqjq'),
('Tecnico',  'Soporte',   'tech@test.com',  'tech',  '$2b$10$n7j39dmLcyRORCPnCWOp.OkYagNAHyCdvUea4GFNy5yEE1/J2Nqjq'),
('Usuario',  'Prueba',    'user@test.com',  'user',  '$2b$10$n7j39dmLcyRORCPnCWOp.OkYagNAHyCdvUea4GFNy5yEE1/J2Nqjq');

-- CATEGORIES
INSERT INTO categories (name, description)
VALUES 
('Software', 'Problemas de software'),
('Hardware', 'Problemas de hardware');

-- STATUS
INSERT INTO status (name, description)
VALUES 
('Nuevo',       'Ticket recién abierto desde formulario'),
('Cancelado',   'Ticket cancelado antes de ser asignado'),
('Proceso',     'Ticket asignado a un técnico y en curso'),
('Pendiente',   'Ticket pausado por causa externa al técnico'),
('Solucionado', 'Se ha proporcionado una solución al ticket'),
('Cerrado',     'El usuario ha aceptado la solución');

-- TICKETS
INSERT INTO tickets (title, description, category_id, status_id, priority, created_by, assigned_to)
VALUES 
('Error login',    'No puedo iniciar sesión', 1, 1, 'Alta',  3, NULL),
('PC no enciende', 'Pantalla negra',           2, 3, 'Media', 3, 2);

-- COMMENTS
INSERT INTO comments (ticket_id, user_id, content, is_system)
VALUES 
(1, 2,    'Estamos revisando el problema', FALSE),
(2, 2,    'Se ha solicitado revisión física', FALSE),
(2, NULL, 'Estado cambiado a "Proceso"', TRUE);

-- ATTACHMENTS
INSERT INTO attachments (ticket_id, filename, file_path)
VALUES 
(1, 'error.png', '/files/error.png'),
(2, 'pc.jpg',    '/files/pc.jpg');

-- NOTIFICATIONS
INSERT INTO notifications (user_id, title, message, read, ticket_id)
VALUES
(3, 'Nuevo comentario en tu ticket', 'El técnico ha respondido al ticket "Error login".', FALSE, 1),
(3, 'Tu ticket está en proceso', 'El ticket "PC no enciende" ha sido asignado al técnico.', FALSE, 2),
(2, 'Nuevo ticket asignado', 'Se te ha asignado el ticket "PC no enciende".', TRUE, 2);


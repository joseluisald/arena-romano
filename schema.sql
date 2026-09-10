-- ====================================================================
-- BANCO DE DADOS: ARENA ROMANO (SISTEMA DE GESTÃO ESPORTIVA & COMANDAS)
-- Compatível com: MySQL 8.0+ / MariaDB 10.5+
-- ====================================================================

CREATE DATABASE IF NOT EXISTS `arena_romano` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `arena_romano`;

-- --------------------------------------------------------------------
-- 0. TABELA DE USUÁRIOS DO SISTEMA (Autenticação, Gestão & Permissões)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `username` VARCHAR(80) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'operador', 'gerente') NOT NULL DEFAULT 'admin',
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `avatar_url` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_email` (`email`),
  UNIQUE KEY `uk_users_username` (`username`),
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_active` (`active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 1. TABELA DE PRODUTOS & CARDÁPIO (Com Suporte a Preços Progressivos)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `products` (
  `id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `category` ENUM('cervejas', 'bebidas', 'churrasco', 'porcoes', 'snacks', 'diversos') NOT NULL DEFAULT 'diversos',
  `unit_price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `price_tiers` JSON NULL COMMENT 'Array JSON das faixas de preço progressivas por quantidade, ex: [{"quantity":1,"price":8.0},{"quantity":2,"price":15.0},{"quantity":4,"price":30.0}]',
  `description` VARCHAR(255) NULL,
  `icon` VARCHAR(50) NOT NULL DEFAULT 'Package',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_products_category` (`category`),
  INDEX `idx_products_active` (`active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 2. TABELA DE HORÁRIOS DA QUADRA (Slots Fixos de Locação)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `court_schedules` (
  `id` VARCHAR(64) NOT NULL,
  `time` VARCHAR(10) NOT NULL COMMENT 'Horário de início (ex: "19:00", "20:00")',
  `duration_minutes` INT NOT NULL DEFAULT 60,
  `default_price` DECIMAL(10, 2) NOT NULL DEFAULT 150.00,
  `is_blocked` TINYINT(1) NOT NULL DEFAULT 0,
  `label` VARCHAR(100) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_schedule_time` (`time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 3. TABELA DE JOGOS & PARTIDAS (Agendamentos da Quadra)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `games` (
  `id` VARCHAR(64) NOT NULL,
  `title` VARCHAR(150) NOT NULL,
  `date` DATE NOT NULL,
  `start_time` VARCHAR(10) NOT NULL COMMENT 'ex: "20:00"',
  `end_time` VARCHAR(10) NOT NULL COMMENT 'ex: "21:00"',
  `duration_minutes` INT NOT NULL DEFAULT 60,
  `court_price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `status` ENUM('agendado', 'em_andamento', 'finalizado') NOT NULL DEFAULT 'agendado',
  `notes` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_games_date` (`date`),
  INDEX `idx_games_status` (`status`),
  INDEX `idx_games_date_status` (`date`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 4. TABELA DE JOGADORES NA PARTIDA (Comandas Individuais)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `game_players` (
  `id` VARCHAR(64) NOT NULL,
  `game_id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `raw_tag` VARCHAR(50) NULL COMMENT 'Tag de importação do WhatsApp (ex: "12+1", "Goleiro", "Convidado")',
  `is_present` TINYINT(1) NOT NULL DEFAULT 0,
  `is_paid` TINYINT(1) NOT NULL DEFAULT 0,
  `payment_method` ENUM('pix', 'dinheiro', 'cartao') NULL,
  `paid_at` TIMESTAMP NULL DEFAULT NULL,
  `total_consumption` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_players_game_id` (`game_id`),
  INDEX `idx_players_is_paid` (`is_paid`),
  CONSTRAINT `fk_players_game` 
    FOREIGN KEY (`game_id`) REFERENCES `games` (`id`) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 5. TABELA DE CONSUMOS / ITENS DA COMANDA (Lançamentos em Tempo Real)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `consumptions` (
  `id` VARCHAR(64) NOT NULL,
  `game_id` VARCHAR(64) NOT NULL,
  `player_id` VARCHAR(64) NOT NULL,
  `product_id` VARCHAR(64) NULL,
  `product_name` VARCHAR(150) NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `unit_price` DECIMAL(10, 2) NULL,
  `calculated_total_price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `applied_breakdown` VARCHAR(255) NULL COMMENT 'Detalhamento do cálculo progressivo (ex: "1x [Combo 4 un = R$ 30,00]")',
  `time_formatted` VARCHAR(10) NOT NULL COMMENT 'Hora do lançamento (ex: "20:15")',
  `is_custom` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_consumptions_game` (`game_id`),
  INDEX `idx_consumptions_player` (`player_id`),
  INDEX `idx_consumptions_product` (`product_id`),
  CONSTRAINT `fk_consumptions_game` 
    FOREIGN KEY (`game_id`) REFERENCES `games` (`id`) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE,
  CONSTRAINT `fk_consumptions_player` 
    FOREIGN KEY (`player_id`) REFERENCES `game_players` (`id`) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE,
  CONSTRAINT `fk_consumptions_product` 
    FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) 
    ON DELETE SET NULL 
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 6. TABELA DE FECHAMENTOS DIÁRIOS & AUDITORIA FINANCEIRA (Opcional)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `daily_closings` (
  `id` VARCHAR(64) NOT NULL,
  `date` DATE NOT NULL,
  `games_count` INT NOT NULL DEFAULT 0,
  `court_revenue` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `products_revenue` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `total_revenue` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `total_paid` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `total_pending` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `summary_json` JSON NULL,
  `closed_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_closing_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 7. TABELA DE LOGS DE REQUISIÇÕES & AUDITORIA DO SERVIDOR
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `system_logs` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `method` VARCHAR(10) NOT NULL,
  `url` VARCHAR(255) NOT NULL,
  `status_code` INT NOT NULL,
  `duration_ms` INT NOT NULL,
  `user_identifier` VARCHAR(100) NULL,
  `client_ip` VARCHAR(45) NULL,
  `timestamp` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_logs_timestamp` (`timestamp`),
  INDEX `idx_logs_status` (`status_code`),
  INDEX `idx_logs_user` (`user_identifier`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- MySQL dump 10.13  Distrib 9.2.0, for Win64 (x86_64)
--
-- Host: localhost    Database: hotel_udhayam
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `api_keys`
--

DROP TABLE IF EXISTS `api_keys`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `api_keys` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `key_hash` varchar(64) NOT NULL COMMENT 'SHA-256 hash of the API key',
  `key_prefix` varchar(8) NOT NULL COMMENT 'First 8 chars of key for identification',
  `channel_id` int NOT NULL,
  `permissions` json NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `expires_at` datetime DEFAULT NULL,
  `rate_limit` int DEFAULT '1000' COMMENT 'Max requests per 15 minutes',
  `last_used_at` datetime DEFAULT NULL,
  `request_count` int DEFAULT '0',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `key_hash` (`key_hash`),
  UNIQUE KEY `key_hash_2` (`key_hash`),
  UNIQUE KEY `key_hash_3` (`key_hash`),
  UNIQUE KEY `key_hash_4` (`key_hash`),
  UNIQUE KEY `key_hash_5` (`key_hash`),
  UNIQUE KEY `key_hash_6` (`key_hash`),
  UNIQUE KEY `key_hash_7` (`key_hash`),
  UNIQUE KEY `key_hash_8` (`key_hash`),
  UNIQUE KEY `key_hash_9` (`key_hash`),
  UNIQUE KEY `key_hash_10` (`key_hash`),
  UNIQUE KEY `key_hash_11` (`key_hash`),
  UNIQUE KEY `key_hash_12` (`key_hash`),
  UNIQUE KEY `key_hash_13` (`key_hash`),
  UNIQUE KEY `key_hash_14` (`key_hash`),
  UNIQUE KEY `key_hash_15` (`key_hash`),
  UNIQUE KEY `key_hash_16` (`key_hash`),
  UNIQUE KEY `key_hash_17` (`key_hash`),
  UNIQUE KEY `key_hash_18` (`key_hash`),
  UNIQUE KEY `key_hash_19` (`key_hash`),
  UNIQUE KEY `key_hash_20` (`key_hash`),
  UNIQUE KEY `key_hash_21` (`key_hash`),
  UNIQUE KEY `key_hash_22` (`key_hash`),
  UNIQUE KEY `key_hash_23` (`key_hash`),
  UNIQUE KEY `key_hash_24` (`key_hash`),
  UNIQUE KEY `key_hash_25` (`key_hash`),
  UNIQUE KEY `key_hash_26` (`key_hash`),
  UNIQUE KEY `key_hash_27` (`key_hash`),
  UNIQUE KEY `key_hash_28` (`key_hash`),
  UNIQUE KEY `key_hash_29` (`key_hash`),
  UNIQUE KEY `key_hash_30` (`key_hash`),
  KEY `channel_id` (`channel_id`),
  CONSTRAINT `api_keys_ibfk_1` FOREIGN KEY (`channel_id`) REFERENCES `ota_channels` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `api_keys`
--

LOCK TABLES `api_keys` WRITE;
/*!40000 ALTER TABLE `api_keys` DISABLE KEYS */;
/*!40000 ALTER TABLE `api_keys` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_log`
--

DROP TABLE IF EXISTS `audit_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `action` varchar(50) NOT NULL,
  `entity_type` varchar(50) NOT NULL,
  `entity_id` int DEFAULT NULL,
  `old_values` json DEFAULT NULL,
  `new_values` json DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `source` varchar(30) DEFAULT 'user' COMMENT 'system, api, user, ota',
  `channel_id` int DEFAULT NULL COMMENT 'FK to OtaChannel for OTA-originated actions',
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `channel_id` (`channel_id`),
  CONSTRAINT `audit_log_ibfk_59` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `audit_log_ibfk_60` FOREIGN KEY (`channel_id`) REFERENCES `ota_channels` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_log`
--

LOCK TABLES `audit_log` WRITE;
/*!40000 ALTER TABLE `audit_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `audit_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `billing_items`
--

DROP TABLE IF EXISTS `billing_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `billing_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `billing_id` int NOT NULL,
  `item_type` enum('room_charge','restaurant','laundry','minibar','service','tax','discount') NOT NULL,
  `description` varchar(255) NOT NULL,
  `quantity` decimal(10,2) DEFAULT '1.00',
  `unit_price` decimal(10,2) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `hsn_code` varchar(10) DEFAULT NULL,
  `gst_rate` decimal(5,2) DEFAULT '0.00',
  `date` date NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `billing_id` (`billing_id`),
  CONSTRAINT `billing_items_ibfk_1` FOREIGN KEY (`billing_id`) REFERENCES `billings` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `billing_items`
--

LOCK TABLES `billing_items` WRITE;
/*!40000 ALTER TABLE `billing_items` DISABLE KEYS */;
INSERT INTO `billing_items` VALUES (1,1,'room_charge','Room 101 - 1 night(s) @ ₹2000/night',1.00,2000.00,2000.00,'996311',12.00,'2026-04-08','2026-04-08 08:52:20','2026-04-08 08:52:20'),(2,1,'service','Extra Bed (1 night x 1 bed @ ₹500/night)',1.00,500.00,500.00,'996311',0.00,'2026-04-08','2026-04-08 08:52:20','2026-04-08 08:52:20'),(3,2,'room_charge','Room 102 - 1 night(s) @ ₹2000/night',1.00,2000.00,2000.00,'996311',12.00,'2026-04-08','2026-04-08 11:42:05','2026-04-08 11:42:05'),(4,3,'room_charge','Room 103 - 2 night(s) @ ₹2000/night',2.00,2000.00,4000.00,'996311',12.00,'2026-04-08','2026-04-08 11:42:43','2026-04-08 11:42:43');
/*!40000 ALTER TABLE `billing_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `billings`
--

DROP TABLE IF EXISTS `billings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `billings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `invoice_number` varchar(20) NOT NULL,
  `reservation_id` int DEFAULT NULL,
  `guest_id` int NOT NULL,
  `subtotal` decimal(12,2) DEFAULT '0.00',
  `cgst_amount` decimal(10,2) DEFAULT '0.00',
  `sgst_amount` decimal(10,2) DEFAULT '0.00',
  `igst_amount` decimal(10,2) DEFAULT '0.00',
  `discount_amount` decimal(10,2) DEFAULT '0.00',
  `grand_total` decimal(12,2) DEFAULT '0.00',
  `payment_status` enum('unpaid','partial','paid','refunded') DEFAULT 'unpaid',
  `paid_amount` decimal(12,2) DEFAULT '0.00',
  `balance_due` decimal(12,2) DEFAULT '0.00',
  `due_date` date DEFAULT NULL,
  `notes` text,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `billings_invoice_number` (`invoice_number`),
  KEY `reservation_id` (`reservation_id`),
  KEY `guest_id` (`guest_id`),
  CONSTRAINT `billings_ibfk_85` FOREIGN KEY (`reservation_id`) REFERENCES `reservations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `billings_ibfk_86` FOREIGN KEY (`guest_id`) REFERENCES `guests` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `billings`
--

LOCK TABLES `billings` WRITE;
/*!40000 ALTER TABLE `billings` DISABLE KEYS */;
INSERT INTO `billings` VALUES (1,'INV-1775638340901',1,1,2500.00,108.00,108.00,0.00,250.00,2466.00,'unpaid',0.00,2466.00,NULL,'OM Discount: 10.00%','2026-04-08 08:52:20','2026-04-08 08:52:20'),(2,'INV-1775648525116',4,1,2000.00,120.00,120.00,0.00,0.00,2240.00,'unpaid',0.00,2240.00,NULL,NULL,'2026-04-08 11:42:05','2026-04-08 11:42:05'),(3,'INV-1775648563419',5,1,4000.00,240.00,240.00,0.00,0.00,4480.00,'unpaid',0.00,4480.00,NULL,NULL,'2026-04-08 11:42:43','2026-04-08 11:42:43');
/*!40000 ALTER TABLE `billings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `channel_rate_mappings`
--

DROP TABLE IF EXISTS `channel_rate_mappings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `channel_rate_mappings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `channel_id` int NOT NULL,
  `rate_plan_id` int NOT NULL,
  `ota_room_code` varchar(100) NOT NULL COMMENT 'Room type code on the OTA',
  `ota_rate_code` varchar(100) NOT NULL COMMENT 'Rate plan code on the OTA',
  `markup_type` enum('percentage','fixed') DEFAULT 'percentage',
  `markup_value` decimal(10,2) DEFAULT '0.00',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `channel_rate_mappings_channel_id_rate_plan_id` (`channel_id`,`rate_plan_id`),
  KEY `rate_plan_id` (`rate_plan_id`),
  CONSTRAINT `channel_rate_mappings_ibfk_59` FOREIGN KEY (`channel_id`) REFERENCES `ota_channels` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `channel_rate_mappings_ibfk_60` FOREIGN KEY (`rate_plan_id`) REFERENCES `rate_plans` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `channel_rate_mappings`
--

LOCK TABLES `channel_rate_mappings` WRITE;
/*!40000 ALTER TABLE `channel_rate_mappings` DISABLE KEYS */;
/*!40000 ALTER TABLE `channel_rate_mappings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `channel_sync_logs`
--

DROP TABLE IF EXISTS `channel_sync_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `channel_sync_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `channel_id` int NOT NULL,
  `direction` enum('inbound','outbound') NOT NULL,
  `operation` varchar(50) NOT NULL COMMENT 'e.g. push_availability, push_rates, booking_create',
  `endpoint` varchar(500) DEFAULT NULL,
  `request_payload` json DEFAULT NULL,
  `response_payload` json DEFAULT NULL,
  `status` enum('success','failed','timeout','pending') DEFAULT 'pending',
  `status_code` int DEFAULT NULL,
  `error_message` text,
  `duration_ms` int DEFAULT NULL,
  `retry_count` int DEFAULT '0',
  `correlation_id` varchar(50) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `channel_id` (`channel_id`),
  CONSTRAINT `channel_sync_logs_ibfk_1` FOREIGN KEY (`channel_id`) REFERENCES `ota_channels` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `channel_sync_logs`
--

LOCK TABLES `channel_sync_logs` WRITE;
/*!40000 ALTER TABLE `channel_sync_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `channel_sync_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `guests`
--

DROP TABLE IF EXISTS `guests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `guests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) NOT NULL,
  `address` text,
  `city` varchar(50) DEFAULT NULL,
  `state` varchar(50) DEFAULT NULL,
  `pincode` varchar(10) DEFAULT NULL,
  `id_proof_type` enum('aadhaar','passport','driving_license','voter_id','pan') DEFAULT NULL,
  `id_proof_number` varchar(50) DEFAULT NULL,
  `gstin` varchar(20) DEFAULT NULL,
  `company_name` varchar(100) DEFAULT NULL,
  `vip_status` tinyint(1) DEFAULT '0',
  `total_stays` int DEFAULT '0',
  `notes` text,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `guests`
--

LOCK TABLES `guests` WRITE;
/*!40000 ALTER TABLE `guests` DISABLE KEYS */;
INSERT INTO `guests` VALUES (1,'Praburajan','Ekambaram','epraburajan@gmail.com','09600037999',NULL,NULL,NULL,NULL,'aadhaar','1233',NULL,NULL,0,0,NULL,'2026-03-16 08:54:09','2026-04-08 08:52:20');
/*!40000 ALTER TABLE `guests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hotel_settings`
--

DROP TABLE IF EXISTS `hotel_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hotel_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `key` varchar(50) NOT NULL,
  `value` text,
  `category` varchar(50) DEFAULT 'general',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `hotel_settings_key` (`key`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hotel_settings`
--

LOCK TABLES `hotel_settings` WRITE;
/*!40000 ALTER TABLE `hotel_settings` DISABLE KEYS */;
INSERT INTO `hotel_settings` VALUES (1,'hotel_name','Hotel Udhayam International','general','2026-03-15 11:27:22','2026-03-15 11:27:22'),(2,'hotel_address','123 Main Street, Madurai','general','2026-03-15 11:27:22','2026-03-15 11:27:22'),(3,'hotel_phone','+91 4522345678','general','2026-03-15 11:27:22','2026-03-15 11:27:22'),(4,'hotel_email','info@hoteludhayam.com','general','2026-03-15 11:27:22','2026-03-15 11:27:22'),(5,'hotel_gstin','33XXXXX1234X1ZX','billing','2026-03-15 11:27:22','2026-03-15 11:27:22'),(6,'check_in_time','14:00','operations','2026-03-15 11:27:22','2026-03-15 11:27:22'),(7,'check_out_time','11:00','operations','2026-03-15 11:27:22','2026-03-15 11:27:22'),(8,'timezone','Asia/Kolkata','general','2026-03-15 11:27:22','2026-03-15 11:27:22'),(9,'currency','INR','billing','2026-03-15 11:27:22','2026-03-15 11:27:22'),(10,'currency_symbol','₹','billing','2026-03-15 11:27:22','2026-03-15 11:27:22'),(11,'gst_enabled','true','billing','2026-03-15 11:27:22','2026-03-15 11:27:22'),(12,'cgst_rate','6','billing','2026-03-15 11:27:22','2026-03-15 11:27:22'),(13,'sgst_rate','6','billing','2026-03-15 11:27:22','2026-03-15 11:27:22');
/*!40000 ALTER TABLE `hotel_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `housekeeping_tasks`
--

DROP TABLE IF EXISTS `housekeeping_tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `housekeeping_tasks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `room_id` int NOT NULL,
  `assigned_to` int DEFAULT NULL,
  `task_type` enum('cleaning','deep_cleaning','turnover','inspection','amenity_restock') DEFAULT 'cleaning',
  `status` enum('pending','in_progress','completed','verified') DEFAULT 'pending',
  `priority` enum('low','medium','high','urgent') DEFAULT 'medium',
  `notes` text,
  `started_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `room_id` (`room_id`),
  KEY `assigned_to` (`assigned_to`),
  CONSTRAINT `housekeeping_tasks_ibfk_77` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `housekeeping_tasks_ibfk_78` FOREIGN KEY (`assigned_to`) REFERENCES `staff` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `housekeeping_tasks`
--

LOCK TABLES `housekeeping_tasks` WRITE;
/*!40000 ALTER TABLE `housekeeping_tasks` DISABLE KEYS */;
/*!40000 ALTER TABLE `housekeeping_tasks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory_items`
--

DROP TABLE IF EXISTS `inventory_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `category` enum('housekeeping','kitchen','maintenance','office','amenities','linen','other') NOT NULL,
  `sku` varchar(30) DEFAULT NULL,
  `unit` varchar(20) DEFAULT 'pcs',
  `current_stock` decimal(10,2) DEFAULT '0.00',
  `min_stock_level` decimal(10,2) DEFAULT '0.00',
  `unit_cost` decimal(10,2) DEFAULT '0.00',
  `supplier` varchar(100) DEFAULT NULL,
  `status` enum('in_stock','low_stock','out_of_stock') DEFAULT 'in_stock',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `inventory_items_sku` (`sku`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_items`
--

LOCK TABLES `inventory_items` WRITE;
/*!40000 ALTER TABLE `inventory_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `inventory_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory_transactions`
--

DROP TABLE IF EXISTS `inventory_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory_transactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `item_id` int NOT NULL,
  `transaction_type` enum('purchase','usage','adjustment','return','waste') NOT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `reference` varchar(100) DEFAULT NULL,
  `notes` text,
  `created_by` int DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `item_id` (`item_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `inventory_transactions_ibfk_63` FOREIGN KEY (`item_id`) REFERENCES `inventory_items` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `inventory_transactions_ibfk_64` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_transactions`
--

LOCK TABLES `inventory_transactions` WRITE;
/*!40000 ALTER TABLE `inventory_transactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `inventory_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `laundry_order_items`
--

DROP TABLE IF EXISTS `laundry_order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `laundry_order_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `item_name` varchar(100) NOT NULL,
  `category` enum('topwear','bottomwear','ethnic','innerwear','accessories','other') DEFAULT 'topwear',
  `quantity` int NOT NULL DEFAULT '1',
  `unit_price` decimal(10,2) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  CONSTRAINT `laundry_order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `laundry_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `laundry_order_items`
--

LOCK TABLES `laundry_order_items` WRITE;
/*!40000 ALTER TABLE `laundry_order_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `laundry_order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `laundry_orders`
--

DROP TABLE IF EXISTS `laundry_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `laundry_orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_number` varchar(20) NOT NULL,
  `reservation_id` int DEFAULT NULL,
  `room_id` int DEFAULT NULL,
  `guest_id` int DEFAULT NULL,
  `status` enum('pending','collected','washing','ironing','ready','delivered','cancelled') DEFAULT 'pending',
  `service_type` enum('regular','express','dry_clean') DEFAULT 'regular',
  `subtotal` decimal(10,2) DEFAULT '0.00',
  `tax_amount` decimal(10,2) DEFAULT '0.00',
  `total` decimal(10,2) DEFAULT '0.00',
  `posted_to_room` tinyint(1) DEFAULT '0',
  `collected_at` datetime DEFAULT NULL,
  `delivered_at` datetime DEFAULT NULL,
  `expected_delivery` datetime DEFAULT NULL,
  `notes` text,
  `created_by` int DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `laundry_orders_order_number` (`order_number`),
  KEY `reservation_id` (`reservation_id`),
  KEY `room_id` (`room_id`),
  KEY `guest_id` (`guest_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `laundry_orders_ibfk_65` FOREIGN KEY (`reservation_id`) REFERENCES `reservations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `laundry_orders_ibfk_66` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `laundry_orders_ibfk_67` FOREIGN KEY (`guest_id`) REFERENCES `guests` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `laundry_orders_ibfk_68` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `laundry_orders`
--

LOCK TABLES `laundry_orders` WRITE;
/*!40000 ALTER TABLE `laundry_orders` DISABLE KEYS */;
/*!40000 ALTER TABLE `laundry_orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `maintenance_requests`
--

DROP TABLE IF EXISTS `maintenance_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `maintenance_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `room_id` int DEFAULT NULL,
  `reported_by` int DEFAULT NULL,
  `assigned_to` int DEFAULT NULL,
  `issue_type` enum('plumbing','electrical','hvac','furniture','appliance','structural','other') NOT NULL,
  `description` text NOT NULL,
  `priority` enum('low','medium','high','urgent') DEFAULT 'medium',
  `status` enum('reported','assigned','in_progress','completed','cancelled') DEFAULT 'reported',
  `completed_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `room_id` (`room_id`),
  KEY `reported_by` (`reported_by`),
  KEY `assigned_to` (`assigned_to`),
  CONSTRAINT `maintenance_requests_ibfk_109` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `maintenance_requests_ibfk_110` FOREIGN KEY (`reported_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `maintenance_requests_ibfk_111` FOREIGN KEY (`assigned_to`) REFERENCES `staff` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `maintenance_requests`
--

LOCK TABLES `maintenance_requests` WRITE;
/*!40000 ALTER TABLE `maintenance_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `maintenance_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `menu_items`
--

DROP TABLE IF EXISTS `menu_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `menu_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `category` enum('breakfast','lunch','salads','starters','soups','chinese','gravy','indian_breads','rice_biryani','indian_curries','evening_snacks','dinner','juices_shakes','hot_beverages','main_course','desserts','beverages','snacks') NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `is_veg` tinyint(1) DEFAULT '1',
  `is_available` tinyint(1) DEFAULT '1',
  `description` text,
  `hsn_code` varchar(10) DEFAULT '996331',
  `gst_rate` decimal(5,2) DEFAULT '5.00',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=85 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `menu_items`
--

LOCK TABLES `menu_items` WRITE;
/*!40000 ALTER TABLE `menu_items` DISABLE KEYS */;
INSERT INTO `menu_items` VALUES (1,'Mini Tiffin (Idly, Kal Dosa, Pongal, Poori, Vada, Sweet)','breakfast',145.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(2,'Idly (1 Set)','breakfast',45.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(3,'Plain Dosa','breakfast',75.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(4,'Onion Dosa','breakfast',85.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(5,'Ghee Roast','breakfast',130.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(6,'Masala Dosa','breakfast',110.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(7,'Kal Dosa (1 Set)','breakfast',85.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(8,'Pongal','breakfast',90.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(9,'Poori','breakfast',95.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(10,'Veg Meals','lunch',170.00,1,1,'Rice, Poori/Chapati, Kootu, Poriyal, Sambar, Rasam, Buttermilk, Pickle, Kurum, Vathakulambu, Sweet, Appalam, Fruits','996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(11,'Mini Meals (Sambar Rice, Curd Rice)','lunch',120.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(12,'Fried Rice, Pickle, Poriyal','lunch',110.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(13,'Sambar Rice, Curd Rice','lunch',100.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(14,'Green Salad','salads',95.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(15,'Fruit Salad','salads',100.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(16,'Mix Veg Salad','salads',95.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(17,'Finger Chips','starters',120.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(18,'Babycorn Pepper Fry','starters',195.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(19,'Gobi Manchurian Dry / Gravy','starters',195.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(20,'Chilli Gobi Dry / Gravy','starters',195.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(21,'Gobi 65','starters',195.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(22,'Mushroom 65','starters',205.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(23,'Mushroom Pepper Fry','starters',205.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(24,'Mushroom Manchurian Dry / Gravy','starters',205.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(25,'Veg Clear Soup','soups',100.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(26,'Hot & Sour Veg Clear Soup','soups',110.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(27,'Cream of Mushroom','soups',110.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(28,'Cream of Tomato','soups',110.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(29,'Veg Fried Rice / Noodles','chinese',225.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(30,'Schezwan Fried Rice / Noodles','chinese',225.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(31,'Paneer Fried Rice / Noodles','chinese',225.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(32,'Mushroom Fried Rice / Noodles','chinese',225.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(33,'Chilli Mushroom Dry / Gravy','gravy',205.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(34,'Chilli Paneer Dry / Gravy','gravy',220.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(35,'Paneer','gravy',65.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(36,'Chapati (2 Pcs)','indian_breads',85.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(37,'Pulka (2 Pcs)','indian_breads',50.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(38,'Pulka (2 Pcs) with Mushroom Masala / Manchurian','indian_breads',145.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(39,'Wheat Parota (2 Pcs)','indian_breads',85.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(40,'Kothu Parota','indian_breads',120.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(41,'Chilly Parota','indian_breads',120.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(42,'Jeera Rice','rice_biryani',180.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(43,'Veg Pulao','rice_biryani',185.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(44,'Veg Biryani','rice_biryani',180.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(45,'Paneer Biryani','rice_biryani',230.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(46,'Mushroom Biryani','rice_biryani',220.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(47,'Mixed Biryani','rice_biryani',210.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(48,'Aloo Gobi Masala','indian_curries',170.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(49,'Mushroom Masala','indian_curries',205.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(50,'Paneer Butter Masala','indian_curries',220.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(51,'Mix Veg Curry','indian_curries',180.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(52,'Aloo Capsicum Curry','indian_curries',170.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(53,'Kadai Veg','indian_curries',175.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(54,'Kadai Paneer','indian_curries',220.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(55,'Kadai Mushroom','indian_curries',205.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(56,'Channa Masala','indian_curries',170.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(57,'Green Peas Masala','indian_curries',170.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(58,'Onion Bajji','evening_snacks',90.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(59,'Onion Pakoda','evening_snacks',90.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(60,'Onion Bonda','evening_snacks',90.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(61,'Idly (1 Set)','dinner',45.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(62,'Plain Dosa','dinner',85.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(63,'Masala Dosa','dinner',110.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(64,'Rava Dosa','dinner',110.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(65,'Onion Rava Dosa','dinner',110.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(66,'Kal Dosa (1 Set)','dinner',85.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(67,'Onion Uttappam','dinner',85.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(68,'Appam','dinner',75.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(69,'Idiyappam with Coconut Milk','dinner',105.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(70,'Onion Dosa','dinner',95.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(71,'Paneer Dosa','dinner',160.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(72,'Ghee Roast','dinner',130.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(73,'Mushroom Dosa','dinner',130.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(74,'Ginger Capsicum Dosa','dinner',110.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(75,'Pineapple Juice','juices_shakes',110.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(76,'Apple Juice','juices_shakes',110.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(77,'Fresh Lime','juices_shakes',75.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(78,'Sweet Lime','juices_shakes',75.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(79,'Watermelon Juice','juices_shakes',95.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(80,'Lassi','juices_shakes',75.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(81,'Milkshake (Vanilla / Chocolate / Butterscotch)','juices_shakes',120.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(82,'Tea / Coffee / Milk','hot_beverages',45.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(83,'Horlicks / Boost','hot_beverages',50.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51'),(84,'Pepper Milk','hot_beverages',50.00,1,1,NULL,'996331',5.00,'2026-04-08 18:35:51','2026-04-08 18:35:51');
/*!40000 ALTER TABLE `menu_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ota_channels`
--

DROP TABLE IF EXISTS `ota_channels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ota_channels` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `code` varchar(30) NOT NULL,
  `is_active` tinyint(1) DEFAULT '0',
  `api_url` varchar(500) DEFAULT NULL,
  `api_credentials` text COMMENT 'AES-256-GCM encrypted JSON with API key/secret',
  `hotel_id_on_ota` varchar(100) DEFAULT NULL COMMENT 'Property ID as registered on the OTA',
  `webhook_secret` varchar(255) DEFAULT NULL,
  `commission_percentage` decimal(5,2) DEFAULT '0.00',
  `sync_config` json DEFAULT NULL,
  `last_sync_at` datetime DEFAULT NULL,
  `contact_email` varchar(255) DEFAULT NULL,
  `notes` text,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ota_channels_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ota_channels`
--

LOCK TABLES `ota_channels` WRITE;
/*!40000 ALTER TABLE `ota_channels` DISABLE KEYS */;
/*!40000 ALTER TABLE `ota_channels` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ota_reconciliations`
--

DROP TABLE IF EXISTS `ota_reconciliations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ota_reconciliations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `channel_id` int NOT NULL,
  `period_start` date NOT NULL,
  `period_end` date NOT NULL,
  `total_bookings` int DEFAULT '0',
  `total_revenue` decimal(12,2) DEFAULT '0.00',
  `total_commission` decimal(12,2) DEFAULT '0.00',
  `net_amount` decimal(12,2) DEFAULT '0.00',
  `ota_payout_amount` decimal(12,2) DEFAULT NULL COMMENT 'Amount reported by OTA',
  `discrepancy_amount` decimal(12,2) DEFAULT NULL,
  `status` enum('draft','generated','matched','discrepancy','resolved') DEFAULT 'draft',
  `cancellations` int DEFAULT '0',
  `notes` text,
  `generated_by` int DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `channel_id` (`channel_id`),
  KEY `generated_by` (`generated_by`),
  CONSTRAINT `ota_reconciliations_ibfk_55` FOREIGN KEY (`channel_id`) REFERENCES `ota_channels` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ota_reconciliations_ibfk_56` FOREIGN KEY (`generated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ota_reconciliations`
--

LOCK TABLES `ota_reconciliations` WRITE;
/*!40000 ALTER TABLE `ota_reconciliations` DISABLE KEYS */;
/*!40000 ALTER TABLE `ota_reconciliations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `packages`
--

DROP TABLE IF EXISTS `packages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `packages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text,
  `room_type` enum('standard_single','standard_double','executive_single','executive_double','comfort_single','comfort_double','comfort_executive_double','comfort_executive_triple','suite_triple') DEFAULT NULL,
  `duration_nights` int DEFAULT '1',
  `price` decimal(10,2) NOT NULL,
  `inclusions` json DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `packages`
--

LOCK TABLES `packages` WRITE;
/*!40000 ALTER TABLE `packages` DISABLE KEYS */;
/*!40000 ALTER TABLE `packages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `billing_id` int NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `payment_method` enum('cash','card','upi','bank_transfer','ota_collected') NOT NULL,
  `transaction_ref` varchar(100) DEFAULT NULL,
  `payment_date` datetime DEFAULT NULL,
  `received_by` int DEFAULT NULL,
  `notes` text,
  `ota_transaction_id` varchar(100) DEFAULT NULL,
  `settlement_status` enum('na','pending','settled','disputed') DEFAULT 'na',
  `settlement_date` date DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `billing_id` (`billing_id`),
  KEY `received_by` (`received_by`),
  CONSTRAINT `payments_ibfk_81` FOREIGN KEY (`billing_id`) REFERENCES `billings` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `payments_ibfk_82` FOREIGN KEY (`received_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `promotions`
--

DROP TABLE IF EXISTS `promotions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `promotions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(20) NOT NULL,
  `name` varchar(100) NOT NULL,
  `discount_type` enum('percentage','fixed') NOT NULL,
  `discount_value` decimal(10,2) NOT NULL,
  `min_stay` int DEFAULT '1',
  `valid_from` date DEFAULT NULL,
  `valid_to` date DEFAULT NULL,
  `usage_limit` int DEFAULT NULL,
  `times_used` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `promotions_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `promotions`
--

LOCK TABLES `promotions` WRITE;
/*!40000 ALTER TABLE `promotions` DISABLE KEYS */;
/*!40000 ALTER TABLE `promotions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rate_plans`
--

DROP TABLE IF EXISTS `rate_plans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rate_plans` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `room_type` enum('standard_single','standard_double','executive_single','executive_double','comfort_single','comfort_double','comfort_executive_double','comfort_executive_triple','suite_triple') DEFAULT NULL,
  `season` enum('regular','peak','off_peak','festive') DEFAULT 'regular',
  `base_rate` decimal(10,2) NOT NULL,
  `weekend_rate` decimal(10,2) DEFAULT NULL,
  `meal_plan` enum('ep','cp','map','ap') DEFAULT 'ep',
  `is_active` tinyint(1) DEFAULT '1',
  `valid_from` date DEFAULT NULL,
  `valid_to` date DEFAULT NULL,
  `is_ota_visible` tinyint(1) DEFAULT '0' COMMENT 'Whether this rate plan is pushed to OTAs',
  `hourly_rate` decimal(10,2) DEFAULT NULL COMMENT 'Per-hour rate for short-stay bookings',
  `min_hours` int DEFAULT '2' COMMENT 'Minimum booking hours for hourly stays',
  `max_hours` int DEFAULT '8' COMMENT 'Maximum hours before nightly booking required',
  `cancellation_policy` varchar(50) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rate_plans`
--

LOCK TABLES `rate_plans` WRITE;
/*!40000 ALTER TABLE `rate_plans` DISABLE KEYS */;
/*!40000 ALTER TABLE `rate_plans` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `refresh_tokens`
--

DROP TABLE IF EXISTS `refresh_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `refresh_tokens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `token` varchar(500) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `refresh_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `refresh_tokens`
--

LOCK TABLES `refresh_tokens` WRITE;
/*!40000 ALTER TABLE `refresh_tokens` DISABLE KEYS */;
INSERT INTO `refresh_tokens` VALUES (23,1,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidGVuYW50X2RiIjoiaG90ZWxfdWRoYXlhbSIsImlhdCI6MTc3NTY1NjAwOSwiZXhwIjoxNzc2MjYwODA5fQ.FaSeyfMQ6z5trtXPpcN_tOBQ2tVU1PSj2eayHkPb62E','2026-04-15 13:46:49','2026-04-08 13:46:49','2026-04-08 13:46:49');
/*!40000 ALTER TABLE `refresh_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reservations`
--

DROP TABLE IF EXISTS `reservations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reservations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `reservation_number` varchar(20) NOT NULL,
  `guest_id` int NOT NULL,
  `room_id` int NOT NULL,
  `check_in_date` date NOT NULL,
  `check_out_date` date NOT NULL,
  `actual_check_in` datetime DEFAULT NULL,
  `actual_check_out` datetime DEFAULT NULL,
  `status` enum('enquiry','pending','confirmed','checked_in','checked_out','cancelled','no_show') DEFAULT 'pending',
  `adults` int DEFAULT '1',
  `children` int DEFAULT '0',
  `nights` int DEFAULT NULL,
  `source` varchar(30) DEFAULT 'direct',
  `rate_per_night` decimal(10,2) NOT NULL,
  `total_amount` decimal(10,2) DEFAULT NULL,
  `advance_paid` decimal(10,2) DEFAULT '0.00',
  `special_requests` text,
  `created_by` int DEFAULT NULL,
  `ota_booking_id` varchar(100) DEFAULT NULL COMMENT 'Booking reference from OTA',
  `channel_id` int DEFAULT NULL COMMENT 'FK to OtaChannel - null means direct booking',
  `ota_commission` decimal(10,2) DEFAULT NULL COMMENT 'Commission amount for this booking',
  `cancellation_policy` varchar(50) DEFAULT NULL COMMENT 'e.g. non_refundable, free_cancellation',
  `booking_type` enum('nightly','hourly') DEFAULT 'nightly' COMMENT 'nightly = standard stay, hourly = short stay (2-8 hours)',
  `expected_hours` int DEFAULT NULL COMMENT 'Booked duration in hours for hourly bookings',
  `hourly_rate` decimal(10,2) DEFAULT NULL COMMENT 'Rate per hour for hourly bookings',
  `expected_checkout_time` datetime DEFAULT NULL COMMENT 'Computed: actual_check_in + expected_hours (for hourly bookings)',
  `meal_plan` enum('none','breakfast','dinner','both') DEFAULT 'none' COMMENT 'Complimentary meal plan: none, breakfast, dinner, or both',
  `group_id` varchar(30) DEFAULT NULL COMMENT 'Links multiple reservations in a group booking',
  `is_group_primary` tinyint(1) DEFAULT '0' COMMENT 'True for the lead room in a group booking',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `extra_beds` int DEFAULT '0' COMMENT 'Number of extra beds requested',
  `extra_bed_charge` decimal(10,2) DEFAULT '0.00' COMMENT 'Extra bed charge per night at time of booking',
  `discount_type` enum('percentage','amount') DEFAULT NULL COMMENT 'OM discount type applied at booking time',
  `discount_value` decimal(10,2) DEFAULT NULL COMMENT 'OM discount value',
  `discount_reason` varchar(255) DEFAULT NULL COMMENT 'Reason for OM discount',
  PRIMARY KEY (`id`),
  UNIQUE KEY `reservations_reservation_number` (`reservation_number`),
  KEY `guest_id` (`guest_id`),
  KEY `room_id` (`room_id`),
  KEY `created_by` (`created_by`),
  KEY `channel_id` (`channel_id`),
  CONSTRAINT `reservations_ibfk_179` FOREIGN KEY (`guest_id`) REFERENCES `guests` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `reservations_ibfk_180` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `reservations_ibfk_181` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `reservations_ibfk_182` FOREIGN KEY (`channel_id`) REFERENCES `ota_channels` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reservations`
--

LOCK TABLES `reservations` WRITE;
/*!40000 ALTER TABLE `reservations` DISABLE KEYS */;
INSERT INTO `reservations` VALUES (1,'RES-1775638340707',1,1,'2026-04-08','2026-04-09','2026-04-08 08:52:20',NULL,'checked_in',1,0,1,'walk_in',2000.00,2500.00,0.00,'',NULL,NULL,NULL,NULL,NULL,'nightly',NULL,NULL,NULL,'none',NULL,0,'2026-04-08 08:52:20','2026-04-08 08:52:20',1,500.00,'percentage',10.00,NULL),(2,'RES-1775648430698',1,1,'2026-04-09','2026-04-10',NULL,NULL,'pending',1,0,1,'website',2000.00,2000.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,'nightly',NULL,NULL,NULL,'none',NULL,0,'2026-04-08 11:40:30','2026-04-08 11:40:30',0,0.00,NULL,NULL,NULL),(3,'RES-1775648454071',1,21,'2026-04-09','2026-04-10',NULL,NULL,'pending',1,0,1,'website',4500.00,4500.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,'nightly',NULL,NULL,NULL,'none',NULL,0,'2026-04-08 11:40:54','2026-04-08 11:40:54',0,0.00,NULL,NULL,NULL),(4,'RES-1775648513576',1,2,'2026-04-08','2026-04-09','2026-04-08 11:42:05',NULL,'checked_in',1,0,1,'website',2000.00,2000.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,'nightly',NULL,NULL,NULL,'none',NULL,0,'2026-04-08 11:41:53','2026-04-08 11:42:05',0,0.00,NULL,NULL,NULL),(5,'RES-1775648550276',1,3,'2026-04-08','2026-04-10','2026-04-08 11:42:43',NULL,'checked_in',1,0,2,'website',2000.00,4000.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,'nightly',NULL,NULL,NULL,'none',NULL,0,'2026-04-08 11:42:30','2026-04-08 11:42:43',0,0.00,NULL,NULL,NULL);
/*!40000 ALTER TABLE `reservations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `restaurant_order_items`
--

DROP TABLE IF EXISTS `restaurant_order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `restaurant_order_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `menu_item_id` int DEFAULT NULL,
  `item_name` varchar(100) NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `unit_price` decimal(10,2) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `menu_item_id` (`menu_item_id`),
  CONSTRAINT `restaurant_order_items_ibfk_71` FOREIGN KEY (`order_id`) REFERENCES `restaurant_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `restaurant_order_items_ibfk_72` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `restaurant_order_items`
--

LOCK TABLES `restaurant_order_items` WRITE;
/*!40000 ALTER TABLE `restaurant_order_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `restaurant_order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `restaurant_orders`
--

DROP TABLE IF EXISTS `restaurant_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `restaurant_orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_number` varchar(20) NOT NULL,
  `room_id` int DEFAULT NULL,
  `guest_id` int DEFAULT NULL,
  `order_type` enum('dine_in','room_service','takeaway') DEFAULT 'dine_in',
  `status` enum('pending','preparing','ready','served','completed','cancelled') DEFAULT 'pending',
  `subtotal` decimal(10,2) DEFAULT '0.00',
  `tax_amount` decimal(10,2) DEFAULT '0.00',
  `total` decimal(10,2) DEFAULT '0.00',
  `posted_to_room` tinyint(1) DEFAULT '0',
  `notes` text,
  `created_by` int DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `restaurant_orders_order_number` (`order_number`),
  KEY `room_id` (`room_id`),
  KEY `guest_id` (`guest_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `restaurant_orders_ibfk_109` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `restaurant_orders_ibfk_110` FOREIGN KEY (`guest_id`) REFERENCES `guests` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `restaurant_orders_ibfk_111` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `restaurant_orders`
--

LOCK TABLES `restaurant_orders` WRITE;
/*!40000 ALTER TABLE `restaurant_orders` DISABLE KEYS */;
/*!40000 ALTER TABLE `restaurant_orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `room_type_inventory`
--

DROP TABLE IF EXISTS `room_type_inventory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `room_type_inventory` (
  `id` int NOT NULL AUTO_INCREMENT,
  `room_type` enum('standard_single','standard_double','executive_single','executive_double','comfort_single','comfort_double','comfort_executive_double','comfort_executive_triple','suite_triple') DEFAULT NULL,
  `date` date NOT NULL,
  `total_rooms` int NOT NULL DEFAULT '0',
  `booked_rooms` int NOT NULL DEFAULT '0',
  `available_rooms` int NOT NULL DEFAULT '0',
  `blocked_rooms` int NOT NULL DEFAULT '0' COMMENT 'Rooms blocked for maintenance etc.',
  `last_synced_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `room_type_inventory_room_type_date` (`room_type`,`date`)
) ENGINE=InnoDB AUTO_INCREMENT=13170 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `room_type_inventory`
--

LOCK TABLES `room_type_inventory` WRITE;
/*!40000 ALTER TABLE `room_type_inventory` DISABLE KEYS */;
INSERT INTO `room_type_inventory` VALUES (1,'standard_double','2026-03-15',25,0,25,0,'2026-03-15 18:00:00','2026-03-15 11:30:00','2026-03-15 18:00:00'),(2,'standard_double','2026-03-16',25,1,24,0,'2026-03-17 10:40:53','2026-03-15 11:30:00','2026-03-17 10:40:53'),(3,'standard_double','2026-03-17',25,1,24,0,'2026-03-17 10:58:38','2026-03-15 11:30:00','2026-03-17 10:58:38'),(4,'standard_double','2026-03-18',25,0,25,0,'2026-03-17 10:58:38','2026-03-15 11:30:00','2026-03-17 10:58:38'),(5,'standard_double','2026-03-19',25,3,22,0,'2026-03-19 13:45:19','2026-03-15 11:30:00','2026-03-19 13:45:19'),(6,'standard_double','2026-03-20',25,1,24,0,'2026-03-19 13:45:19','2026-03-15 11:30:00','2026-03-19 13:45:19'),(7,'standard_double','2026-03-21',25,8,17,0,'2026-03-16 12:49:53','2026-03-15 11:30:00','2026-03-16 12:49:53'),(8,'standard_double','2026-03-22',25,0,25,0,'2026-03-16 12:49:53','2026-03-15 11:30:00','2026-03-16 12:49:53'),(9,'standard_double','2026-03-23',25,0,25,0,'2026-03-16 11:15:00','2026-03-15 11:30:00','2026-03-16 11:15:00'),(10,'standard_double','2026-03-24',25,0,25,0,'2026-03-16 11:15:00','2026-03-15 11:30:00','2026-03-16 11:15:00'),(11,'standard_double','2026-03-25',25,4,21,0,'2026-03-19 13:17:54','2026-03-15 11:30:00','2026-03-19 13:17:54'),(12,'standard_double','2026-03-26',25,4,21,0,'2026-03-19 13:17:54','2026-03-15 11:30:00','2026-03-19 13:17:54'),(13,'standard_double','2026-03-27',25,0,25,0,'2026-03-19 13:17:54','2026-03-15 11:30:00','2026-03-19 13:17:54'),(14,'standard_double','2026-03-28',25,0,25,0,'2026-03-16 11:15:00','2026-03-15 11:30:00','2026-03-16 11:15:00'),(15,'standard_double','2026-03-29',25,0,25,0,'2026-03-16 11:15:00','2026-03-15 11:30:00','2026-03-16 11:15:00'),(16,'standard_double','2026-03-30',25,1,24,0,'2026-03-19 13:18:21','2026-03-15 11:30:00','2026-03-19 13:18:21'),(17,'standard_double','2026-03-31',25,1,24,0,'2026-03-19 13:18:21','2026-03-15 11:30:00','2026-03-19 13:18:21'),(18,'standard_double','2026-04-01',25,0,25,0,'2026-03-19 13:18:21','2026-03-15 11:30:00','2026-03-19 13:18:21'),(19,'standard_double','2026-04-02',25,0,25,0,'2026-03-16 11:15:00','2026-03-15 11:30:00','2026-03-16 11:15:00'),(20,'standard_double','2026-04-03',25,0,25,0,'2026-03-16 11:15:00','2026-03-15 11:30:00','2026-03-16 11:15:00'),(21,'standard_double','2026-04-04',25,0,25,0,'2026-03-16 11:15:00','2026-03-15 11:30:00','2026-03-16 11:15:00'),(22,'standard_double','2026-04-05',25,0,25,0,'2026-03-16 11:15:00','2026-03-15 11:30:00','2026-03-16 11:15:00'),(23,'standard_double','2026-04-06',25,0,25,0,'2026-03-16 11:15:00','2026-03-15 11:30:00','2026-03-16 11:15:00'),(24,'standard_double','2026-04-07',25,0,25,0,'2026-03-16 11:15:00','2026-03-15 11:30:00','2026-03-16 11:15:00'),(25,'standard_double','2026-04-08',25,3,22,0,'2026-04-08 15:45:00','2026-03-15 11:30:00','2026-04-08 15:45:00'),(26,'standard_double','2026-04-09',25,2,23,0,'2026-04-08 15:45:00','2026-03-15 11:30:00','2026-04-08 15:45:00'),(27,'standard_double','2026-04-10',25,0,25,0,'2026-04-08 15:45:00','2026-03-15 11:30:00','2026-04-08 15:45:00'),(28,'standard_double','2026-04-11',25,0,25,0,'2026-04-08 15:45:00','2026-03-15 11:30:00','2026-04-08 15:45:00'),(29,'standard_double','2026-04-12',25,0,25,0,'2026-04-08 15:45:00','2026-03-15 11:30:00','2026-04-08 15:45:00'),(30,'standard_double','2026-04-13',25,0,25,0,'2026-04-08 15:45:00','2026-03-15 11:30:00','2026-04-08 15:45:00'),(31,'standard_double','2026-04-14',25,0,25,0,'2026-04-08 15:45:00','2026-03-15 11:30:00','2026-04-08 15:45:00'),(32,'executive_double','2026-03-15',20,0,20,0,'2026-03-15 18:00:00','2026-03-15 11:30:00','2026-03-15 18:00:00'),(33,'executive_double','2026-03-16',20,0,20,0,'2026-03-16 12:21:22','2026-03-15 11:30:00','2026-03-16 12:21:22'),(34,'executive_double','2026-03-17',20,0,20,0,'2026-03-16 12:21:22','2026-03-15 11:30:00','2026-03-16 12:21:22'),(35,'executive_double','2026-03-18',20,0,20,0,'2026-03-16 11:15:00','2026-03-15 11:30:00','2026-03-16 11:15:00'),(36,'executive_double','2026-03-19',20,0,20,0,'2026-03-19 13:12:06','2026-03-15 11:30:00','2026-03-19 13:12:06'),(37,'executive_double','2026-03-20',20,0,20,0,'2026-03-19 13:12:06','2026-03-15 11:30:00','2026-03-19 13:12:06'),(38,'executive_double','2026-03-21',20,0,20,0,'2026-03-16 11:15:00','2026-03-15 11:30:00','2026-03-16 11:15:00'),(39,'executive_double','2026-03-22',20,0,20,0,'2026-03-16 11:15:00','2026-03-15 11:30:00','2026-03-16 11:15:00'),(40,'executive_double','2026-03-23',20,0,20,0,'2026-03-16 11:15:00','2026-03-15 11:30:00','2026-03-16 11:15:00'),(41,'executive_double','2026-03-24',20,0,20,0,'2026-03-16 11:15:00','2026-03-15 11:30:00','2026-03-16 11:15:00'),(42,'executive_double','2026-03-25',20,0,20,0,'2026-03-16 11:15:00','2026-03-15 11:30:00','2026-03-16 11:15:00'),(43,'executive_double','2026-03-26',20,0,20,0,'2026-03-16 11:15:00','2026-03-15 11:30:00','2026-03-16 11:15:00'),(44,'executive_double','2026-03-27',20,0,20,0,'2026-03-16 11:15:00','2026-03-15 11:30:00','2026-03-16 11:15:00'),(45,'executive_double','2026-03-28',20,0,20,0,'2026-03-16 11:15:00','2026-03-15 11:30:00','2026-03-16 11:15:00'),(46,'executive_double','2026-03-29',20,0,20,0,'2026-03-16 11:15:00','2026-03-15 11:30:00','2026-03-16 11:15:00'),(47,'executive_double','2026-03-30',20,0,20,0,'2026-03-16 11:15:00','2026-03-15 11:30:00','2026-03-16 11:15:00'),(48,'executive_double','2026-03-31',20,0,20,0,'2026-03-16 11:15:00','2026-03-15 11:30:00','2026-03-16 11:15:00'),(49,'executive_double','2026-04-01',20,0,20,0,'2026-03-16 11:15:00','2026-03-15 11:30:00','2026-03-16 11:15:00'),(50,'executive_double','2026-04-02',20,0,20,0,'2026-03-16 11:15:00','2026-03-15 11:30:00','2026-03-16 11:15:00'),(51,'executive_double','2026-04-03',20,0,20,0,'2026-03-16 11:15:00','2026-03-15 11:30:00','2026-03-16 11:15:00'),(52,'executive_double','2026-04-04',20,0,20,0,'2026-03-16 11:15:00','2026-03-15 11:30:00','2026-03-16 11:15:00'),(53,'executive_double','2026-04-05',20,0,20,0,'2026-03-16 11:15:00','2026-03-15 11:30:00','2026-03-16 11:15:00'),(54,'executive_double','2026-04-06',20,0,20,0,'2026-03-16 11:15:00','2026-03-15 11:30:00','2026-03-16 11:15:00'),(55,'executive_double','2026-04-07',20,0,20,0,'2026-03-16 11:15:00','2026-03-15 11:30:00','2026-03-16 11:15:00'),(56,'executive_double','2026-04-08',20,0,20,0,'2026-04-08 15:45:00','2026-03-15 11:30:00','2026-04-08 15:45:00'),(57,'executive_double','2026-04-09',20,1,19,0,'2026-04-08 15:45:00','2026-03-15 11:30:00','2026-04-08 15:45:00'),(58,'executive_double','2026-04-10',20,0,20,0,'2026-04-08 15:45:00','2026-03-15 11:30:00','2026-04-08 15:45:00'),(59,'executive_double','2026-04-11',20,0,20,0,'2026-04-08 15:45:00','2026-03-15 11:30:00','2026-04-08 15:45:00'),(60,'executive_double','2026-04-12',20,0,20,0,'2026-04-08 15:45:00','2026-03-15 11:30:00','2026-04-08 15:45:00'),(61,'executive_double','2026-04-13',20,0,20,0,'2026-04-08 15:45:00','2026-03-15 11:30:00','2026-04-08 15:45:00'),(62,'executive_double','2026-04-14',20,0,20,0,'2026-04-08 15:45:00','2026-03-15 11:30:00','2026-04-08 15:45:00'),(63,'suite_triple','2026-03-15',10,0,10,0,'2026-03-15 18:00:00','2026-03-15 11:30:00','2026-03-15 18:00:00'),(64,'suite_triple','2026-03-16',10,0,10,0,'2026-03-16 11:15:01','2026-03-15 11:30:00','2026-03-16 11:15:01'),(65,'suite_triple','2026-03-17',10,0,10,0,'2026-03-16 11:15:01','2026-03-15 11:30:00','2026-03-16 11:15:01'),(66,'suite_triple','2026-03-18',10,0,10,0,'2026-03-16 11:15:01','2026-03-15 11:30:00','2026-03-16 11:15:01'),(67,'suite_triple','2026-03-19',10,0,10,0,'2026-03-16 11:15:01','2026-03-15 11:30:00','2026-03-16 11:15:01'),(68,'suite_triple','2026-03-20',10,0,10,0,'2026-03-16 11:15:01','2026-03-15 11:30:00','2026-03-16 11:15:01'),(69,'suite_triple','2026-03-21',10,0,10,0,'2026-03-16 11:15:01','2026-03-15 11:30:01','2026-03-16 11:15:01'),(70,'suite_triple','2026-03-22',10,0,10,0,'2026-03-16 11:15:01','2026-03-15 11:30:01','2026-03-16 11:15:01'),(71,'suite_triple','2026-03-23',10,0,10,0,'2026-03-16 11:15:01','2026-03-15 11:30:01','2026-03-16 11:15:01'),(72,'suite_triple','2026-03-24',10,0,10,0,'2026-03-16 11:15:01','2026-03-15 11:30:01','2026-03-16 11:15:01'),(73,'suite_triple','2026-03-25',10,0,10,0,'2026-03-16 11:15:01','2026-03-15 11:30:01','2026-03-16 11:15:01'),(74,'suite_triple','2026-03-26',10,0,10,0,'2026-03-16 11:15:01','2026-03-15 11:30:01','2026-03-16 11:15:01'),(75,'suite_triple','2026-03-27',10,0,10,0,'2026-03-16 11:15:01','2026-03-15 11:30:01','2026-03-16 11:15:01'),(76,'suite_triple','2026-03-28',10,0,10,0,'2026-03-16 11:15:01','2026-03-15 11:30:01','2026-03-16 11:15:01'),(77,'suite_triple','2026-03-29',10,0,10,0,'2026-03-16 11:15:01','2026-03-15 11:30:01','2026-03-16 11:15:01'),(78,'suite_triple','2026-03-30',10,0,10,0,'2026-03-16 11:15:01','2026-03-15 11:30:01','2026-03-16 11:15:01'),(79,'suite_triple','2026-03-31',10,0,10,0,'2026-03-16 11:15:01','2026-03-15 11:30:01','2026-03-16 11:15:01'),(80,'suite_triple','2026-04-01',10,0,10,0,'2026-03-16 11:15:01','2026-03-15 11:30:01','2026-03-16 11:15:01'),(81,'suite_triple','2026-04-02',10,0,10,0,'2026-03-16 11:15:01','2026-03-15 11:30:01','2026-03-16 11:15:01'),(82,'suite_triple','2026-04-03',10,0,10,0,'2026-03-16 11:15:01','2026-03-15 11:30:01','2026-03-16 11:15:01'),(83,'suite_triple','2026-04-04',10,0,10,0,'2026-03-16 11:15:01','2026-03-15 11:30:01','2026-03-16 11:15:01'),(84,'suite_triple','2026-04-05',10,0,10,0,'2026-03-16 11:15:01','2026-03-15 11:30:01','2026-03-16 11:15:01'),(85,'suite_triple','2026-04-06',10,0,10,0,'2026-03-16 11:15:01','2026-03-15 11:30:01','2026-03-16 11:15:01'),(86,'suite_triple','2026-04-07',10,0,10,0,'2026-03-16 11:15:01','2026-03-15 11:30:01','2026-03-16 11:15:01'),(87,'suite_triple','2026-04-08',10,0,10,0,'2026-04-08 15:45:00','2026-03-15 11:30:01','2026-04-08 15:45:00'),(88,'suite_triple','2026-04-09',10,0,10,0,'2026-04-08 15:45:00','2026-03-15 11:30:01','2026-04-08 15:45:00'),(89,'suite_triple','2026-04-10',10,0,10,0,'2026-04-08 15:45:00','2026-03-15 11:30:01','2026-04-08 15:45:00'),(90,'suite_triple','2026-04-11',10,0,10,0,'2026-04-08 15:45:00','2026-03-15 11:30:01','2026-04-08 15:45:00'),(91,'suite_triple','2026-04-12',10,0,10,0,'2026-04-08 15:45:00','2026-03-15 11:30:01','2026-04-08 15:45:00'),(92,'suite_triple','2026-04-13',10,0,10,0,'2026-04-08 15:45:00','2026-03-15 11:30:01','2026-04-08 15:45:00'),(93,'suite_triple','2026-04-14',10,0,10,0,'2026-04-08 15:45:00','2026-03-15 11:30:01','2026-04-08 15:45:00'),(94,'comfort_executive_double','2026-03-15',3,0,3,0,'2026-03-15 18:00:01','2026-03-15 11:30:01','2026-03-15 18:00:01'),(95,'comfort_executive_double','2026-03-16',3,0,3,0,'2026-03-16 11:15:01','2026-03-15 11:30:01','2026-03-16 11:15:01'),(96,'comfort_executive_double','2026-03-17',3,0,3,0,'2026-03-16 11:15:01','2026-03-15 11:30:01','2026-03-16 11:15:01'),(97,'comfort_executive_double','2026-03-18',3,0,3,0,'2026-03-16 11:15:01','2026-03-15 11:30:01','2026-03-16 11:15:01'),(98,'comfort_executive_double','2026-03-19',3,0,3,0,'2026-03-16 11:15:01','2026-03-15 11:30:01','2026-03-16 11:15:01'),(99,'comfort_executive_double','2026-03-20',3,0,3,0,'2026-03-16 11:15:01','2026-03-15 11:30:01','2026-03-16 11:15:01'),(100,'comfort_executive_double','2026-03-21',3,0,3,0,'2026-03-16 11:15:01','2026-03-15 11:30:01','2026-03-16 11:15:01'),(101,'comfort_executive_double','2026-03-22',3,0,3,0,'2026-03-16 11:15:01','2026-03-15 11:30:01','2026-03-16 11:15:01'),(102,'comfort_executive_double','2026-03-23',3,0,3,0,'2026-03-16 11:15:01','2026-03-15 11:30:01','2026-03-16 11:15:01'),(103,'comfort_executive_double','2026-03-24',3,0,3,0,'2026-03-16 11:15:01','2026-03-15 11:30:01','2026-03-16 11:15:01'),(104,'comfort_executive_double','2026-03-25',3,0,3,0,'2026-03-16 11:15:01','2026-03-15 11:30:01','2026-03-16 11:15:01'),(105,'comfort_executive_double','2026-03-26',3,0,3,0,'2026-03-16 11:15:01','2026-03-15 11:30:01','2026-03-16 11:15:01'),(106,'comfort_executive_double','2026-03-27',3,0,3,0,'2026-03-16 11:15:01','2026-03-15 11:30:01','2026-03-16 11:15:01'),(107,'comfort_executive_double','2026-03-28',3,0,3,0,'2026-03-16 11:15:01','2026-03-15 11:30:01','2026-03-16 11:15:01'),(108,'comfort_executive_double','2026-03-29',3,0,3,0,'2026-03-16 11:15:01','2026-03-15 11:30:01','2026-03-16 11:15:01'),(109,'comfort_executive_double','2026-03-30',3,0,3,0,'2026-03-16 11:15:01','2026-03-15 11:30:01','2026-03-16 11:15:01'),(110,'comfort_executive_double','2026-03-31',3,0,3,0,'2026-03-16 11:15:01','2026-03-15 11:30:01','2026-03-16 11:15:01'),(111,'comfort_executive_double','2026-04-01',3,0,3,0,'2026-03-16 11:15:01','2026-03-15 11:30:01','2026-03-16 11:15:01'),(112,'comfort_executive_double','2026-04-02',3,0,3,0,'2026-03-16 11:15:01','2026-03-15 11:30:01','2026-03-16 11:15:01'),(113,'comfort_executive_double','2026-04-03',3,0,3,0,'2026-03-16 11:15:01','2026-03-15 11:30:01','2026-03-16 11:15:01'),(114,'comfort_executive_double','2026-04-04',3,0,3,0,'2026-03-16 11:15:01','2026-03-15 11:30:01','2026-03-16 11:15:01'),(115,'comfort_executive_double','2026-04-05',3,0,3,0,'2026-03-16 11:15:01','2026-03-15 11:30:01','2026-03-16 11:15:01'),(116,'comfort_executive_double','2026-04-06',3,0,3,0,'2026-03-16 11:15:01','2026-03-15 11:30:01','2026-03-16 11:15:01'),(117,'comfort_executive_double','2026-04-07',3,0,3,0,'2026-03-16 11:15:01','2026-03-15 11:30:01','2026-03-16 11:15:01'),(118,'comfort_executive_double','2026-04-08',3,0,3,0,'2026-04-08 15:45:00','2026-03-15 11:30:01','2026-04-08 15:45:00'),(119,'comfort_executive_double','2026-04-09',3,0,3,0,'2026-04-08 15:45:00','2026-03-15 11:30:01','2026-04-08 15:45:00'),(120,'comfort_executive_double','2026-04-10',3,0,3,0,'2026-04-08 15:45:00','2026-03-15 11:30:01','2026-04-08 15:45:00'),(121,'comfort_executive_double','2026-04-11',3,0,3,0,'2026-04-08 15:45:00','2026-03-15 11:30:01','2026-04-08 15:45:00'),(122,'comfort_executive_double','2026-04-12',3,0,3,0,'2026-04-08 15:45:00','2026-03-15 11:30:01','2026-04-08 15:45:00'),(123,'comfort_executive_double','2026-04-13',3,0,3,0,'2026-04-08 15:45:00','2026-03-15 11:30:01','2026-04-08 15:45:00'),(124,'comfort_executive_double','2026-04-14',3,0,3,0,'2026-04-08 15:45:00','2026-03-15 11:30:01','2026-04-08 15:45:00'),(3299,'standard_double','2026-04-15',25,0,25,0,'2026-04-08 15:45:00','2026-03-16 01:45:00','2026-04-08 15:45:00'),(3330,'executive_double','2026-04-15',20,0,20,0,'2026-04-08 15:45:00','2026-03-16 01:45:00','2026-04-08 15:45:00'),(3361,'suite_triple','2026-04-15',10,0,10,0,'2026-04-08 15:45:00','2026-03-16 01:45:00','2026-04-08 15:45:00'),(3392,'comfort_executive_double','2026-04-15',3,0,3,0,'2026-04-08 15:45:00','2026-03-16 01:45:01','2026-04-08 15:45:00'),(8493,'standard_double','2026-04-16',25,0,25,0,'2026-04-08 15:45:00','2026-04-08 06:15:00','2026-04-08 15:45:00'),(8494,'standard_double','2026-04-17',25,0,25,0,'2026-04-08 15:45:00','2026-04-08 06:15:00','2026-04-08 15:45:00'),(8495,'standard_double','2026-04-18',25,0,25,0,'2026-04-08 15:45:00','2026-04-08 06:15:00','2026-04-08 15:45:00'),(8496,'standard_double','2026-04-19',25,0,25,0,'2026-04-08 15:45:00','2026-04-08 06:15:00','2026-04-08 15:45:00'),(8497,'standard_double','2026-04-20',25,0,25,0,'2026-04-08 15:45:00','2026-04-08 06:15:00','2026-04-08 15:45:00'),(8498,'standard_double','2026-04-21',25,0,25,0,'2026-04-08 15:45:00','2026-04-08 06:15:00','2026-04-08 15:45:00'),(8499,'standard_double','2026-04-22',25,0,25,0,'2026-04-08 15:45:00','2026-04-08 06:15:00','2026-04-08 15:45:00'),(8500,'standard_double','2026-04-23',25,0,25,0,'2026-04-08 15:45:00','2026-04-08 06:15:00','2026-04-08 15:45:00'),(8501,'standard_double','2026-04-24',25,0,25,0,'2026-04-08 15:45:00','2026-04-08 06:15:00','2026-04-08 15:45:00'),(8502,'standard_double','2026-04-25',25,0,25,0,'2026-04-08 15:45:00','2026-04-08 06:15:00','2026-04-08 15:45:00'),(8503,'standard_double','2026-04-26',25,0,25,0,'2026-04-08 15:45:00','2026-04-08 06:15:00','2026-04-08 15:45:00'),(8504,'standard_double','2026-04-27',25,0,25,0,'2026-04-08 15:45:00','2026-04-08 06:15:00','2026-04-08 15:45:00'),(8505,'standard_double','2026-04-28',25,0,25,0,'2026-04-08 15:45:00','2026-04-08 06:15:00','2026-04-08 15:45:00'),(8506,'standard_double','2026-04-29',25,0,25,0,'2026-04-08 15:45:00','2026-04-08 06:15:00','2026-04-08 15:45:00'),(8507,'standard_double','2026-04-30',25,0,25,0,'2026-04-08 15:45:00','2026-04-08 06:15:00','2026-04-08 15:45:00'),(8508,'standard_double','2026-05-01',25,0,25,0,'2026-04-08 15:45:00','2026-04-08 06:15:00','2026-04-08 15:45:00'),(8509,'standard_double','2026-05-02',25,0,25,0,'2026-04-08 15:45:00','2026-04-08 06:15:00','2026-04-08 15:45:00'),(8510,'standard_double','2026-05-03',25,0,25,0,'2026-04-08 15:45:00','2026-04-08 06:15:00','2026-04-08 15:45:00'),(8511,'standard_double','2026-05-04',25,0,25,0,'2026-04-08 15:45:00','2026-04-08 06:15:00','2026-04-08 15:45:00'),(8512,'standard_double','2026-05-05',25,0,25,0,'2026-04-08 15:45:00','2026-04-08 06:15:01','2026-04-08 15:45:00'),(8513,'standard_double','2026-05-06',25,0,25,0,'2026-04-08 15:45:00','2026-04-08 06:15:01','2026-04-08 15:45:00'),(8514,'standard_double','2026-05-07',25,0,25,0,'2026-04-08 15:45:00','2026-04-08 06:15:01','2026-04-08 15:45:00'),(8515,'standard_double','2026-05-08',25,0,25,0,'2026-04-08 15:45:00','2026-04-08 06:15:01','2026-04-08 15:45:00'),(8524,'executive_double','2026-04-16',20,0,20,0,'2026-04-08 15:45:00','2026-04-08 06:15:01','2026-04-08 15:45:00'),(8525,'executive_double','2026-04-17',20,0,20,0,'2026-04-08 15:45:00','2026-04-08 06:15:01','2026-04-08 15:45:00'),(8526,'executive_double','2026-04-18',20,0,20,0,'2026-04-08 15:45:00','2026-04-08 06:15:01','2026-04-08 15:45:00'),(8527,'executive_double','2026-04-19',20,0,20,0,'2026-04-08 15:45:00','2026-04-08 06:15:01','2026-04-08 15:45:00'),(8528,'executive_double','2026-04-20',20,0,20,0,'2026-04-08 15:45:00','2026-04-08 06:15:01','2026-04-08 15:45:00'),(8529,'executive_double','2026-04-21',20,0,20,0,'2026-04-08 15:45:00','2026-04-08 06:15:01','2026-04-08 15:45:00'),(8530,'executive_double','2026-04-22',20,0,20,0,'2026-04-08 15:45:00','2026-04-08 06:15:01','2026-04-08 15:45:00'),(8531,'executive_double','2026-04-23',20,0,20,0,'2026-04-08 15:45:00','2026-04-08 06:15:01','2026-04-08 15:45:00'),(8532,'executive_double','2026-04-24',20,0,20,0,'2026-04-08 15:45:00','2026-04-08 06:15:01','2026-04-08 15:45:00'),(8533,'executive_double','2026-04-25',20,0,20,0,'2026-04-08 15:45:00','2026-04-08 06:15:01','2026-04-08 15:45:00'),(8534,'executive_double','2026-04-26',20,0,20,0,'2026-04-08 15:45:00','2026-04-08 06:15:01','2026-04-08 15:45:00'),(8535,'executive_double','2026-04-27',20,0,20,0,'2026-04-08 15:45:00','2026-04-08 06:15:01','2026-04-08 15:45:00'),(8536,'executive_double','2026-04-28',20,0,20,0,'2026-04-08 15:45:00','2026-04-08 06:15:01','2026-04-08 15:45:00'),(8537,'executive_double','2026-04-29',20,0,20,0,'2026-04-08 15:45:00','2026-04-08 06:15:01','2026-04-08 15:45:00'),(8538,'executive_double','2026-04-30',20,0,20,0,'2026-04-08 15:45:00','2026-04-08 06:15:01','2026-04-08 15:45:00'),(8539,'executive_double','2026-05-01',20,0,20,0,'2026-04-08 15:45:00','2026-04-08 06:15:01','2026-04-08 15:45:00'),(8540,'executive_double','2026-05-02',20,0,20,0,'2026-04-08 15:45:00','2026-04-08 06:15:01','2026-04-08 15:45:00'),(8541,'executive_double','2026-05-03',20,0,20,0,'2026-04-08 15:45:00','2026-04-08 06:15:02','2026-04-08 15:45:00'),(8542,'executive_double','2026-05-04',20,0,20,0,'2026-04-08 15:45:00','2026-04-08 06:15:02','2026-04-08 15:45:00'),(8543,'executive_double','2026-05-05',20,0,20,0,'2026-04-08 15:45:00','2026-04-08 06:15:02','2026-04-08 15:45:00'),(8544,'executive_double','2026-05-06',20,0,20,0,'2026-04-08 15:45:00','2026-04-08 06:15:02','2026-04-08 15:45:00'),(8545,'executive_double','2026-05-07',20,0,20,0,'2026-04-08 15:45:00','2026-04-08 06:15:02','2026-04-08 15:45:00'),(8546,'executive_double','2026-05-08',20,0,20,0,'2026-04-08 15:45:00','2026-04-08 06:15:02','2026-04-08 15:45:00'),(8555,'suite_triple','2026-04-16',10,0,10,0,'2026-04-08 15:45:00','2026-04-08 06:15:02','2026-04-08 15:45:00'),(8556,'suite_triple','2026-04-17',10,0,10,0,'2026-04-08 15:45:00','2026-04-08 06:15:02','2026-04-08 15:45:00'),(8557,'suite_triple','2026-04-18',10,0,10,0,'2026-04-08 15:45:00','2026-04-08 06:15:02','2026-04-08 15:45:00'),(8558,'suite_triple','2026-04-19',10,0,10,0,'2026-04-08 15:45:00','2026-04-08 06:15:02','2026-04-08 15:45:00'),(8559,'suite_triple','2026-04-20',10,0,10,0,'2026-04-08 15:45:00','2026-04-08 06:15:02','2026-04-08 15:45:00'),(8560,'suite_triple','2026-04-21',10,0,10,0,'2026-04-08 15:45:00','2026-04-08 06:15:02','2026-04-08 15:45:00'),(8561,'suite_triple','2026-04-22',10,0,10,0,'2026-04-08 15:45:00','2026-04-08 06:15:02','2026-04-08 15:45:00'),(8562,'suite_triple','2026-04-23',10,0,10,0,'2026-04-08 15:45:00','2026-04-08 06:15:02','2026-04-08 15:45:00'),(8563,'suite_triple','2026-04-24',10,0,10,0,'2026-04-08 15:45:00','2026-04-08 06:15:02','2026-04-08 15:45:00'),(8564,'suite_triple','2026-04-25',10,0,10,0,'2026-04-08 15:45:00','2026-04-08 06:15:02','2026-04-08 15:45:00'),(8565,'suite_triple','2026-04-26',10,0,10,0,'2026-04-08 15:45:00','2026-04-08 06:15:02','2026-04-08 15:45:00'),(8566,'suite_triple','2026-04-27',10,0,10,0,'2026-04-08 15:45:00','2026-04-08 06:15:02','2026-04-08 15:45:00'),(8567,'suite_triple','2026-04-28',10,0,10,0,'2026-04-08 15:45:00','2026-04-08 06:15:02','2026-04-08 15:45:00'),(8568,'suite_triple','2026-04-29',10,0,10,0,'2026-04-08 15:45:00','2026-04-08 06:15:02','2026-04-08 15:45:00'),(8569,'suite_triple','2026-04-30',10,0,10,0,'2026-04-08 15:45:00','2026-04-08 06:15:02','2026-04-08 15:45:00'),(8570,'suite_triple','2026-05-01',10,0,10,0,'2026-04-08 15:45:00','2026-04-08 06:15:02','2026-04-08 15:45:00'),(8571,'suite_triple','2026-05-02',10,0,10,0,'2026-04-08 15:45:00','2026-04-08 06:15:02','2026-04-08 15:45:00'),(8572,'suite_triple','2026-05-03',10,0,10,0,'2026-04-08 15:45:00','2026-04-08 06:15:02','2026-04-08 15:45:00'),(8573,'suite_triple','2026-05-04',10,0,10,0,'2026-04-08 15:45:00','2026-04-08 06:15:02','2026-04-08 15:45:00'),(8574,'suite_triple','2026-05-05',10,0,10,0,'2026-04-08 15:45:00','2026-04-08 06:15:02','2026-04-08 15:45:00'),(8575,'suite_triple','2026-05-06',10,0,10,0,'2026-04-08 15:45:00','2026-04-08 06:15:02','2026-04-08 15:45:00'),(8576,'suite_triple','2026-05-07',10,0,10,0,'2026-04-08 15:45:00','2026-04-08 06:15:02','2026-04-08 15:45:00'),(8577,'suite_triple','2026-05-08',10,0,10,0,'2026-04-08 15:45:00','2026-04-08 06:15:02','2026-04-08 15:45:00'),(8586,'comfort_executive_double','2026-04-16',3,0,3,0,'2026-04-08 15:45:00','2026-04-08 06:15:03','2026-04-08 15:45:00'),(8587,'comfort_executive_double','2026-04-17',3,0,3,0,'2026-04-08 15:45:00','2026-04-08 06:15:03','2026-04-08 15:45:00'),(8588,'comfort_executive_double','2026-04-18',3,0,3,0,'2026-04-08 15:45:00','2026-04-08 06:15:03','2026-04-08 15:45:00'),(8589,'comfort_executive_double','2026-04-19',3,0,3,0,'2026-04-08 15:45:00','2026-04-08 06:15:03','2026-04-08 15:45:00'),(8590,'comfort_executive_double','2026-04-20',3,0,3,0,'2026-04-08 15:45:00','2026-04-08 06:15:03','2026-04-08 15:45:00'),(8591,'comfort_executive_double','2026-04-21',3,0,3,0,'2026-04-08 15:45:00','2026-04-08 06:15:03','2026-04-08 15:45:00'),(8592,'comfort_executive_double','2026-04-22',3,0,3,0,'2026-04-08 15:45:00','2026-04-08 06:15:03','2026-04-08 15:45:00'),(8593,'comfort_executive_double','2026-04-23',3,0,3,0,'2026-04-08 15:45:00','2026-04-08 06:15:03','2026-04-08 15:45:00'),(8594,'comfort_executive_double','2026-04-24',3,0,3,0,'2026-04-08 15:45:00','2026-04-08 06:15:03','2026-04-08 15:45:00'),(8595,'comfort_executive_double','2026-04-25',3,0,3,0,'2026-04-08 15:45:00','2026-04-08 06:15:03','2026-04-08 15:45:00'),(8596,'comfort_executive_double','2026-04-26',3,0,3,0,'2026-04-08 15:45:00','2026-04-08 06:15:03','2026-04-08 15:45:00'),(8597,'comfort_executive_double','2026-04-27',3,0,3,0,'2026-04-08 15:45:01','2026-04-08 06:15:03','2026-04-08 15:45:01'),(8598,'comfort_executive_double','2026-04-28',3,0,3,0,'2026-04-08 15:45:01','2026-04-08 06:15:03','2026-04-08 15:45:01'),(8599,'comfort_executive_double','2026-04-29',3,0,3,0,'2026-04-08 15:45:01','2026-04-08 06:15:03','2026-04-08 15:45:01'),(8600,'comfort_executive_double','2026-04-30',3,0,3,0,'2026-04-08 15:45:01','2026-04-08 06:15:03','2026-04-08 15:45:01'),(8601,'comfort_executive_double','2026-05-01',3,0,3,0,'2026-04-08 15:45:01','2026-04-08 06:15:03','2026-04-08 15:45:01'),(8602,'comfort_executive_double','2026-05-02',3,0,3,0,'2026-04-08 15:45:01','2026-04-08 06:15:03','2026-04-08 15:45:01'),(8603,'comfort_executive_double','2026-05-03',3,0,3,0,'2026-04-08 15:45:01','2026-04-08 06:15:03','2026-04-08 15:45:01'),(8604,'comfort_executive_double','2026-05-04',3,0,3,0,'2026-04-08 15:45:01','2026-04-08 06:15:03','2026-04-08 15:45:01'),(8605,'comfort_executive_double','2026-05-05',3,0,3,0,'2026-04-08 15:45:01','2026-04-08 06:15:03','2026-04-08 15:45:01'),(8606,'comfort_executive_double','2026-05-06',3,0,3,0,'2026-04-08 15:45:01','2026-04-08 06:15:03','2026-04-08 15:45:01'),(8607,'comfort_executive_double','2026-05-07',3,0,3,0,'2026-04-08 15:45:01','2026-04-08 06:15:03','2026-04-08 15:45:01'),(8608,'comfort_executive_double','2026-05-08',3,0,3,0,'2026-04-08 15:45:01','2026-04-08 06:15:03','2026-04-08 15:45:01');
/*!40000 ALTER TABLE `room_type_inventory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rooms`
--

DROP TABLE IF EXISTS `rooms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rooms` (
  `id` int NOT NULL AUTO_INCREMENT,
  `room_number` varchar(10) NOT NULL,
  `floor` int NOT NULL,
  `room_type` enum('standard_single','standard_double','executive_single','executive_double','comfort_single','comfort_double','comfort_executive_double','comfort_executive_triple','suite_triple') NOT NULL,
  `status` enum('available','occupied','reserved','maintenance','cleaning') DEFAULT 'available',
  `cleanliness_status` enum('clean','dirty','in_progress','inspected','awaiting_verification','out_of_order') DEFAULT 'clean',
  `base_rate` decimal(10,2) NOT NULL,
  `max_occupancy` int DEFAULT '2',
  `amenities` json DEFAULT NULL,
  `hourly_rate` decimal(10,2) DEFAULT NULL COMMENT 'Legacy single hourly rate (deprecated, use hourly_rates JSON)',
  `description` text,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `hourly_rates` json DEFAULT NULL COMMENT 'Tiered hourly rates e.g. {"1":500,"2":800,"3":1000,"default":400}',
  `extra_bed_charge` decimal(10,2) DEFAULT NULL COMMENT 'Charge per extra bed per night',
  `max_extra_beds` int DEFAULT '1' COMMENT 'Max extra beds allowed in this room',
  PRIMARY KEY (`id`),
  UNIQUE KEY `rooms_room_number` (`room_number`)
) ENGINE=InnoDB AUTO_INCREMENT=59 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rooms`
--

LOCK TABLES `rooms` WRITE;
/*!40000 ALTER TABLE `rooms` DISABLE KEYS */;
INSERT INTO `rooms` VALUES (1,'101',1,'standard_double','occupied','clean',1750.00,2,'[\"AC\", \"TV\", \"WiFi\", \"Bathroom\"]',300.00,NULL,'2026-03-15 11:27:22','2026-04-08 13:10:21','{\"2\": 300, \"3\": 400, \"4\": 500, \"default\": 50}',500.00,1),(2,'102',1,'standard_double','occupied','clean',1750.00,2,'[\"AC\", \"TV\", \"WiFi\", \"Bathroom\"]',300.00,NULL,'2026-03-15 11:27:22','2026-04-08 13:10:21','{\"2\": 300, \"3\": 400, \"4\": 500, \"default\": 50}',500.00,1),(3,'103',1,'standard_double','occupied','clean',1750.00,2,'[\"AC\", \"TV\", \"WiFi\", \"Bathroom\"]',300.00,NULL,'2026-03-15 11:27:22','2026-04-08 13:10:21','{\"2\": 300, \"3\": 400, \"4\": 500, \"default\": 50}',500.00,1),(4,'104',1,'standard_double','available','clean',1750.00,2,'[\"AC\", \"TV\", \"WiFi\", \"Bathroom\"]',300.00,NULL,'2026-03-15 11:27:22','2026-04-08 13:10:21','{\"2\": 300, \"3\": 400, \"4\": 500, \"default\": 50}',500.00,1),(5,'105',1,'standard_double','available','clean',1750.00,2,'[\"AC\", \"TV\", \"WiFi\", \"Bathroom\"]',300.00,NULL,'2026-03-15 11:27:22','2026-04-08 13:10:21','{\"2\": 300, \"3\": 400, \"4\": 500, \"default\": 50}',500.00,1),(6,'106',1,'standard_double','available','clean',1750.00,2,'[\"AC\", \"TV\", \"WiFi\", \"Bathroom\"]',300.00,NULL,'2026-03-15 11:27:22','2026-04-08 13:10:21','{\"2\": 300, \"3\": 400, \"4\": 500, \"default\": 50}',500.00,1),(7,'107',1,'standard_double','available','clean',1750.00,2,'[\"AC\", \"TV\", \"WiFi\", \"Bathroom\"]',300.00,NULL,'2026-03-15 11:27:22','2026-04-08 13:10:21','{\"2\": 300, \"3\": 400, \"4\": 500, \"default\": 50}',500.00,1),(8,'108',1,'standard_double','available','clean',1750.00,2,'[\"AC\", \"TV\", \"WiFi\", \"Bathroom\"]',300.00,NULL,'2026-03-15 11:27:22','2026-04-08 13:10:21','{\"2\": 300, \"3\": 400, \"4\": 500, \"default\": 50}',500.00,1),(9,'109',1,'standard_double','available','clean',1750.00,2,'[\"AC\", \"TV\", \"WiFi\", \"Bathroom\"]',300.00,NULL,'2026-03-15 11:27:22','2026-04-08 13:10:21','{\"2\": 300, \"3\": 400, \"4\": 500, \"default\": 50}',500.00,1),(10,'110',1,'standard_double','available','clean',1750.00,2,'[\"AC\", \"TV\", \"WiFi\", \"Bathroom\"]',300.00,NULL,'2026-03-15 11:27:22','2026-04-08 13:10:21','{\"2\": 300, \"3\": 400, \"4\": 500, \"default\": 50}',500.00,1),(11,'201',2,'standard_double','available','clean',1750.00,2,'[\"AC\", \"TV\", \"WiFi\", \"Bathroom\"]',300.00,NULL,'2026-03-15 11:27:22','2026-04-08 13:10:21','{\"2\": 300, \"3\": 400, \"4\": 500, \"default\": 50}',500.00,1),(12,'202',2,'standard_double','available','clean',1750.00,2,'[\"AC\", \"TV\", \"WiFi\", \"Bathroom\"]',300.00,NULL,'2026-03-15 11:27:22','2026-04-08 13:10:21','{\"2\": 300, \"3\": 400, \"4\": 500, \"default\": 50}',500.00,1),(13,'203',2,'standard_double','available','clean',1750.00,2,'[\"AC\", \"TV\", \"WiFi\", \"Bathroom\"]',300.00,NULL,'2026-03-15 11:27:22','2026-04-08 13:10:21','{\"2\": 300, \"3\": 400, \"4\": 500, \"default\": 50}',500.00,1),(14,'204',2,'standard_double','available','clean',1750.00,2,'[\"AC\", \"TV\", \"WiFi\", \"Bathroom\"]',300.00,NULL,'2026-03-15 11:27:22','2026-04-08 13:10:21','{\"2\": 300, \"3\": 400, \"4\": 500, \"default\": 50}',500.00,1),(15,'205',2,'standard_double','available','clean',1750.00,2,'[\"AC\", \"TV\", \"WiFi\", \"Bathroom\"]',300.00,NULL,'2026-03-15 11:27:22','2026-04-08 13:10:21','{\"2\": 300, \"3\": 400, \"4\": 500, \"default\": 50}',500.00,1),(16,'206',2,'standard_double','available','clean',1750.00,2,'[\"AC\", \"TV\", \"WiFi\", \"Bathroom\"]',300.00,NULL,'2026-03-15 11:27:22','2026-04-08 13:10:21','{\"2\": 300, \"3\": 400, \"4\": 500, \"default\": 50}',500.00,1),(17,'207',2,'standard_double','available','clean',1750.00,2,'[\"AC\", \"TV\", \"WiFi\", \"Bathroom\"]',300.00,NULL,'2026-03-15 11:27:22','2026-04-08 13:10:21','{\"2\": 300, \"3\": 400, \"4\": 500, \"default\": 50}',500.00,1),(18,'208',2,'standard_double','available','clean',1750.00,2,'[\"AC\", \"TV\", \"WiFi\", \"Bathroom\"]',300.00,NULL,'2026-03-15 11:27:22','2026-04-08 13:10:21','{\"2\": 300, \"3\": 400, \"4\": 500, \"default\": 50}',500.00,1),(19,'209',2,'standard_double','available','clean',1750.00,2,'[\"AC\", \"TV\", \"WiFi\", \"Bathroom\"]',300.00,NULL,'2026-03-15 11:27:22','2026-04-08 13:10:21','{\"2\": 300, \"3\": 400, \"4\": 500, \"default\": 50}',500.00,1),(20,'210',2,'standard_double','available','clean',1750.00,2,'[\"AC\", \"TV\", \"WiFi\", \"Bathroom\"]',300.00,NULL,'2026-03-15 11:27:22','2026-04-08 13:10:21','{\"2\": 300, \"3\": 400, \"4\": 500, \"default\": 50}',500.00,1),(21,'211',2,'executive_double','available','clean',4500.00,3,'[\"AC\", \"TV\", \"WiFi\", \"Minibar\", \"Bathroom\", \"Balcony\"]',NULL,NULL,'2026-03-15 11:27:22','2026-04-08 13:10:03',NULL,700.00,2),(22,'212',2,'executive_double','available','clean',4500.00,3,'[\"AC\", \"TV\", \"WiFi\", \"Minibar\", \"Bathroom\", \"Balcony\"]',NULL,NULL,'2026-03-15 11:27:22','2026-04-08 13:10:03',NULL,700.00,2),(23,'213',2,'executive_double','available','clean',4500.00,3,'[\"AC\", \"TV\", \"WiFi\", \"Minibar\", \"Bathroom\", \"Balcony\"]',NULL,NULL,'2026-03-15 11:27:22','2026-04-08 13:10:03',NULL,700.00,2),(24,'214',2,'executive_double','available','clean',4500.00,3,'[\"AC\", \"TV\", \"WiFi\", \"Minibar\", \"Bathroom\", \"Balcony\"]',NULL,NULL,'2026-03-15 11:27:22','2026-04-08 13:10:03',NULL,700.00,2),(25,'215',2,'executive_double','available','clean',4500.00,3,'[\"AC\", \"TV\", \"WiFi\", \"Minibar\", \"Bathroom\", \"Balcony\"]',NULL,NULL,'2026-03-15 11:27:22','2026-04-08 13:10:03',NULL,700.00,2),(26,'301',3,'standard_double','available','clean',1750.00,2,'[\"AC\", \"TV\", \"WiFi\", \"Bathroom\"]',300.00,NULL,'2026-03-15 11:27:22','2026-04-08 13:10:21','{\"2\": 300, \"3\": 400, \"4\": 500, \"default\": 50}',500.00,1),(27,'302',3,'standard_double','available','clean',1750.00,2,'[\"AC\", \"TV\", \"WiFi\", \"Bathroom\"]',300.00,NULL,'2026-03-15 11:27:22','2026-04-08 13:10:21','{\"2\": 300, \"3\": 400, \"4\": 500, \"default\": 50}',500.00,1),(28,'303',3,'standard_double','available','clean',1750.00,2,'[\"AC\", \"TV\", \"WiFi\", \"Bathroom\"]',300.00,NULL,'2026-03-15 11:27:22','2026-04-08 13:10:21','{\"2\": 300, \"3\": 400, \"4\": 500, \"default\": 50}',500.00,1),(29,'304',3,'standard_double','available','clean',1750.00,2,'[\"AC\", \"TV\", \"WiFi\", \"Bathroom\"]',300.00,NULL,'2026-03-15 11:27:22','2026-04-08 13:10:21','{\"2\": 300, \"3\": 400, \"4\": 500, \"default\": 50}',500.00,1),(30,'305',3,'standard_double','available','clean',1750.00,2,'[\"AC\", \"TV\", \"WiFi\", \"Bathroom\"]',300.00,NULL,'2026-03-15 11:27:22','2026-04-08 13:10:21','{\"2\": 300, \"3\": 400, \"4\": 500, \"default\": 50}',500.00,1),(31,'306',3,'executive_double','available','clean',4500.00,3,'[\"AC\", \"TV\", \"WiFi\", \"Minibar\", \"Bathroom\", \"Balcony\"]',NULL,NULL,'2026-03-15 11:27:22','2026-04-08 13:10:03',NULL,700.00,2),(32,'307',3,'executive_double','available','clean',4500.00,3,'[\"AC\", \"TV\", \"WiFi\", \"Minibar\", \"Bathroom\", \"Balcony\"]',NULL,NULL,'2026-03-15 11:27:22','2026-04-08 13:10:03',NULL,700.00,2),(33,'308',3,'executive_double','available','clean',4500.00,3,'[\"AC\", \"TV\", \"WiFi\", \"Minibar\", \"Bathroom\", \"Balcony\"]',NULL,NULL,'2026-03-15 11:27:22','2026-04-08 13:10:03',NULL,700.00,2),(34,'309',3,'executive_double','available','clean',4500.00,3,'[\"AC\", \"TV\", \"WiFi\", \"Minibar\", \"Bathroom\", \"Balcony\"]',NULL,NULL,'2026-03-15 11:27:22','2026-04-08 13:10:03',NULL,700.00,2),(35,'310',3,'executive_double','available','clean',4500.00,3,'[\"AC\", \"TV\", \"WiFi\", \"Minibar\", \"Bathroom\", \"Balcony\"]',NULL,NULL,'2026-03-15 11:27:22','2026-04-08 13:10:03',NULL,700.00,2),(36,'311',3,'executive_double','available','clean',4500.00,3,'[\"AC\", \"TV\", \"WiFi\", \"Minibar\", \"Bathroom\", \"Balcony\"]',NULL,NULL,'2026-03-15 11:27:22','2026-04-08 13:10:03',NULL,700.00,2),(37,'312',3,'executive_double','available','clean',4500.00,3,'[\"AC\", \"TV\", \"WiFi\", \"Minibar\", \"Bathroom\", \"Balcony\"]',NULL,NULL,'2026-03-15 11:27:22','2026-04-08 13:10:03',NULL,700.00,2),(38,'313',3,'executive_double','available','clean',4500.00,3,'[\"AC\", \"TV\", \"WiFi\", \"Minibar\", \"Bathroom\", \"Balcony\"]',NULL,NULL,'2026-03-15 11:27:22','2026-04-08 13:10:03',NULL,700.00,2),(39,'314',3,'executive_double','available','clean',4500.00,3,'[\"AC\", \"TV\", \"WiFi\", \"Minibar\", \"Bathroom\", \"Balcony\"]',NULL,NULL,'2026-03-15 11:27:22','2026-04-08 13:10:03',NULL,700.00,2),(40,'315',3,'executive_double','available','clean',4500.00,3,'[\"AC\", \"TV\", \"WiFi\", \"Minibar\", \"Bathroom\", \"Balcony\"]',NULL,NULL,'2026-03-15 11:27:22','2026-04-08 13:10:03',NULL,700.00,2),(41,'401',4,'executive_double','available','clean',4500.00,3,'[\"AC\", \"TV\", \"WiFi\", \"Minibar\", \"Bathroom\", \"Balcony\"]',NULL,NULL,'2026-03-15 11:27:22','2026-04-08 13:10:03',NULL,700.00,2),(42,'402',4,'executive_double','available','clean',4500.00,3,'[\"AC\", \"TV\", \"WiFi\", \"Minibar\", \"Bathroom\", \"Balcony\"]',NULL,NULL,'2026-03-15 11:27:22','2026-04-08 13:10:03',NULL,700.00,2),(43,'403',4,'executive_double','available','clean',4500.00,3,'[\"AC\", \"TV\", \"WiFi\", \"Minibar\", \"Bathroom\", \"Balcony\"]',NULL,NULL,'2026-03-15 11:27:22','2026-04-08 13:10:03',NULL,700.00,2),(44,'404',4,'executive_double','available','clean',4500.00,3,'[\"AC\", \"TV\", \"WiFi\", \"Minibar\", \"Bathroom\", \"Balcony\"]',NULL,NULL,'2026-03-15 11:27:22','2026-04-08 13:10:03',NULL,700.00,2),(45,'405',4,'executive_double','available','clean',4500.00,3,'[\"AC\", \"TV\", \"WiFi\", \"Minibar\", \"Bathroom\", \"Balcony\"]',NULL,NULL,'2026-03-15 11:27:22','2026-04-08 13:10:03',NULL,700.00,2),(46,'406',4,'suite_triple','available','clean',8000.00,4,'[\"AC\", \"TV\", \"WiFi\", \"Minibar\", \"Living Room\", \"Bathroom\", \"Balcony\", \"Jacuzzi\"]',NULL,NULL,'2026-03-15 11:27:22','2026-03-16 09:49:11',NULL,1000.00,2),(47,'407',4,'suite_triple','available','clean',8000.00,4,'[\"AC\", \"TV\", \"WiFi\", \"Minibar\", \"Living Room\", \"Bathroom\", \"Balcony\", \"Jacuzzi\"]',NULL,NULL,'2026-03-15 11:27:22','2026-03-16 09:49:11',NULL,1000.00,2),(48,'408',4,'suite_triple','available','clean',8000.00,4,'[\"AC\", \"TV\", \"WiFi\", \"Minibar\", \"Living Room\", \"Bathroom\", \"Balcony\", \"Jacuzzi\"]',NULL,NULL,'2026-03-15 11:27:22','2026-03-16 09:49:11',NULL,1000.00,2),(49,'409',4,'suite_triple','available','clean',8000.00,4,'[\"AC\", \"TV\", \"WiFi\", \"Minibar\", \"Living Room\", \"Bathroom\", \"Balcony\", \"Jacuzzi\"]',NULL,NULL,'2026-03-15 11:27:22','2026-03-16 09:49:11',NULL,1000.00,2),(50,'410',4,'suite_triple','available','clean',8000.00,4,'[\"AC\", \"TV\", \"WiFi\", \"Minibar\", \"Living Room\", \"Bathroom\", \"Balcony\", \"Jacuzzi\"]',NULL,NULL,'2026-03-15 11:27:22','2026-03-16 09:49:11',NULL,1000.00,2),(51,'411',4,'suite_triple','available','clean',8000.00,4,'[\"AC\", \"TV\", \"WiFi\", \"Minibar\", \"Living Room\", \"Bathroom\", \"Balcony\", \"Jacuzzi\"]',NULL,NULL,'2026-03-15 11:27:22','2026-03-16 09:49:11',NULL,1000.00,2),(52,'412',4,'suite_triple','available','clean',8000.00,4,'[\"AC\", \"TV\", \"WiFi\", \"Minibar\", \"Living Room\", \"Bathroom\", \"Balcony\", \"Jacuzzi\"]',NULL,NULL,'2026-03-15 11:27:22','2026-03-16 09:49:11',NULL,1000.00,2),(53,'413',4,'suite_triple','available','clean',8000.00,4,'[\"AC\", \"TV\", \"WiFi\", \"Minibar\", \"Living Room\", \"Bathroom\", \"Balcony\", \"Jacuzzi\"]',NULL,NULL,'2026-03-15 11:27:22','2026-03-16 09:49:11',NULL,1000.00,2),(54,'414',4,'suite_triple','available','clean',8000.00,4,'[\"AC\", \"TV\", \"WiFi\", \"Minibar\", \"Living Room\", \"Bathroom\", \"Balcony\", \"Jacuzzi\"]',NULL,NULL,'2026-03-15 11:27:22','2026-03-16 09:49:11',NULL,1000.00,2),(55,'415',4,'suite_triple','available','clean',8000.00,4,'[\"AC\", \"TV\", \"WiFi\", \"Minibar\", \"Living Room\", \"Bathroom\", \"Balcony\", \"Jacuzzi\"]',NULL,NULL,'2026-03-15 11:27:22','2026-03-16 09:49:11',NULL,1000.00,2),(56,'501',5,'comfort_executive_double','available','clean',10000.00,4,'[\"AC\", \"TV\", \"WiFi\", \"Minibar\", \"Living Room\", \"Kitchen\", \"Bathroom\", \"Balcony\", \"Jacuzzi\", \"Butler Service\"]',NULL,NULL,'2026-03-15 11:27:22','2026-04-08 11:44:02',NULL,1200.00,3),(57,'502',5,'comfort_executive_double','available','clean',10000.00,4,'[\"AC\", \"TV\", \"WiFi\", \"Minibar\", \"Living Room\", \"Kitchen\", \"Bathroom\", \"Balcony\", \"Jacuzzi\", \"Butler Service\"]',NULL,NULL,'2026-03-15 11:27:22','2026-04-08 11:44:02',NULL,1200.00,3),(58,'503',5,'comfort_executive_double','available','clean',10000.00,4,'[\"AC\", \"TV\", \"WiFi\", \"Minibar\", \"Living Room\", \"Kitchen\", \"Bathroom\", \"Balcony\", \"Jacuzzi\", \"Butler Service\"]',NULL,NULL,'2026-03-15 11:27:22','2026-04-08 11:44:02',NULL,1200.00,3);
/*!40000 ALTER TABLE `rooms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shift_handovers`
--

DROP TABLE IF EXISTS `shift_handovers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shift_handovers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `outgoing_user_id` int NOT NULL,
  `incoming_user_id` int DEFAULT NULL,
  `shift_date` date NOT NULL,
  `shift` enum('morning','afternoon','night') NOT NULL,
  `cash_in_hand` decimal(12,2) DEFAULT '0.00',
  `total_collections` decimal(12,2) DEFAULT '0.00',
  `pending_checkouts` int DEFAULT '0',
  `notes` text,
  `tasks_pending` json DEFAULT NULL,
  `status` enum('pending','accepted','rejected') DEFAULT 'pending',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `outgoing_user_id` (`outgoing_user_id`),
  KEY `incoming_user_id` (`incoming_user_id`),
  CONSTRAINT `shift_handovers_ibfk_1` FOREIGN KEY (`outgoing_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `shift_handovers_ibfk_2` FOREIGN KEY (`incoming_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shift_handovers`
--

LOCK TABLES `shift_handovers` WRITE;
/*!40000 ALTER TABLE `shift_handovers` DISABLE KEYS */;
/*!40000 ALTER TABLE `shift_handovers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `staff`
--

DROP TABLE IF EXISTS `staff`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `staff` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `employee_id` varchar(20) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `department` enum('front_office','housekeeping','restaurant','maintenance','management','security','accounts') NOT NULL,
  `designation` varchar(50) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `date_of_joining` date DEFAULT NULL,
  `salary` decimal(10,2) DEFAULT NULL,
  `shift` enum('morning','afternoon','night') DEFAULT 'morning',
  `status` enum('active','inactive','on_leave') DEFAULT 'active',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `staff_employee_id` (`employee_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `staff_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staff`
--

LOCK TABLES `staff` WRITE;
/*!40000 ALTER TABLE `staff` DISABLE KEYS */;
INSERT INTO `staff` VALUES (1,NULL,'EMP0001','Manibharathi','Jayanthi','front_office','','+919710658669','','2026-03-01',20000.00,'morning','active','2026-03-16 07:21:48','2026-03-16 07:21:48'),(2,NULL,'EMP0002','Praburajan','Ekambaram','housekeeping','','+919600037999','epraburajan@gmail.com','2026-03-01',1234.00,'morning','active','2026-03-16 07:22:23','2026-03-16 07:22:23');
/*!40000 ALTER TABLE `staff` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `staff_schedules`
--

DROP TABLE IF EXISTS `staff_schedules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `staff_schedules` (
  `id` int NOT NULL AUTO_INCREMENT,
  `staff_id` int NOT NULL,
  `date` date NOT NULL,
  `shift` enum('morning','afternoon','night') NOT NULL,
  `status` enum('scheduled','present','absent','leave') DEFAULT 'scheduled',
  `notes` text,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `staff_id` (`staff_id`),
  CONSTRAINT `staff_schedules_ibfk_1` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staff_schedules`
--

LOCK TABLES `staff_schedules` WRITE;
/*!40000 ALTER TABLE `staff_schedules` DISABLE KEYS */;
/*!40000 ALTER TABLE `staff_schedules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `full_name` varchar(100) NOT NULL,
  `role` enum('admin','manager','front_desk','housekeeping','restaurant','staff') NOT NULL DEFAULT 'staff',
  `phone` varchar(20) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `username_2` (`username`),
  UNIQUE KEY `username_3` (`username`),
  UNIQUE KEY `username_4` (`username`),
  UNIQUE KEY `username_5` (`username`),
  UNIQUE KEY `username_6` (`username`),
  UNIQUE KEY `username_7` (`username`),
  UNIQUE KEY `username_8` (`username`),
  UNIQUE KEY `username_9` (`username`),
  UNIQUE KEY `username_10` (`username`),
  UNIQUE KEY `username_11` (`username`),
  UNIQUE KEY `username_12` (`username`),
  UNIQUE KEY `username_13` (`username`),
  UNIQUE KEY `username_14` (`username`),
  UNIQUE KEY `username_15` (`username`),
  UNIQUE KEY `username_16` (`username`),
  UNIQUE KEY `username_17` (`username`),
  UNIQUE KEY `username_18` (`username`),
  UNIQUE KEY `username_19` (`username`),
  UNIQUE KEY `username_20` (`username`),
  UNIQUE KEY `username_21` (`username`),
  UNIQUE KEY `username_22` (`username`),
  UNIQUE KEY `username_23` (`username`),
  UNIQUE KEY `username_24` (`username`),
  UNIQUE KEY `username_25` (`username`),
  UNIQUE KEY `username_26` (`username`),
  UNIQUE KEY `username_27` (`username`),
  UNIQUE KEY `username_28` (`username`),
  UNIQUE KEY `username_29` (`username`),
  UNIQUE KEY `username_30` (`username`),
  UNIQUE KEY `username_31` (`username`),
  UNIQUE KEY `username_32` (`username`),
  UNIQUE KEY `username_33` (`username`),
  UNIQUE KEY `username_34` (`username`),
  UNIQUE KEY `username_35` (`username`),
  UNIQUE KEY `username_36` (`username`),
  UNIQUE KEY `username_37` (`username`),
  UNIQUE KEY `username_38` (`username`),
  UNIQUE KEY `username_39` (`username`),
  UNIQUE KEY `username_40` (`username`),
  UNIQUE KEY `username_41` (`username`),
  UNIQUE KEY `username_42` (`username`),
  UNIQUE KEY `username_43` (`username`),
  UNIQUE KEY `username_44` (`username`),
  UNIQUE KEY `username_45` (`username`),
  UNIQUE KEY `username_46` (`username`),
  UNIQUE KEY `username_47` (`username`),
  UNIQUE KEY `username_48` (`username`),
  UNIQUE KEY `username_49` (`username`),
  UNIQUE KEY `username_50` (`username`),
  UNIQUE KEY `username_51` (`username`),
  UNIQUE KEY `username_52` (`username`),
  UNIQUE KEY `username_53` (`username`),
  UNIQUE KEY `username_54` (`username`),
  UNIQUE KEY `username_55` (`username`),
  UNIQUE KEY `username_56` (`username`),
  UNIQUE KEY `username_57` (`username`),
  UNIQUE KEY `username_58` (`username`),
  UNIQUE KEY `username_59` (`username`),
  UNIQUE KEY `username_60` (`username`),
  UNIQUE KEY `username_61` (`username`),
  UNIQUE KEY `username_62` (`username`),
  UNIQUE KEY `username_63` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin','$2a$10$945ridbJzwjpFjQXsXdwqOYN.xg5LZi1vMbbHjiosIEqPG3wKeU2W','admin@hotel.com','System Administrator','admin',NULL,1,'2026-03-15 11:27:22','2026-03-15 11:27:22'),(2,'manager','$2a$10$JB70bqAi0DJgAlWDhnsz5.jjt6XbG81y0qHaALWIG0S3p6rParcSK','manager@hotel.com','Hotel Manager','manager',NULL,1,'2026-03-15 11:27:22','2026-03-15 11:27:22'),(3,'frontdesk','$2a$10$Ekf2weR2NeQNe1QfiBr9c.8LbgwurBWt4O.xjhuszXf1eo1Kj.ZwS','frontdesk@hotel.com','Front Desk Staff','front_desk',NULL,1,'2026-03-15 11:27:22','2026-03-15 11:27:22'),(4,'restaurant','$2a$10$x8jitU9ZcfA.Mjh/IURLHO1rjyo3kg7l8STjFRtiNAr3CGjcTTQhC','restaurant@hotel.com','Restaurant Staff','restaurant',NULL,1,'2026-03-15 11:27:22','2026-03-15 11:27:22'),(5,'housekeeper','$2a$10$uYmNhNEUUmbFNDkpEecHPejPJRl0GUB1QckMaDzz9/JIuIp.LX.zG','hk@hotel.com','Housekeeping Staff','housekeeping',NULL,1,'2026-03-15 11:27:22','2026-03-15 11:27:22');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `webhook_events`
--

DROP TABLE IF EXISTS `webhook_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `webhook_events` (
  `id` int NOT NULL AUTO_INCREMENT,
  `channel_id` int NOT NULL,
  `event_id` varchar(200) NOT NULL COMMENT 'OTA-provided event/transaction ID for idempotency',
  `event_type` varchar(50) NOT NULL COMMENT 'booking, modification, cancellation',
  `payload` json NOT NULL,
  `status` enum('received','processing','processed','failed','duplicate') DEFAULT 'received',
  `error_message` text,
  `processed_at` datetime DEFAULT NULL,
  `retry_count` int DEFAULT '0',
  `reservation_id` int DEFAULT NULL COMMENT 'Linked reservation after processing',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `webhook_events_channel_id_event_id` (`channel_id`,`event_id`),
  KEY `reservation_id` (`reservation_id`),
  CONSTRAINT `webhook_events_ibfk_55` FOREIGN KEY (`channel_id`) REFERENCES `ota_channels` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `webhook_events_ibfk_56` FOREIGN KEY (`reservation_id`) REFERENCES `reservations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `webhook_events`
--

LOCK TABLES `webhook_events` WRITE;
/*!40000 ALTER TABLE `webhook_events` DISABLE KEYS */;
/*!40000 ALTER TABLE `webhook_events` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-08 21:19:22

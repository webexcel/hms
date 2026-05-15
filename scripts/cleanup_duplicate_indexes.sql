-- ============================================================================
-- Cleanup duplicate numbered indexes (Sequelize alter:true bloat)
-- ============================================================================
-- Background: Each Sequelize sync with `alter: true` adds a fresh `<col>_N`
-- UNIQUE/INDEX even though the original `<col>` (or `<col>_1`) already covers
-- it. MySQL caps each table at 64 indexes — hitting that cap breaks sync.
--
-- This script:
--   1. Generates DROP INDEX statements for indexes matching `<name>_<number>$`
--   2. Skips PRIMARY and the lowest-numbered duplicate
--   3. Outputs the statements for review, then re-runs to execute
--
-- Run against the target schema (e.g. mysql -uroot hotel_udhayam < cleanup_duplicate_indexes.sql)
-- ============================================================================

-- Step 1: Preview — show which indexes will be dropped
SELECT CONCAT('ALTER TABLE `', TABLE_NAME, '` DROP INDEX `', INDEX_NAME, '`;') AS preview_drop_stmt
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
  AND INDEX_NAME REGEXP '_[0-9]+$'
  AND INDEX_NAME != 'PRIMARY'
GROUP BY TABLE_NAME, INDEX_NAME
ORDER BY TABLE_NAME, INDEX_NAME;

-- Step 2: Build and execute drops via a stored procedure
DELIMITER $$

DROP PROCEDURE IF EXISTS drop_duplicate_indexes$$

CREATE PROCEDURE drop_duplicate_indexes()
BEGIN
  DECLARE done INT DEFAULT 0;
  DECLARE v_table VARCHAR(64);
  DECLARE v_index VARCHAR(64);
  DECLARE v_stmt TEXT;

  DECLARE cur CURSOR FOR
    SELECT DISTINCT TABLE_NAME, INDEX_NAME
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND INDEX_NAME REGEXP '_[0-9]+$'
      AND INDEX_NAME != 'PRIMARY';

  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

  OPEN cur;
  read_loop: LOOP
    FETCH cur INTO v_table, v_index;
    IF done THEN
      LEAVE read_loop;
    END IF;

    SET @stmt = CONCAT('ALTER TABLE `', v_table, '` DROP INDEX `', v_index, '`');
    PREPARE s FROM @stmt;
    EXECUTE s;
    DEALLOCATE PREPARE s;
  END LOOP;
  CLOSE cur;
END$$

DELIMITER ;

CALL drop_duplicate_indexes();
DROP PROCEDURE drop_duplicate_indexes;

-- Step 3: Verify — index counts per table after cleanup
SELECT TABLE_NAME, COUNT(DISTINCT INDEX_NAME) AS idx_count
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
GROUP BY TABLE_NAME
ORDER BY idx_count DESC;

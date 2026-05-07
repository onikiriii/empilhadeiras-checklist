using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Checklist.Api.Migrations
{
    /// <inheritdoc />
    public partial class SplitSupervisorAndInspectorAccess : Migration
    {
        /// <inheritdoc />
       protected override void Up(MigrationBuilder migrationBuilder)
{
    migrationBuilder.Sql("""
        SET @col_exists := (
            SELECT COUNT(*)
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'UsuariosSupervisores'
              AND COLUMN_NAME = 'TipoUsuario'
        );

        SET @sql := IF(
            @col_exists = 0,
            'ALTER TABLE `UsuariosSupervisores` ADD `TipoUsuario` int NOT NULL DEFAULT 1;',
            'SELECT 1;'
        );

        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
        """);

    migrationBuilder.Sql("""
        CREATE TABLE IF NOT EXISTS `UsuariosSupervisoresModulos` (
            `Id` char(36) NOT NULL,
            `UsuarioSupervisorId` char(36) NOT NULL,
            `Modulo` int NOT NULL,
            `CriadoEm` datetime(6) NOT NULL,
            PRIMARY KEY (`Id`),
            CONSTRAINT `FK_UserSupervisorModules_User`
                FOREIGN KEY (`UsuarioSupervisorId`)
                REFERENCES `UsuariosSupervisores` (`Id`)
                ON DELETE CASCADE
        ) CHARACTER SET utf8mb4;
        """);

    migrationBuilder.Sql("""
        CREATE UNIQUE INDEX IF NOT EXISTS `IX_UsuariosSupervisoresModulos_UsuarioSupervisorId_Modulo`
        ON `UsuariosSupervisoresModulos` (`UsuarioSupervisorId`, `Modulo`);
        """);

    migrationBuilder.Sql("""
        SET @old_st_exists := (
            SELECT COUNT(*)
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'UsuariosSupervisores'
              AND COLUMN_NAME = 'PodeAcessarSegurancaTrabalho'
        );

        SET @old_so_exists := (
            SELECT COUNT(*)
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'UsuariosSupervisores'
              AND COLUMN_NAME = 'PodeAcessarSupervisaoOperacional'
        );

        SET @sql := IF(
            @old_st_exists > 0 AND @old_so_exists > 0,
            '
            UPDATE UsuariosSupervisores
            SET TipoUsuario = 2
            WHERE PodeAcessarSupervisaoOperacional = 0
              AND PodeAcessarSegurancaTrabalho = 1;
            ',
            'SELECT 1;'
        );

        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
        """);

    migrationBuilder.Sql("""
        SET @old_so_exists := (
            SELECT COUNT(*)
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'UsuariosSupervisores'
              AND COLUMN_NAME = 'PodeAcessarSupervisaoOperacional'
        );

        SET @sql := IF(
            @old_so_exists > 0,
            '
            INSERT INTO UsuariosSupervisoresModulos (Id, UsuarioSupervisorId, Modulo, CriadoEm)
            SELECT UUID(), u.Id, 1, UTC_TIMESTAMP()
            FROM UsuariosSupervisores u
            WHERE u.PodeAcessarSupervisaoOperacional = 1
              AND NOT EXISTS (
                  SELECT 1
                  FROM UsuariosSupervisoresModulos m
                  WHERE m.UsuarioSupervisorId = u.Id
                    AND m.Modulo = 1
              );
            ',
            'SELECT 1;'
        );

        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
        """);

    migrationBuilder.Sql("""
        SET @old_st_exists := (
            SELECT COUNT(*)
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'UsuariosSupervisores'
              AND COLUMN_NAME = 'PodeAcessarSegurancaTrabalho'
        );

        SET @sql := IF(
            @old_st_exists > 0,
            '
            INSERT INTO UsuariosSupervisoresModulos (Id, UsuarioSupervisorId, Modulo, CriadoEm)
            SELECT UUID(), u.Id, 2, UTC_TIMESTAMP()
            FROM UsuariosSupervisores u
            WHERE u.PodeAcessarSegurancaTrabalho = 1
              AND NOT EXISTS (
                  SELECT 1
                  FROM UsuariosSupervisoresModulos m
                  WHERE m.UsuarioSupervisorId = u.Id
                    AND m.Modulo = 2
              );
            ',
            'SELECT 1;'
        );

        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
        """);

    migrationBuilder.Sql("""
        SET @col_exists := (
            SELECT COUNT(*)
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'UsuariosSupervisores'
              AND COLUMN_NAME = 'PodeAcessarSegurancaTrabalho'
        );

        SET @sql := IF(
            @col_exists > 0,
            'ALTER TABLE `UsuariosSupervisores` DROP COLUMN `PodeAcessarSegurancaTrabalho`;',
            'SELECT 1;'
        );

        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
        """);

    migrationBuilder.Sql("""
        SET @col_exists := (
            SELECT COUNT(*)
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'UsuariosSupervisores'
              AND COLUMN_NAME = 'PodeAcessarSupervisaoOperacional'
        );

        SET @sql := IF(
            @col_exists > 0,
            'ALTER TABLE `UsuariosSupervisores` DROP COLUMN `PodeAcessarSupervisaoOperacional`;',
            'SELECT 1;'
        );

        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
        """);
}
    }
}

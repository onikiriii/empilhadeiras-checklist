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
        ALTER TABLE `UsuariosSupervisores`
        ADD COLUMN IF NOT EXISTS `TipoUsuario` int NOT NULL DEFAULT 1;
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
        INSERT INTO UsuariosSupervisoresModulos (Id, UsuarioSupervisorId, Modulo, CriadoEm)
        SELECT UUID(), u.Id, 1, UTC_TIMESTAMP()
        FROM UsuariosSupervisores u
        WHERE NOT EXISTS (
            SELECT 1
            FROM UsuariosSupervisoresModulos m
            WHERE m.UsuarioSupervisorId = u.Id
              AND m.Modulo = 1
        );
        """);

    migrationBuilder.Sql("""
        ALTER TABLE `UsuariosSupervisores`
        DROP COLUMN IF EXISTS `PodeAcessarSegurancaTrabalho`;
        """);

    migrationBuilder.Sql("""
        ALTER TABLE `UsuariosSupervisores`
        DROP COLUMN IF EXISTS `PodeAcessarSupervisaoOperacional`;
        """);
}
    }
}

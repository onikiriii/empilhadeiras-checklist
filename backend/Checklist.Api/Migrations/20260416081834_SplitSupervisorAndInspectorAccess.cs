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
            migrationBuilder.AddColumn<int>(
                name: "TipoUsuario",
                table: "UsuariosSupervisores",
                type: "int",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.CreateTable(
                name: "UsuariosSupervisoresModulos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false),
                    UsuarioSupervisorId = table.Column<Guid>(type: "char(36)", nullable: false),
                    Modulo = table.Column<int>(type: "int", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UsuariosSupervisoresModulos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserSupervisorModules_User",
                        column: x => x.UsuarioSupervisorId,
                        principalTable: "UsuariosSupervisores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_UsuariosSupervisoresModulos_UsuarioSupervisorId_Modulo",
                table: "UsuariosSupervisoresModulos",
                columns: new[] { "UsuarioSupervisorId", "Modulo" },
                unique: true);

            migrationBuilder.Sql("""
                UPDATE UsuariosSupervisores
                SET TipoUsuario = 2
                WHERE PodeAcessarSupervisaoOperacional = 0
                  AND PodeAcessarSegurancaTrabalho = 1;
                """);

            migrationBuilder.Sql("""
                INSERT INTO UsuariosSupervisoresModulos (Id, UsuarioSupervisorId, Modulo, CriadoEm)
                SELECT UUID(), Id, 1, UTC_TIMESTAMP()
                FROM UsuariosSupervisores
                WHERE PodeAcessarSupervisaoOperacional = 1;
                """);

            migrationBuilder.Sql("""
                INSERT INTO UsuariosSupervisoresModulos (Id, UsuarioSupervisorId, Modulo, CriadoEm)
                SELECT UUID(), Id, 2, UTC_TIMESTAMP()
                FROM UsuariosSupervisores
                WHERE PodeAcessarSegurancaTrabalho = 1;
                """);

            migrationBuilder.DropColumn(
                name: "PodeAcessarSegurancaTrabalho",
                table: "UsuariosSupervisores");

            migrationBuilder.DropColumn(
                name: "PodeAcessarSupervisaoOperacional",
                table: "UsuariosSupervisores");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "PodeAcessarSegurancaTrabalho",
                table: "UsuariosSupervisores",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "PodeAcessarSupervisaoOperacional",
                table: "UsuariosSupervisores",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: true);

            migrationBuilder.Sql("""
                UPDATE UsuariosSupervisores
                SET PodeAcessarSupervisaoOperacional = 0,
                    PodeAcessarSegurancaTrabalho = 0;
                """);

            migrationBuilder.Sql("""
                UPDATE UsuariosSupervisores u
                INNER JOIN UsuariosSupervisoresModulos m
                    ON m.UsuarioSupervisorId = u.Id
                SET u.PodeAcessarSupervisaoOperacional = 1
                WHERE m.Modulo = 1;
                """);

            migrationBuilder.Sql("""
                UPDATE UsuariosSupervisores u
                INNER JOIN UsuariosSupervisoresModulos m
                    ON m.UsuarioSupervisorId = u.Id
                SET u.PodeAcessarSegurancaTrabalho = 1
                WHERE m.Modulo = 2;
                """);

            migrationBuilder.DropTable(
                name: "UsuariosSupervisoresModulos");

            migrationBuilder.DropColumn(
                name: "TipoUsuario",
                table: "UsuariosSupervisores");
        }
    }
}

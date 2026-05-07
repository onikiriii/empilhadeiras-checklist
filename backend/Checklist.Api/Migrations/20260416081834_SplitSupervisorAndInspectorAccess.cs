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
}
    }
}

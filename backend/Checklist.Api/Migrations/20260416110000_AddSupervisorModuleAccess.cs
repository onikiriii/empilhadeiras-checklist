using Checklist.Api.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Checklist.Api.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260416110000_AddSupervisorModuleAccess")]
    public partial class AddSupervisorModuleAccess : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
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
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PodeAcessarSegurancaTrabalho",
                table: "UsuariosSupervisores");

            migrationBuilder.DropColumn(
                name: "PodeAcessarSupervisaoOperacional",
                table: "UsuariosSupervisores");
        }
    }
}

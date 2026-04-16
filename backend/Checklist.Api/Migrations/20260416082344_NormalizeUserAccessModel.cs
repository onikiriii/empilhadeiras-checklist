using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Checklist.Api.Migrations
{
    /// <inheritdoc />
    public partial class NormalizeUserAccessModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "TipoUsuario",
                table: "UsuariosSupervisores",
                type: "int",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int",
                oldDefaultValue: 1);

        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "TipoUsuario",
                table: "UsuariosSupervisores",
                type: "int",
                nullable: false,
                defaultValue: 1,
                oldClrType: typeof(int),
                oldType: "int");
        }
    }
}

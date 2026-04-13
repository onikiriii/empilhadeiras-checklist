using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Checklist.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddImagemNokBase64EmChecklistItem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ImagemNokBase64",
                table: "ChecklistItens",
                type: "longtext",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ImagemNokMimeType",
                table: "ChecklistItens",
                type: "varchar(120)",
                maxLength: 120,
                nullable: true)
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "ImagemNokNomeArquivo",
                table: "ChecklistItens",
                type: "varchar(260)",
                maxLength: 260,
                nullable: true)
                .Annotation("MySQL:Charset", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ImagemNokBase64",
                table: "ChecklistItens");

            migrationBuilder.DropColumn(
                name: "ImagemNokMimeType",
                table: "ChecklistItens");

            migrationBuilder.DropColumn(
                name: "ImagemNokNomeArquivo",
                table: "ChecklistItens");
        }
    }
}

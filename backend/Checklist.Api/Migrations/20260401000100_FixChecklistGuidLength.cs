using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Checklist.Api.Migrations
{
    public partial class FixChecklistGuidLength : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ChecklistItens_Checklists_ChecklistId",
                table: "ChecklistItens");

            migrationBuilder.AlterColumn<Guid>(
                name: "Id",
                table: "Checklists",
                type: "char(36)",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "char(32)",
                oldMaxLength: 32);

            migrationBuilder.AlterColumn<Guid>(
                name: "ChecklistId",
                table: "ChecklistItens",
                type: "char(36)",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "char(32)");

            migrationBuilder.AddForeignKey(
                name: "FK_ChecklistItens_Checklists_ChecklistId",
                table: "ChecklistItens",
                column: "ChecklistId",
                principalTable: "Checklists",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ChecklistItens_Checklists_ChecklistId",
                table: "ChecklistItens");

            migrationBuilder.AlterColumn<Guid>(
                name: "Id",
                table: "Checklists",
                type: "char(32)",
                maxLength: 32,
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "char(36)");

            migrationBuilder.AlterColumn<Guid>(
                name: "ChecklistId",
                table: "ChecklistItens",
                type: "char(32)",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "char(36)");

            migrationBuilder.AddForeignKey(
                name: "FK_ChecklistItens_Checklists_ChecklistId",
                table: "ChecklistItens",
                column: "ChecklistId",
                principalTable: "Checklists",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
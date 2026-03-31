using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Checklist.Api.Migrations
{
    /// <inheritdoc />
    public partial class FixChecklistGuidColumnLength : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_FechamentosChecklistMensaisChecklists_Checklists_ChecklistId",
                table: "FechamentosChecklistMensaisChecklists");

            migrationBuilder.DropForeignKey(
                name: "FK_ChecklistItens_Checklists_ChecklistId",
                table: "ChecklistItens");

            migrationBuilder.AlterColumn<Guid>(
                name: "ChecklistId",
                table: "FechamentosChecklistMensaisChecklists",
                type: "char(36)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "char(32)",
                oldMaxLength: 32);

            migrationBuilder.AlterColumn<Guid>(
                name: "Id",
                table: "Checklists",
                type: "char(36)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "char(32)",
                oldMaxLength: 32);

            migrationBuilder.AlterColumn<Guid>(
                name: "ChecklistId",
                table: "ChecklistItens",
                type: "char(36)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "char(32)",
                oldMaxLength: 32);

            migrationBuilder.AddForeignKey(
                name: "FK_FechamentosChecklistMensaisChecklists_Checklists_ChecklistId",
                table: "FechamentosChecklistMensaisChecklists",
                column: "ChecklistId",
                principalTable: "Checklists",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ChecklistItens_Checklists_ChecklistId",
                table: "ChecklistItens",
                column: "ChecklistId",
                principalTable: "Checklists",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_FechamentosChecklistMensaisChecklists_Checklists_ChecklistId",
                table: "FechamentosChecklistMensaisChecklists");

            migrationBuilder.DropForeignKey(
                name: "FK_ChecklistItens_Checklists_ChecklistId",
                table: "ChecklistItens");

            migrationBuilder.AlterColumn<string>(
                name: "ChecklistId",
                table: "FechamentosChecklistMensaisChecklists",
                type: "char(32)",
                maxLength: 32,
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "char(36)");

            migrationBuilder.AlterColumn<string>(
                name: "Id",
                table: "Checklists",
                type: "char(32)",
                maxLength: 32,
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "char(36)");

            migrationBuilder.AlterColumn<string>(
                name: "ChecklistId",
                table: "ChecklistItens",
                type: "char(32)",
                maxLength: 32,
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "char(36)");

            migrationBuilder.AddForeignKey(
                name: "FK_FechamentosChecklistMensaisChecklists_Checklists_ChecklistId",
                table: "FechamentosChecklistMensaisChecklists",
                column: "ChecklistId",
                principalTable: "Checklists",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

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

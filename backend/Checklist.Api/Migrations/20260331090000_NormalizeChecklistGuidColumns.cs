using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Checklist.Api.Migrations;

public partial class NormalizeChecklistGuidColumns : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropForeignKey(
            name: "FK_ChecklistItens_Checklists_ChecklistId",
            table: "ChecklistItens");

        migrationBuilder.DropForeignKey(
            name: "FK_FechamentosChecklistMensaisChecklists_Checklists_ChecklistId",
            table: "FechamentosChecklistMensaisChecklists");

        migrationBuilder.Sql("""
            ALTER TABLE `Checklists`
            MODIFY COLUMN `Id` char(36) NOT NULL;
            """);

        migrationBuilder.Sql("""
            ALTER TABLE `ChecklistItens`
            MODIFY COLUMN `Id` char(36) NOT NULL,
            MODIFY COLUMN `ChecklistId` char(36) NOT NULL;
            """);

        migrationBuilder.Sql("""
            ALTER TABLE `FechamentosChecklistMensaisChecklists`
            MODIFY COLUMN `ChecklistId` char(36) NOT NULL;
            """);

        migrationBuilder.AddForeignKey(
            name: "FK_ChecklistItens_Checklists_ChecklistId",
            table: "ChecklistItens",
            column: "ChecklistId",
            principalTable: "Checklists",
            principalColumn: "Id",
            onDelete: ReferentialAction.Cascade);

        migrationBuilder.AddForeignKey(
            name: "FK_FechamentosChecklistMensaisChecklists_Checklists_ChecklistId",
            table: "FechamentosChecklistMensaisChecklists",
            column: "ChecklistId",
            principalTable: "Checklists",
            principalColumn: "Id",
            onDelete: ReferentialAction.Restrict);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropForeignKey(
            name: "FK_ChecklistItens_Checklists_ChecklistId",
            table: "ChecklistItens");

        migrationBuilder.DropForeignKey(
            name: "FK_FechamentosChecklistMensaisChecklists_Checklists_ChecklistId",
            table: "FechamentosChecklistMensaisChecklists");

        migrationBuilder.Sql("""
            ALTER TABLE `FechamentosChecklistMensaisChecklists`
            MODIFY COLUMN `ChecklistId` char(32) NOT NULL;
            """);

        migrationBuilder.Sql("""
            ALTER TABLE `ChecklistItens`
            MODIFY COLUMN `ChecklistId` char(32) NOT NULL,
            MODIFY COLUMN `Id` char(32) NOT NULL;
            """);

        migrationBuilder.Sql("""
            ALTER TABLE `Checklists`
            MODIFY COLUMN `Id` char(32) NOT NULL;
            """);

        migrationBuilder.AddForeignKey(
            name: "FK_ChecklistItens_Checklists_ChecklistId",
            table: "ChecklistItens",
            column: "ChecklistId",
            principalTable: "Checklists",
            principalColumn: "Id",
            onDelete: ReferentialAction.Cascade);

        migrationBuilder.AddForeignKey(
            name: "FK_FechamentosChecklistMensaisChecklists_Checklists_ChecklistId",
            table: "FechamentosChecklistMensaisChecklists",
            column: "ChecklistId",
            principalTable: "Checklists",
            principalColumn: "Id",
            onDelete: ReferentialAction.Restrict);
    }
}

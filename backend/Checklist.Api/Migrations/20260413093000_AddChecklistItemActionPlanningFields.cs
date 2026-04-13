using System;
using Checklist.Api.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Checklist.Api.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260413093000_AddChecklistItemActionPlanningFields")]
    public partial class AddChecklistItemActionPlanningFields : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "DataPrevistaConclusao",
                table: "ChecklistItensAcoes",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ObservacaoResponsavel",
                table: "ChecklistItensAcoes",
                type: "varchar(2000)",
                maxLength: 2000,
                nullable: true)
                .Annotation("MySQL:Charset", "utf8mb4");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DataPrevistaConclusao",
                table: "ChecklistItensAcoes");

            migrationBuilder.DropColumn(
                name: "ObservacaoResponsavel",
                table: "ChecklistItensAcoes");
        }
    }
}

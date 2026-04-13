using System;
using Checklist.Api.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Checklist.Api.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260413130000_AddChecklistItemActionHistoryAndProgress")]
    public partial class AddChecklistItemActionHistoryAndProgress : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "PercentualConclusao",
                table: "ChecklistItensAcoes",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "ChecklistItensAcoesHistorico",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false),
                    ChecklistItemAcaoId = table.Column<Guid>(type: "char(36)", nullable: false),
                    CriadoPorSupervisorId = table.Column<Guid>(type: "char(36)", nullable: false),
                    Titulo = table.Column<string>(type: "varchar(160)", maxLength: 160, nullable: false),
                    Descricao = table.Column<string>(type: "varchar(4000)", maxLength: 4000, nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChecklistItensAcoesHistorico", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CIAHistorico_Acao",
                        column: x => x.ChecklistItemAcaoId,
                        principalTable: "ChecklistItensAcoes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CIAHistorico_Supervisor",
                        column: x => x.CriadoPorSupervisorId,
                        principalTable: "UsuariosSupervisores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_ChecklistItensAcoesHistorico_ChecklistItemAcaoId",
                table: "ChecklistItensAcoesHistorico",
                column: "ChecklistItemAcaoId");

            migrationBuilder.CreateIndex(
                name: "IX_ChecklistItensAcoesHistorico_CriadoPorSupervisorId",
                table: "ChecklistItensAcoesHistorico",
                column: "CriadoPorSupervisorId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ChecklistItensAcoesHistorico");

            migrationBuilder.DropColumn(
                name: "PercentualConclusao",
                table: "ChecklistItensAcoes");
        }
    }
}

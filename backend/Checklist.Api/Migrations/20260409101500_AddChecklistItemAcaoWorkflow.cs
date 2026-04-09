using System;
using Checklist.Api.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Checklist.Api.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260409101500_AddChecklistItemAcaoWorkflow")]
    public partial class AddChecklistItemAcaoWorkflow : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ChecklistItensAcoes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false),
                    ChecklistItemId = table.Column<Guid>(type: "char(36)", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    AprovadoPorSupervisorId = table.Column<Guid>(type: "char(36)", nullable: false),
                    AprovadoEm = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    ResponsavelSupervisorId = table.Column<Guid>(type: "char(36)", nullable: true),
                    ResponsavelSetorId = table.Column<Guid>(type: "char(36)", nullable: true),
                    ObservacaoAtribuicao = table.Column<string>(type: "varchar(1000)", maxLength: 1000, nullable: true),
                    ConcluidoPorSupervisorId = table.Column<Guid>(type: "char(36)", nullable: true),
                    ConcluidoEm = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    CriadoEm = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChecklistItensAcoes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChecklistItensAcoes_ChecklistItens_ItemId",
                        column: x => x.ChecklistItemId,
                        principalTable: "ChecklistItens",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ChecklistItensAcoes_Setores_RespSetorId",
                        column: x => x.ResponsavelSetorId,
                        principalTable: "Setores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ChecklistItensAcoes_UsuariosSupervisores_AprovadoPorId",
                        column: x => x.AprovadoPorSupervisorId,
                        principalTable: "UsuariosSupervisores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ChecklistItensAcoes_UsuariosSupervisores_ConcluidoPorId",
                        column: x => x.ConcluidoPorSupervisorId,
                        principalTable: "UsuariosSupervisores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ChecklistItensAcoes_UsuariosSupervisores_ResponsavelId",
                        column: x => x.ResponsavelSupervisorId,
                        principalTable: "UsuariosSupervisores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_ChecklistItensAcoes_AprovadoPorSupervisorId",
                table: "ChecklistItensAcoes",
                column: "AprovadoPorSupervisorId");

            migrationBuilder.CreateIndex(
                name: "IX_ChecklistItensAcoes_ChecklistItemId",
                table: "ChecklistItensAcoes",
                column: "ChecklistItemId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ChecklistItensAcoes_ConcluidoPorSupervisorId",
                table: "ChecklistItensAcoes",
                column: "ConcluidoPorSupervisorId");

            migrationBuilder.CreateIndex(
                name: "IX_ChecklistItensAcoes_ResponsavelSetorId",
                table: "ChecklistItensAcoes",
                column: "ResponsavelSetorId");

            migrationBuilder.CreateIndex(
                name: "IX_ChecklistItensAcoes_ResponsavelSupervisorId",
                table: "ChecklistItensAcoes",
                column: "ResponsavelSupervisorId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ChecklistItensAcoes");
        }
    }
}

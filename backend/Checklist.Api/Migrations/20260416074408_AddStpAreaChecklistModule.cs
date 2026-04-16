using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Checklist.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddStpAreaChecklistModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "StpAreaChecklistTemplates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false),
                    SetorId = table.Column<Guid>(type: "char(36)", nullable: false),
                    Codigo = table.Column<string>(type: "varchar(40)", maxLength: 40, nullable: false),
                    Nome = table.Column<string>(type: "varchar(160)", maxLength: 160, nullable: false),
                    Ativo = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StpAreaChecklistTemplates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StpAreaChecklistTemplates_Setores_SetorId",
                        column: x => x.SetorId,
                        principalTable: "Setores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "StpAreaChecklists",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false),
                    SetorId = table.Column<Guid>(type: "char(36)", nullable: false),
                    TemplateId = table.Column<Guid>(type: "char(36)", nullable: false),
                    InspetorSupervisorId = table.Column<Guid>(type: "char(36)", nullable: false),
                    ResponsavelPresenteNome = table.Column<string>(type: "varchar(160)", maxLength: 160, nullable: false),
                    ResponsavelPresenteCargo = table.Column<string>(type: "varchar(120)", maxLength: 120, nullable: true),
                    ComportamentosPreventivosObservados = table.Column<string>(type: "varchar(4000)", maxLength: 4000, nullable: true),
                    AtosInsegurosObservados = table.Column<string>(type: "varchar(4000)", maxLength: 4000, nullable: true),
                    CondicoesInsegurasConstatadas = table.Column<string>(type: "varchar(4000)", maxLength: 4000, nullable: true),
                    AssinaturaInspetorBase64 = table.Column<string>(type: "longtext", nullable: false),
                    AssinaturaResponsavelPresenteBase64 = table.Column<string>(type: "longtext", nullable: false),
                    AssinadoInspetorEm = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    AssinadoResponsavelPresenteEm = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    DataRealizacao = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    DataReferencia = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StpAreaChecklists", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StpAreaChecklists_Setores_SetorId",
                        column: x => x.SetorId,
                        principalTable: "Setores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_StpAreaChecklists_StpAreaChecklistTemplates_TemplateId",
                        column: x => x.TemplateId,
                        principalTable: "StpAreaChecklistTemplates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_StpAreaChecklists_UsuariosSupervisores_InspetorSupervisorId",
                        column: x => x.InspetorSupervisorId,
                        principalTable: "UsuariosSupervisores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "StpAreaChecklistTemplateItens",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false),
                    TemplateId = table.Column<Guid>(type: "char(36)", nullable: false),
                    Ordem = table.Column<int>(type: "int", nullable: false),
                    Descricao = table.Column<string>(type: "varchar(300)", maxLength: 300, nullable: false),
                    Instrucao = table.Column<string>(type: "varchar(2000)", maxLength: 2000, nullable: true),
                    Ativo = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StpAreaChecklistTemplateItens", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StpAreaChecklistTemplateItens_StpAreaChecklistTemplates_Temp~",
                        column: x => x.TemplateId,
                        principalTable: "StpAreaChecklistTemplates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "StpAreaChecklistItens",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false),
                    ChecklistId = table.Column<Guid>(type: "char(36)", nullable: false),
                    TemplateItemId = table.Column<Guid>(type: "char(36)", nullable: false),
                    Ordem = table.Column<int>(type: "int", nullable: false),
                    Descricao = table.Column<string>(type: "varchar(300)", maxLength: 300, nullable: false),
                    Instrucao = table.Column<string>(type: "varchar(2000)", maxLength: 2000, nullable: true),
                    Resultado = table.Column<int>(type: "int", nullable: false),
                    Observacao = table.Column<string>(type: "varchar(2000)", maxLength: 2000, nullable: true),
                    CriadoEm = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StpAreaChecklistItens", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StpAreaChecklistItens_StpAreaChecklistTemplateItens_Template~",
                        column: x => x.TemplateItemId,
                        principalTable: "StpAreaChecklistTemplateItens",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_StpAreaChecklistItens_StpAreaChecklists_ChecklistId",
                        column: x => x.ChecklistId,
                        principalTable: "StpAreaChecklists",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_StpAreaChecklistItens_ChecklistId_Ordem",
                table: "StpAreaChecklistItens",
                columns: new[] { "ChecklistId", "Ordem" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_StpAreaChecklistItens_TemplateItemId",
                table: "StpAreaChecklistItens",
                column: "TemplateItemId");

            migrationBuilder.CreateIndex(
                name: "IX_StpAreaChecklists_InspetorSupervisorId",
                table: "StpAreaChecklists",
                column: "InspetorSupervisorId");

            migrationBuilder.CreateIndex(
                name: "IX_StpAreaChecklists_SetorId_DataReferencia",
                table: "StpAreaChecklists",
                columns: new[] { "SetorId", "DataReferencia" });

            migrationBuilder.CreateIndex(
                name: "IX_StpAreaChecklists_TemplateId",
                table: "StpAreaChecklists",
                column: "TemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_StpAreaChecklistTemplateItens_TemplateId_Ordem",
                table: "StpAreaChecklistTemplateItens",
                columns: new[] { "TemplateId", "Ordem" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_StpAreaChecklistTemplates_SetorId_Codigo",
                table: "StpAreaChecklistTemplates",
                columns: new[] { "SetorId", "Codigo" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "StpAreaChecklistItens");

            migrationBuilder.DropTable(
                name: "StpAreaChecklistTemplateItens");

            migrationBuilder.DropTable(
                name: "StpAreaChecklists");

            migrationBuilder.DropTable(
                name: "StpAreaChecklistTemplates");
        }
    }
}

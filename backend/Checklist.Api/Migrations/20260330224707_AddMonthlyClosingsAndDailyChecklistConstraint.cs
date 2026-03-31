using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Checklist.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddMonthlyClosingsAndDailyChecklistConstraint : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "DataReferencia",
                table: "Checklists",
                type: "datetime(6)",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.Sql("UPDATE Checklists SET DataReferencia = DataRealizacao;");

            migrationBuilder.CreateTable(
                name: "FechamentosChecklistMensais",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false),
                    SetorId = table.Column<Guid>(type: "char(36)", nullable: false),
                    EquipamentoId = table.Column<Guid>(type: "char(36)", nullable: false),
                    FechadoPorSupervisorId = table.Column<Guid>(type: "char(36)", nullable: false),
                    Ano = table.Column<int>(type: "int", nullable: false),
                    Mes = table.Column<int>(type: "int", nullable: false),
                    TemplateNome = table.Column<string>(type: "varchar(120)", maxLength: 120, nullable: false),
                    TemplateVersao = table.Column<string>(type: "varchar(40)", maxLength: 40, nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    SnapshotJson = table.Column<string>(type: "longtext", nullable: false),
                    NomeArquivoPdf = table.Column<string>(type: "varchar(180)", maxLength: 180, nullable: false),
                    HashPdfSha256 = table.Column<string>(type: "varchar(128)", maxLength: 128, nullable: false),
                    PdfConteudo = table.Column<byte[]>(type: "longblob", nullable: false),
                    QuantidadeChecklists = table.Column<int>(type: "int", nullable: false),
                    FechadoEm = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FechamentosChecklistMensais", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FechamentosChecklistMensais_Equipamentos_EquipamentoId",
                        column: x => x.EquipamentoId,
                        principalTable: "Equipamentos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_FechamentosChecklistMensais_Setores_SetorId",
                        column: x => x.SetorId,
                        principalTable: "Setores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_FechamentosChecklistMensais_UsuariosSupervisores_FechadoPorS~",
                        column: x => x.FechadoPorSupervisorId,
                        principalTable: "UsuariosSupervisores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "FechamentosChecklistMensaisChecklists",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false),
                    FechamentoChecklistMensalId = table.Column<Guid>(type: "char(36)", nullable: false),
                    ChecklistId = table.Column<Guid>(type: "char(32)", maxLength: 32, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FechamentosChecklistMensaisChecklists", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FechamentosChecklistMensaisChecklists_Checklists_ChecklistId",
                        column: x => x.ChecklistId,
                        principalTable: "Checklists",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_FechamentosChecklistMensaisChecklists_FechamentosChecklistMe~",
                        column: x => x.FechamentoChecklistMensalId,
                        principalTable: "FechamentosChecklistMensais",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_Checklists_SetorId_EquipamentoId_DataReferencia",
                table: "Checklists",
                columns: new[] { "SetorId", "EquipamentoId", "DataReferencia" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_FechamentosChecklistMensais_EquipamentoId",
                table: "FechamentosChecklistMensais",
                column: "EquipamentoId");

            migrationBuilder.CreateIndex(
                name: "IX_FechamentosChecklistMensais_FechadoPorSupervisorId",
                table: "FechamentosChecklistMensais",
                column: "FechadoPorSupervisorId");

            migrationBuilder.CreateIndex(
                name: "IX_FechamentosChecklistMensais_SetorId_EquipamentoId_Ano_Mes",
                table: "FechamentosChecklistMensais",
                columns: new[] { "SetorId", "EquipamentoId", "Ano", "Mes" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_FechamentosChecklistMensaisChecklists_ChecklistId",
                table: "FechamentosChecklistMensaisChecklists",
                column: "ChecklistId");

            migrationBuilder.CreateIndex(
                name: "IX_FechamentosChecklistMensaisChecklists_FechamentoChecklistMen~",
                table: "FechamentosChecklistMensaisChecklists",
                columns: new[] { "FechamentoChecklistMensalId", "ChecklistId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FechamentosChecklistMensaisChecklists");

            migrationBuilder.DropTable(
                name: "FechamentosChecklistMensais");

            migrationBuilder.DropIndex(
                name: "IX_Checklists_SetorId_EquipamentoId_DataReferencia",
                table: "Checklists");

            migrationBuilder.DropColumn(
                name: "DataReferencia",
                table: "Checklists");
        }
    }
}

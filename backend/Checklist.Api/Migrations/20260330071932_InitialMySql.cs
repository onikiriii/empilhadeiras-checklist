using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Checklist.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialMySql : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Setores",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false),
                    Nome = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false),
                    Descricao = table.Column<string>(type: "varchar(300)", maxLength: 300, nullable: true),
                    Ativo = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Setores", x => x.Id);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "CategoriasEquipamento",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false),
                    SetorId = table.Column<Guid>(type: "char(36)", nullable: false),
                    Nome = table.Column<string>(type: "varchar(80)", maxLength: 80, nullable: false),
                    Ativa = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CategoriasEquipamento", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CategoriasEquipamento_Setores_SetorId",
                        column: x => x.SetorId,
                        principalTable: "Setores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Operadores",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false),
                    SetorId = table.Column<Guid>(type: "char(36)", nullable: false),
                    Matricula = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false),
                    Nome = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false),
                    Ativo = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Operadores", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Operadores_Setores_SetorId",
                        column: x => x.SetorId,
                        principalTable: "Setores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "UsuariosSupervisores",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false),
                    Nome = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false),
                    Sobrenome = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false),
                    Login = table.Column<string>(type: "varchar(120)", maxLength: 120, nullable: false),
                    Email = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: true),
                    Ramal = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true),
                    SenhaHash = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: false),
                    ForceChangePassword = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    IsMaster = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    SetorId = table.Column<Guid>(type: "char(36)", nullable: false),
                    Ativo = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UsuariosSupervisores", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UsuariosSupervisores_Setores_SetorId",
                        column: x => x.SetorId,
                        principalTable: "Setores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "ChecklistItensTemplate",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false),
                    SetorId = table.Column<Guid>(type: "char(36)", nullable: false),
                    CategoriaId = table.Column<Guid>(type: "char(36)", nullable: false),
                    Ordem = table.Column<int>(type: "int", nullable: false),
                    Descricao = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false),
                    Instrucao = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true),
                    Ativo = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChecklistItensTemplate", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChecklistItensTemplate_CategoriasEquipamento_CategoriaId",
                        column: x => x.CategoriaId,
                        principalTable: "CategoriasEquipamento",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ChecklistItensTemplate_Setores_SetorId",
                        column: x => x.SetorId,
                        principalTable: "Setores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Equipamentos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false),
                    Codigo = table.Column<string>(type: "longtext", nullable: false),
                    Descricao = table.Column<string>(type: "longtext", nullable: false),
                    Ativa = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    SetorId = table.Column<Guid>(type: "char(36)", nullable: false),
                    CategoriaId = table.Column<Guid>(type: "char(36)", nullable: false),
                    QrId = table.Column<Guid>(type: "char(36)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Equipamentos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Equipamentos_CategoriasEquipamento_CategoriaId",
                        column: x => x.CategoriaId,
                        principalTable: "CategoriasEquipamento",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Equipamentos_Setores_SetorId",
                        column: x => x.SetorId,
                        principalTable: "Setores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Checklists",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(32)", maxLength: 32, nullable: false),
                    SetorId = table.Column<Guid>(type: "char(36)", nullable: false),
                    EquipamentoId = table.Column<Guid>(type: "char(36)", nullable: false),
                    OperadorId = table.Column<Guid>(type: "char(36)", nullable: false),
                    DataRealizacao = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    Aprovado = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    ObservacoesGerais = table.Column<string>(type: "varchar(1000)", maxLength: 1000, nullable: true),
                    AssinaturaOperadorBase64 = table.Column<string>(type: "longtext", nullable: true),
                    AssinadoEm = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    Status = table.Column<int>(type: "int", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Checklists", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Checklists_Equipamentos_EquipamentoId",
                        column: x => x.EquipamentoId,
                        principalTable: "Equipamentos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Checklists_Operadores_OperadorId",
                        column: x => x.OperadorId,
                        principalTable: "Operadores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Checklists_Setores_SetorId",
                        column: x => x.SetorId,
                        principalTable: "Setores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "ChecklistsEnviados",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false),
                    EquipamentoId = table.Column<Guid>(type: "char(36)", nullable: false),
                    OperadorNome = table.Column<string>(type: "longtext", nullable: false),
                    OperadorMatricula = table.Column<string>(type: "longtext", nullable: false),
                    Aprovado = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    Observacoes = table.Column<string>(type: "longtext", nullable: true),
                    CriadoEm = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChecklistsEnviados", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChecklistsEnviados_Equipamentos_EquipamentoId",
                        column: x => x.EquipamentoId,
                        principalTable: "Equipamentos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "ChecklistItens",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false),
                    ChecklistId = table.Column<Guid>(type: "char(32)", nullable: false),
                    TemplateId = table.Column<Guid>(type: "char(36)", nullable: false),
                    Ordem = table.Column<int>(type: "int", nullable: false),
                    Descricao = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false),
                    Instrucao = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true),
                    Status = table.Column<int>(type: "int", nullable: false),
                    Observacao = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true),
                    CriadoEm = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChecklistItens", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChecklistItens_ChecklistItensTemplate_TemplateId",
                        column: x => x.TemplateId,
                        principalTable: "ChecklistItensTemplate",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ChecklistItens_Checklists_ChecklistId",
                        column: x => x.ChecklistId,
                        principalTable: "Checklists",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_CategoriasEquipamento_Nome",
                table: "CategoriasEquipamento",
                column: "Nome",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CategoriasEquipamento_SetorId",
                table: "CategoriasEquipamento",
                column: "SetorId");

            migrationBuilder.CreateIndex(
                name: "IX_ChecklistItens_ChecklistId",
                table: "ChecklistItens",
                column: "ChecklistId");

            migrationBuilder.CreateIndex(
                name: "IX_ChecklistItens_TemplateId",
                table: "ChecklistItens",
                column: "TemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_ChecklistItensTemplate_CategoriaId_Ordem",
                table: "ChecklistItensTemplate",
                columns: new[] { "CategoriaId", "Ordem" });

            migrationBuilder.CreateIndex(
                name: "IX_ChecklistItensTemplate_SetorId",
                table: "ChecklistItensTemplate",
                column: "SetorId");

            migrationBuilder.CreateIndex(
                name: "IX_Checklists_EquipamentoId",
                table: "Checklists",
                column: "EquipamentoId");

            migrationBuilder.CreateIndex(
                name: "IX_Checklists_OperadorId",
                table: "Checklists",
                column: "OperadorId");

            migrationBuilder.CreateIndex(
                name: "IX_Checklists_SetorId",
                table: "Checklists",
                column: "SetorId");

            migrationBuilder.CreateIndex(
                name: "IX_ChecklistsEnviados_EquipamentoId",
                table: "ChecklistsEnviados",
                column: "EquipamentoId");

            migrationBuilder.CreateIndex(
                name: "IX_Equipamentos_CategoriaId",
                table: "Equipamentos",
                column: "CategoriaId");

            migrationBuilder.CreateIndex(
                name: "IX_Equipamentos_QrId",
                table: "Equipamentos",
                column: "QrId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Equipamentos_SetorId",
                table: "Equipamentos",
                column: "SetorId");

            migrationBuilder.CreateIndex(
                name: "IX_Operadores_Matricula",
                table: "Operadores",
                column: "Matricula",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Operadores_SetorId",
                table: "Operadores",
                column: "SetorId");

            migrationBuilder.CreateIndex(
                name: "IX_Setores_Nome",
                table: "Setores",
                column: "Nome",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UsuariosSupervisores_Email",
                table: "UsuariosSupervisores",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UsuariosSupervisores_Login",
                table: "UsuariosSupervisores",
                column: "Login",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UsuariosSupervisores_SetorId",
                table: "UsuariosSupervisores",
                column: "SetorId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ChecklistItens");

            migrationBuilder.DropTable(
                name: "ChecklistsEnviados");

            migrationBuilder.DropTable(
                name: "UsuariosSupervisores");

            migrationBuilder.DropTable(
                name: "ChecklistItensTemplate");

            migrationBuilder.DropTable(
                name: "Checklists");

            migrationBuilder.DropTable(
                name: "Equipamentos");

            migrationBuilder.DropTable(
                name: "Operadores");

            migrationBuilder.DropTable(
                name: "CategoriasEquipamento");

            migrationBuilder.DropTable(
                name: "Setores");
        }
    }
}

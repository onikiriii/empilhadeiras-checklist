using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Checklist.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddStpDocumentControl : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "StpDocumentosEmpresas",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false),
                    SetorId = table.Column<Guid>(type: "char(36)", nullable: false),
                    Nome = table.Column<string>(type: "varchar(180)", maxLength: 180, nullable: false),
                    Ativa = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StpDocumentosEmpresas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StpDocumentosEmpresas_Setores_SetorId",
                        column: x => x.SetorId,
                        principalTable: "Setores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "StpDocumentosEmpresasArquivos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false),
                    EmpresaId = table.Column<Guid>(type: "char(36)", nullable: false),
                    Nome = table.Column<string>(type: "varchar(180)", maxLength: 180, nullable: false),
                    NomeArquivoOriginal = table.Column<string>(type: "varchar(260)", maxLength: 260, nullable: false),
                    MimeType = table.Column<string>(type: "varchar(120)", maxLength: 120, nullable: false),
                    TamanhoBytes = table.Column<long>(type: "bigint", nullable: false),
                    Conteudo = table.Column<byte[]>(type: "longblob", nullable: false),
                    EnviadoPorSupervisorId = table.Column<Guid>(type: "char(36)", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StpDocumentosEmpresasArquivos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StpDocumentosEmpresasArquivos_StpDocumentosEmpresas_EmpresaId",
                        column: x => x.EmpresaId,
                        principalTable: "StpDocumentosEmpresas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_StpDocumentosEmpresasArquivos_UsuariosSupervisores_EnviadoPo~",
                        column: x => x.EnviadoPorSupervisorId,
                        principalTable: "UsuariosSupervisores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "StpDocumentosFuncionarios",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false),
                    EmpresaId = table.Column<Guid>(type: "char(36)", nullable: false),
                    Nome = table.Column<string>(type: "varchar(180)", maxLength: 180, nullable: false),
                    Cargo = table.Column<string>(type: "varchar(160)", maxLength: 160, nullable: true),
                    Ativo = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StpDocumentosFuncionarios", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StpDocumentosFuncionarios_StpDocumentosEmpresas_EmpresaId",
                        column: x => x.EmpresaId,
                        principalTable: "StpDocumentosEmpresas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "StpDocumentosFuncionariosArquivos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false),
                    FuncionarioId = table.Column<Guid>(type: "char(36)", nullable: false),
                    Nome = table.Column<string>(type: "varchar(180)", maxLength: 180, nullable: false),
                    NomeArquivoOriginal = table.Column<string>(type: "varchar(260)", maxLength: 260, nullable: false),
                    MimeType = table.Column<string>(type: "varchar(120)", maxLength: 120, nullable: false),
                    TamanhoBytes = table.Column<long>(type: "bigint", nullable: false),
                    Conteudo = table.Column<byte[]>(type: "longblob", nullable: false),
                    EnviadoPorSupervisorId = table.Column<Guid>(type: "char(36)", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StpDocumentosFuncionariosArquivos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StpDocumentosFuncionariosArquivos_StpDocumentosFuncionarios_~",
                        column: x => x.FuncionarioId,
                        principalTable: "StpDocumentosFuncionarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_StpDocumentosFuncionariosArquivos_UsuariosSupervisores_Envia~",
                        column: x => x.EnviadoPorSupervisorId,
                        principalTable: "UsuariosSupervisores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_StpDocumentosEmpresas_SetorId_Nome",
                table: "StpDocumentosEmpresas",
                columns: new[] { "SetorId", "Nome" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_StpDocumentosEmpresasArquivos_EmpresaId",
                table: "StpDocumentosEmpresasArquivos",
                column: "EmpresaId");

            migrationBuilder.CreateIndex(
                name: "IX_StpDocumentosEmpresasArquivos_EnviadoPorSupervisorId",
                table: "StpDocumentosEmpresasArquivos",
                column: "EnviadoPorSupervisorId");

            migrationBuilder.CreateIndex(
                name: "IX_StpDocumentosFuncionarios_EmpresaId_Nome",
                table: "StpDocumentosFuncionarios",
                columns: new[] { "EmpresaId", "Nome" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_StpDocumentosFuncionariosArquivos_EnviadoPorSupervisorId",
                table: "StpDocumentosFuncionariosArquivos",
                column: "EnviadoPorSupervisorId");

            migrationBuilder.CreateIndex(
                name: "IX_StpDocumentosFuncionariosArquivos_FuncionarioId",
                table: "StpDocumentosFuncionariosArquivos",
                column: "FuncionarioId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "StpDocumentosEmpresasArquivos");

            migrationBuilder.DropTable(
                name: "StpDocumentosFuncionariosArquivos");

            migrationBuilder.DropTable(
                name: "StpDocumentosFuncionarios");

            migrationBuilder.DropTable(
                name: "StpDocumentosEmpresas");
        }
    }
}

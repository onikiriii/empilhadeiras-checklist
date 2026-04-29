using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Checklist.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddStpInspectionAreasCatalog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "AreaInspecaoId",
                table: "StpAreaChecklists",
                type: "char(36)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "StpAreasInspecao",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false),
                    SetorId = table.Column<Guid>(type: "char(36)", nullable: false),
                    Nome = table.Column<string>(type: "varchar(160)", maxLength: 160, nullable: false),
                    ResponsavelSupervisorId = table.Column<Guid>(type: "char(36)", nullable: false),
                    Ativa = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StpAreasInspecao", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StpAreasInspecao_Setores_SetorId",
                        column: x => x.SetorId,
                        principalTable: "Setores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_StpAreasInspecao_UsuariosSupervisores_ResponsavelSupervisorId",
                        column: x => x.ResponsavelSupervisorId,
                        principalTable: "UsuariosSupervisores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_StpAreaChecklists_AreaInspecaoId",
                table: "StpAreaChecklists",
                column: "AreaInspecaoId");

            migrationBuilder.CreateIndex(
                name: "IX_StpAreasInspecao_ResponsavelSupervisorId",
                table: "StpAreasInspecao",
                column: "ResponsavelSupervisorId");

            migrationBuilder.CreateIndex(
                name: "IX_StpAreasInspecao_SetorId_Nome",
                table: "StpAreasInspecao",
                columns: new[] { "SetorId", "Nome" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_StpAreaChecklists_StpAreasInspecao_AreaInspecaoId",
                table: "StpAreaChecklists",
                column: "AreaInspecaoId",
                principalTable: "StpAreasInspecao",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_StpAreaChecklists_StpAreasInspecao_AreaInspecaoId",
                table: "StpAreaChecklists");

            migrationBuilder.DropTable(
                name: "StpAreasInspecao");

            migrationBuilder.DropIndex(
                name: "IX_StpAreaChecklists_AreaInspecaoId",
                table: "StpAreaChecklists");

            migrationBuilder.DropColumn(
                name: "AreaInspecaoId",
                table: "StpAreaChecklists");
        }
    }
}

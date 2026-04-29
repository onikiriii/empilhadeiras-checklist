using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Checklist.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddStpInspectedSector : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "SetorInspecionadoId",
                table: "StpAreaChecklists",
                type: "char(36)",
                nullable: true);

            migrationBuilder.Sql("""
                UPDATE `StpAreaChecklists`
                SET `SetorInspecionadoId` = `SetorId`
                WHERE `SetorInspecionadoId` IS NULL;
                """);

            migrationBuilder.AlterColumn<Guid>(
                name: "SetorInspecionadoId",
                table: "StpAreaChecklists",
                type: "char(36)",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "char(36)",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_StpAreaChecklists_SetorInspecionadoId",
                table: "StpAreaChecklists",
                column: "SetorInspecionadoId");

            migrationBuilder.AddForeignKey(
                name: "FK_StpAreaChecklists_Setores_SetorInspecionadoId",
                table: "StpAreaChecklists",
                column: "SetorInspecionadoId",
                principalTable: "Setores",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_StpAreaChecklists_Setores_SetorInspecionadoId",
                table: "StpAreaChecklists");

            migrationBuilder.DropIndex(
                name: "IX_StpAreaChecklists_SetorInspecionadoId",
                table: "StpAreaChecklists");

            migrationBuilder.DropColumn(
                name: "SetorInspecionadoId",
                table: "StpAreaChecklists");
        }
    }
}

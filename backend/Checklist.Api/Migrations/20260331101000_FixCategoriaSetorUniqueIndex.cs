using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Checklist.Api.Migrations;

public partial class FixCategoriaSetorUniqueIndex : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            DROP INDEX IF EXISTS `IX_CategoriasEquipamento_Nome`
            ON `CategoriasEquipamento`;
            """);

        migrationBuilder.Sql("""
            CREATE UNIQUE INDEX `IX_CategoriasEquipamento_SetorId_Nome`
            ON `CategoriasEquipamento` (`SetorId`, `Nome`);
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            DROP INDEX IF EXISTS `IX_CategoriasEquipamento_SetorId_Nome`
            ON `CategoriasEquipamento`;
            """);

        migrationBuilder.Sql("""
            CREATE UNIQUE INDEX `IX_CategoriasEquipamento_Nome`
            ON `CategoriasEquipamento` (`Nome`);
            """);
    }
}

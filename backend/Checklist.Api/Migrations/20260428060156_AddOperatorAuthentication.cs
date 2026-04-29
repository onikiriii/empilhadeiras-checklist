using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Checklist.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddOperatorAuthentication : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Nome",
                table: "Operadores",
                type: "varchar(120)",
                maxLength: 120,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(100)",
                oldMaxLength: 100);

            migrationBuilder.AlterColumn<string>(
                name: "Matricula",
                table: "Operadores",
                type: "varchar(40)",
                maxLength: 40,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(20)",
                oldMaxLength: 20);

            migrationBuilder.AddColumn<string>(
                name: "Login",
                table: "Operadores",
                type: "varchar(60)",
                maxLength: 60,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SenhaHash",
                table: "Operadores",
                type: "varchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "ForceChangePassword",
                table: "Operadores",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UltimoLoginEm",
                table: "Operadores",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.Sql(
                """
                UPDATE Operadores
                SET
                    Login = CONCAT(
                        LOWER(
                            REPLACE(
                                REPLACE(
                                    REPLACE(
                                        REPLACE(
                                            REPLACE(TRIM(Matricula), ' ', ''),
                                        '-', ''),
                                    '.', ''),
                                '/', ''),
                            '_', '')
                        ),
                        '-',
                        LEFT(REPLACE(CAST(Id AS CHAR(36)), '-', ''), 8)
                    ),
                    SenhaHash = 'v1.100000.waY5dMmOCIy29dVHJetJTQ==.AHVATFA4cR9RUvPBy+WSWPpcsjM1I6uV7o8/m6PvaK8=',
                    ForceChangePassword = TRUE
                WHERE Login IS NULL OR SenhaHash IS NULL;
                """);

            migrationBuilder.AlterColumn<string>(
                name: "SenhaHash",
                table: "Operadores",
                type: "varchar(500)",
                maxLength: 500,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(500)",
                oldMaxLength: 500,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Login",
                table: "Operadores",
                type: "varchar(60)",
                maxLength: 60,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(60)",
                oldMaxLength: 60,
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Operadores_Login",
                table: "Operadores",
                column: "Login",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Operadores_Login",
                table: "Operadores");

            migrationBuilder.DropColumn(
                name: "ForceChangePassword",
                table: "Operadores");

            migrationBuilder.DropColumn(
                name: "Login",
                table: "Operadores");

            migrationBuilder.DropColumn(
                name: "SenhaHash",
                table: "Operadores");

            migrationBuilder.DropColumn(
                name: "UltimoLoginEm",
                table: "Operadores");

            migrationBuilder.AlterColumn<string>(
                name: "Nome",
                table: "Operadores",
                type: "varchar(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(120)",
                oldMaxLength: 120);

            migrationBuilder.AlterColumn<string>(
                name: "Matricula",
                table: "Operadores",
                type: "varchar(20)",
                maxLength: 20,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(40)",
                oldMaxLength: 40);
        }
    }
}

using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MicroservicioB.Migrations
{
    /// <inheritdoc />
    public partial class AddAsumidaMetadataToAlertas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                IF COL_LENGTH('Alertas', 'AsumidaEn') IS NULL
                    ALTER TABLE [Alertas] ADD [AsumidaEn] datetime2 NULL;
                IF COL_LENGTH('Alertas', 'AsumidaPor') IS NULL
                    ALTER TABLE [Alertas] ADD [AsumidaPor] nvarchar(max) NULL;
                IF COL_LENGTH('Alertas', 'NombreGuardiaAsumio') IS NULL
                    ALTER TABLE [Alertas] ADD [NombreGuardiaAsumio] nvarchar(max) NULL;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AsumidaEn",
                table: "Alertas");

            migrationBuilder.DropColumn(
                name: "AsumidaPor",
                table: "Alertas");

            migrationBuilder.DropColumn(
                name: "NombreGuardiaAsumio",
                table: "Alertas");
        }
    }
}

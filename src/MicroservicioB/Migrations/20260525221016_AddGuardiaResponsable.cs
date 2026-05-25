using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MicroservicioB.Migrations
{
    /// <inheritdoc />
    public partial class AddGuardiaResponsable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "GuardiaResponsableId",
                table: "Alertas",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NombreGuardiaResponsable",
                table: "Alertas",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "GuardiaResponsableId",
                table: "Alertas");

            migrationBuilder.DropColumn(
                name: "NombreGuardiaResponsable",
                table: "Alertas");
        }
    }
}

using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MicroservicioB.Migrations
{
    /// <inheritdoc />
    public partial class AddPrioridadToAlertas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Prioridad",
                table: "Alertas",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Prioridad",
                table: "Alertas");
        }
    }
}

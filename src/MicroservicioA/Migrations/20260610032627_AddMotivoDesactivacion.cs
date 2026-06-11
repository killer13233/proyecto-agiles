using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MicroservicioA.Migrations
{
    /// <inheritdoc />
    public partial class AddMotivoDesactivacion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "MotivoDesactivacion",
                table: "Usuarios",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "GruposConfianza",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: true),
                    PropietarioId = table.Column<int>(type: "int", nullable: false),
                    CreadoEn = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GruposConfianza", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GruposConfianza_Usuarios_PropietarioId",
                        column: x => x.PropietarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "MiembrosGrupoConfianza",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    GrupoConfianzaId = table.Column<int>(type: "int", nullable: false),
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    Estado = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AgregadoEn = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MiembrosGrupoConfianza", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MiembrosGrupoConfianza_GruposConfianza_GrupoConfianzaId",
                        column: x => x.GrupoConfianzaId,
                        principalTable: "GruposConfianza",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MiembrosGrupoConfianza_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_GruposConfianza_PropietarioId",
                table: "GruposConfianza",
                column: "PropietarioId");

            migrationBuilder.CreateIndex(
                name: "IX_MiembrosGrupoConfianza_GrupoConfianzaId_UsuarioId",
                table: "MiembrosGrupoConfianza",
                columns: new[] { "GrupoConfianzaId", "UsuarioId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MiembrosGrupoConfianza_UsuarioId",
                table: "MiembrosGrupoConfianza",
                column: "UsuarioId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MiembrosGrupoConfianza");

            migrationBuilder.DropTable(
                name: "GruposConfianza");

            migrationBuilder.DropColumn(
                name: "MotivoDesactivacion",
                table: "Usuarios");
        }
    }
}

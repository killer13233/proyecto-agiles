using MicroservicioA.Models;

namespace MicroservicioA.Data;

/// <summary>
/// Carga datos de prueba si la BD está vacía.
/// Credenciales documentadas para todo el equipo.
/// </summary>
public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        if (db.Usuarios.Any()) return;

        var usuarios = new List<Usuario>
        {
            // ── Administrador ──────────────────────────────────────────
            new() {
                Nombre = "Martin Palacios",
                Correo = "m.palacios@uta.edu.ec",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin2026!"),
                Rol = Rol.Administrador,
                Estado = EstadoUsuario.Activo
            },

            // ── Guardias (asignados a zonas) ───────────────────────────
            new() {
                Nombre = "Juan P. Paredes",
                Correo = "j.paredes@uta.edu.ec",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Guardia2026!"),
                Rol = Rol.Guardia,
                Estado = EstadoUsuario.Activo,
                ZonaAsignada = "Zona B"
            },
            new() {
                Nombre = "David Pérez",
                Correo = "d.perez@uta.edu.ec",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Guardia2026!"),
                Rol = Rol.Guardia,
                Estado = EstadoUsuario.Activo,
                ZonaAsignada = "Zona D"
            },
            new() {
                Nombre = "Guardia Prueba",
                Correo = "guardia3@uta.edu.ec",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Guardia2026!"),
                Rol = Rol.Guardia,
                Estado = EstadoUsuario.Activo,
                ZonaAsignada = "Zona A"
            },

            // ── Estudiantes ────────────────────────────────────────────
            new() {
                Nombre = "Abel Chiriboga",
                Correo = "a.chiriboga@uta.edu.ec",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Est2026!"),
                Rol = Rol.Estudiante,
                Estado = EstadoUsuario.Activo,
                ZonaAsignada = "Zona A"
            },
            new() {
                Nombre = "Sheyla Pacha",
                Correo = "s.pacha@uta.edu.ec",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Est2026!"),
                Rol = Rol.Estudiante,
                Estado = EstadoUsuario.Activo,
                ZonaAsignada = "Zona C"
            },
            new() {
                Nombre = "Carlos Sánchez",
                Correo = "c.sanchez@uta.edu.ec",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Est2026!"),
                Rol = Rol.Estudiante,
                Estado = EstadoUsuario.Activo,
                ZonaAsignada = "Zona B"
            },

            // ── Docentes ───────────────────────────────────────────────
            new() {
                Nombre = "Ana Torres",
                Correo = "a.torres@uta.edu.ec",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Doc2026!"),
                Rol = Rol.Docente,
                Estado = EstadoUsuario.Activo,
                ZonaAsignada = "Zona A"
            },
            new() {
                Nombre = "Rosa Molina",
                Correo = "r.molina@uta.edu.ec",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Doc2026!"),
                Rol = Rol.Docente,
                Estado = EstadoUsuario.Activo,
                ZonaAsignada = "Zona C"
            },
        };

        db.Usuarios.AddRange(usuarios);
        await db.SaveChangesAsync();

        Console.WriteLine("[Seeder] ✓ Datos de prueba cargados correctamente.");
    }
}

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

            // ── Estudiantes adicionales ────────────────────────────────
            new() {
                Nombre = "Miguel López",
                Correo = "m.lopez@uta.edu.ec",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Est2026!"),
                Rol = Rol.Estudiante,
                Estado = EstadoUsuario.Activo,
                ZonaAsignada = "Zona A"
            },
            new() {
                Nombre = "Camila Ruiz",
                Correo = "c.ruiz@uta.edu.ec",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Est2026!"),
                Rol = Rol.Estudiante,
                Estado = EstadoUsuario.Activo,
                ZonaAsignada = "Zona A"
            },
            new() {
                Nombre = "Ing. Luis Mora",
                Correo = "l.mora@uta.edu.ec",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Doc2026!"),
                Rol = Rol.Docente,
                Estado = EstadoUsuario.Activo,
                ZonaAsignada = "Zona B"
            },
        };

        db.Usuarios.AddRange(usuarios);
        await db.SaveChangesAsync();

        Console.WriteLine("[Seeder] ✓ Usuarios de prueba cargados.");

        // ── Grupos de Confianza ─────────────────────────────────────────
        await SeedGruposConfianzaAsync(db);
    }

    private static async Task SeedGruposConfianzaAsync(AppDbContext db)
    {
        if (db.GruposConfianza.Any()) return;

        // Buscar usuarios por correo para obtener sus IDs
        var abel = db.Usuarios.First(u => u.Correo == "a.chiriboga@uta.edu.ec");
        var sheyla = db.Usuarios.First(u => u.Correo == "s.pacha@uta.edu.ec");
        var carlos = db.Usuarios.First(u => u.Correo == "c.sanchez@uta.edu.ec");
        var miguel = db.Usuarios.First(u => u.Correo == "m.lopez@uta.edu.ec");
        var camila = db.Usuarios.First(u => u.Correo == "c.ruiz@uta.edu.ec");
        var ana = db.Usuarios.First(u => u.Correo == "a.torres@uta.edu.ec");
        var rosa = db.Usuarios.First(u => u.Correo == "r.molina@uta.edu.ec");
        var mora = db.Usuarios.First(u => u.Correo == "l.mora@uta.edu.ec");
        var paredes = db.Usuarios.First(u => u.Correo == "j.paredes@uta.edu.ec");
        var david = db.Usuarios.First(u => u.Correo == "d.perez@uta.edu.ec");

        // ── Grupo 1: Abel crea "Grupo FISI" con compañeros ──────────────
        var grupoFisi = new GrupoConfianza
        {
            Nombre = "Grupo FISI",
            Descripcion = "Zona A",
            PropietarioId = abel.Id,
            Miembros = new List<MiembroGrupoConfianza>
            {
                new() { UsuarioId = miguel.Id, Estado = EstadoMiembro.Aceptado },
                new() { UsuarioId = camila.Id, Estado = EstadoMiembro.Aceptado },
                new() { UsuarioId = ana.Id, Estado = EstadoMiembro.Aceptado },
                new() { UsuarioId = sheyla.Id, Estado = EstadoMiembro.Aceptado },
                new() { UsuarioId = carlos.Id, Estado = EstadoMiembro.Aceptado },
                new() { UsuarioId = mora.Id, Estado = EstadoMiembro.Aceptado },
                new() { UsuarioId = paredes.Id, Estado = EstadoMiembro.Aceptado },
            }
        };

        // ── Grupo 2: Ana crea "Docentes Sistemas" ──────────────────────
        var grupoDocentes = new GrupoConfianza
        {
            Nombre = "Docentes Sistemas",
            Descripcion = "Zona B-C",
            PropietarioId = ana.Id,
            Miembros = new List<MiembroGrupoConfianza>
            {
                new() { UsuarioId = rosa.Id, Estado = EstadoMiembro.Aceptado },
                new() { UsuarioId = mora.Id, Estado = EstadoMiembro.Aceptado },
                new() { UsuarioId = abel.Id, Estado = EstadoMiembro.Aceptado },
                new() { UsuarioId = sheyla.Id, Estado = EstadoMiembro.Aceptado },
                new() { UsuarioId = carlos.Id, Estado = EstadoMiembro.Aceptado },
                new() { UsuarioId = miguel.Id, Estado = EstadoMiembro.Aceptado },
                new() { UsuarioId = camila.Id, Estado = EstadoMiembro.Aceptado },
                new() { UsuarioId = paredes.Id, Estado = EstadoMiembro.Aceptado },
                new() { UsuarioId = david.Id, Estado = EstadoMiembro.Aceptado },
            }
        };

        // ── Grupo 3: Carlos crea "Personal Administrativo" ─────────────
        var grupoAdmin = new GrupoConfianza
        {
            Nombre = "Personal Administrativo",
            Descripcion = "Zona D",
            PropietarioId = carlos.Id,
            Miembros = new List<MiembroGrupoConfianza>
            {
                new() { UsuarioId = david.Id, Estado = EstadoMiembro.Aceptado },
                new() { UsuarioId = rosa.Id, Estado = EstadoMiembro.Aceptado },
                new() { UsuarioId = abel.Id, Estado = EstadoMiembro.Aceptado },
                new() { UsuarioId = sheyla.Id, Estado = EstadoMiembro.Aceptado },
            }
        };

        db.GruposConfianza.AddRange(grupoFisi, grupoDocentes, grupoAdmin);
        await db.SaveChangesAsync();

        Console.WriteLine("[Seeder] ✓ Grupos de confianza cargados (3 grupos con miembros).");
    }
}


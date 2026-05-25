namespace MicroservicioA.Models;

public enum Rol
{
    Estudiante,
    Docente,
    PersonalAdministrativo,
    Guardia,
    Administrador
}

public enum EstadoUsuario
{
    Activo,
    Inactivo,
    Bloqueado
}

public class Usuario
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Correo { get; set; } = string.Empty;

    // Contraseña hasheada con BCrypt
    public string PasswordHash { get; set; } = string.Empty;

    public Rol Rol { get; set; } = Rol.Estudiante;
    public EstadoUsuario Estado { get; set; } = EstadoUsuario.Activo;

    // Zona asignada (null = sin zona asignada aún)
    public string? ZonaAsignada { get; set; }

    
    public bool Disponible { get; set; } = false;

    // Control de intentos de login fallidos
    public int IntentosFallidos { get; set; } = 0;
    public DateTime? UltimoAcceso { get; set; }
    public DateTime CreadoEn { get; set; } = DateTime.UtcNow;
}

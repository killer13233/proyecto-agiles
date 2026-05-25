namespace MicroservicioA.Models;

// ── Login ──────────────────────────────────────────────────────────────────
public record LoginRequest(string Correo, string Password);

public record LoginResponse(
    string Token,
    string Nombre,
    string Correo,
    string Rol,
    string? ZonaAsignada,
    int ExpiresInHours
);

// ── Usuarios ───────────────────────────────────────────────────────────────
public record UsuarioDto(
    int Id,
    string Nombre,
    string Correo,
    string Rol,
    string Estado,
    string? ZonaAsignada,
    DateTime? UltimoAcceso
);

public record CambiarRolRequest(string NuevoRol);
public record CambiarEstadoRequest(string NuevoEstado);

// ── Paginación ─────────────────────────────────────────────────────────────
public record PaginadoResponse<T>(
    IEnumerable<T> Items,
    int Total,
    int Pagina,
    int TamañoPagina
);

// ── Error estándar ─────────────────────────────────────────────────────────
public record ErrorResponse(string Mensaje, string? Detalle = null);

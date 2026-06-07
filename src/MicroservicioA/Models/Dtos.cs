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

// ── Grupos de Confianza ────────────────────────────────────────────────────
public record MiembroDto(
    int Id,
    int UsuarioId,
    string Nombre,
    string Correo,
    string Rol,
    string Estado,
    DateTime AgregadoEn
);

public record GrupoConfianzaDto(
    int Id,
    string Nombre,
    string? Descripcion,
    int PropietarioId,
    string PropietarioNombre,
    int CantidadMiembros,
    List<MiembroDto> Miembros,
    DateTime CreadoEn
);

public record GrupoConfianzaResumenDto(
    int Id,
    string Nombre,
    string? Descripcion,
    int PropietarioId,
    string PropietarioNombre,
    int CantidadMiembros,
    List<MiembroDto> MiembrosPreview,
    DateTime CreadoEn
);

public record CrearGrupoConfianzaRequest(string Nombre, string? Descripcion);
public record ActualizarGrupoConfianzaRequest(string Nombre, string? Descripcion);
public record AgregarMiembroRequest(int UsuarioId);

public record BuscarUsuarioDto(
    int Id,
    string Nombre,
    string Correo,
    string Rol
);

using Microsoft.EntityFrameworkCore;
using MicroservicioA.Data;
using MicroservicioA.Models;
using System.Net.Http.Json;

namespace MicroservicioA.Services;

public interface IGrupoConfianzaService
{
    Task<List<GrupoConfianzaResumenDto>> ListarPorUsuarioAsync(int propietarioId);
    Task<List<GrupoConfianzaResumenDto>> ListarTodosAsync();
    Task<GrupoConfianzaDto?> ObtenerPorIdAsync(int grupoId);
    Task<(GrupoConfianzaDto? grupo, string? error)> CrearAsync(int propietarioId, CrearGrupoConfianzaRequest request);
    Task<(bool ok, string? error)> ActualizarAsync(int grupoId, int userId, string rol, ActualizarGrupoConfianzaRequest request);
    Task<(bool ok, string? error)> EliminarAsync(int grupoId, int userId, string rol);
    Task<(bool ok, string? error)> AgregarMiembroAsync(int grupoId, int userId, string rol, int miembroId);
    Task<(bool ok, string? error)> QuitarMiembroAsync(int grupoId, int userId, string rol, int miembroId);
    Task<List<BuscarUsuarioDto>> BuscarUsuariosAsync(string query, int grupoId);
    Task<(bool ok, string? error)> ResponderInvitacionAsync(int grupoId, int userId, bool aceptar);
    Task<List<GrupoConfianzaDto>> ListarInvitacionesPendientesAsync(int userId);
    Task<List<int>> ObtenerContactosConfianzaAsync(int userId);
}

    public class GrupoConfianzaService : IGrupoConfianzaService
{
    private readonly AppDbContext _db;
    private readonly IHttpClientFactory _httpFactory;
    private readonly string _microBUrl;
    private const int MaxGruposPorUsuario = 5;
    private const int MaxMiembrosPorGrupo = 20;
    private const int PreviewMiembros = 3;

    public GrupoConfianzaService(AppDbContext db, IHttpClientFactory httpFactory, IConfiguration config)
    {
        _db = db;
        _httpFactory = httpFactory;
        _microBUrl = config["MicroservicioB:BaseUrl"] ?? "http://microservicio-b:8082";
    }

    // ── Listar grupos del usuario autenticado ──────────────────────────────
    public async Task<List<GrupoConfianzaResumenDto>> ListarPorUsuarioAsync(int propietarioId)
    {
        var grupos = await _db.GruposConfianza
            .Where(g => g.PropietarioId == propietarioId)
            .Include(g => g.Propietario)
            .Include(g => g.Miembros)
                .ThenInclude(m => m.Usuario)
            .OrderByDescending(g => g.CreadoEn)
            .ToListAsync();

        return grupos.Select(MapToResumen).ToList();
    }

    // ── Listar todos (solo admin) ──────────────────────────────────────────
    public async Task<List<GrupoConfianzaResumenDto>> ListarTodosAsync()
    {
        var grupos = await _db.GruposConfianza
            .Include(g => g.Propietario)
            .Include(g => g.Miembros)
                .ThenInclude(m => m.Usuario)
            .OrderByDescending(g => g.CreadoEn)
            .ToListAsync();

        return grupos.Select(MapToResumen).ToList();
    }

    // ── Obtener detalle con todos los miembros ─────────────────────────────
    public async Task<GrupoConfianzaDto?> ObtenerPorIdAsync(int grupoId)
    {
        var grupo = await _db.GruposConfianza
            .Include(g => g.Propietario)
            .Include(g => g.Miembros)
                .ThenInclude(m => m.Usuario)
            .FirstOrDefaultAsync(g => g.Id == grupoId);

        if (grupo is null) return null;

        return new GrupoConfianzaDto(
            grupo.Id,
            grupo.Nombre,
            grupo.Descripcion,
            grupo.PropietarioId,
            grupo.Propietario.Nombre,
            grupo.Miembros.Count,
            grupo.Miembros.Select(m => new MiembroDto(
                m.Id, m.UsuarioId, m.Usuario.Nombre,
                m.Usuario.Correo, m.Usuario.Rol.ToString(),
                m.Estado.ToString(),
                m.AgregadoEn
            )).ToList(),
            grupo.CreadoEn
        );
    }

    // ── Crear grupo ────────────────────────────────────────────────────────
    public async Task<(GrupoConfianzaDto? grupo, string? error)> CrearAsync(
        int propietarioId, CrearGrupoConfianzaRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Nombre))
            return (null, "El nombre del grupo es requerido.");

        if (request.Nombre.Length > 100)
            return (null, "El nombre no puede exceder 100 caracteres.");

        // Validar límite de grupos por usuario
        var totalGrupos = await _db.GruposConfianza
            .CountAsync(g => g.PropietarioId == propietarioId);

        if (totalGrupos >= MaxGruposPorUsuario)
            return (null, $"Has alcanzado el límite de {MaxGruposPorUsuario} grupos.");

        var grupo = new GrupoConfianza
        {
            Nombre = request.Nombre.Trim(),
            Descripcion = request.Descripcion?.Trim(),
            PropietarioId = propietarioId
        };

        _db.GruposConfianza.Add(grupo);
        await _db.SaveChangesAsync();

        // Retornar el DTO completo
        return (await ObtenerPorIdAsync(grupo.Id), null);
    }

    // ── Actualizar grupo ───────────────────────────────────────────────────
    public async Task<(bool ok, string? error)> ActualizarAsync(
        int grupoId, int userId, string rol, ActualizarGrupoConfianzaRequest request)
    {
        var grupo = await _db.GruposConfianza.FindAsync(grupoId);
        if (grupo is null) return (false, "Grupo no encontrado.");

        // Solo el propietario o un admin pueden editar
        if (grupo.PropietarioId != userId && !EsAdmin(rol))
            return (false, "No tienes permiso para editar este grupo.");

        if (string.IsNullOrWhiteSpace(request.Nombre))
            return (false, "El nombre del grupo es requerido.");

        if (request.Nombre.Length > 100)
            return (false, "El nombre no puede exceder 100 caracteres.");

        grupo.Nombre = request.Nombre.Trim();
        grupo.Descripcion = request.Descripcion?.Trim();
        await _db.SaveChangesAsync();
        return (true, null);
    }

    // ── Eliminar grupo ─────────────────────────────────────────────────────
    public async Task<(bool ok, string? error)> EliminarAsync(int grupoId, int userId, string rol)
    {
        var grupo = await _db.GruposConfianza
            .Include(g => g.Miembros)
            .FirstOrDefaultAsync(g => g.Id == grupoId);

        if (grupo is null) return (false, "Grupo no encontrado.");

        if (grupo.PropietarioId != userId && !EsAdmin(rol))
            return (false, "No tienes permiso para eliminar este grupo.");

        _db.GruposConfianza.Remove(grupo); // Cascade borra miembros
        await _db.SaveChangesAsync();
        return (true, null);
    }

    // ── Agregar miembro ────────────────────────────────────────────────────
    public async Task<(bool ok, string? error)> AgregarMiembroAsync(
        int grupoId, int userId, string rol, int miembroId)
    {
        var grupo = await _db.GruposConfianza
            .Include(g => g.Miembros)
            .FirstOrDefaultAsync(g => g.Id == grupoId);

        if (grupo is null) return (false, "Grupo no encontrado.");

        if (grupo.PropietarioId != userId && !EsAdmin(rol))
            return (false, "No tienes permiso para modificar este grupo.");

        // No puede agregarse a sí mismo
        if (miembroId == grupo.PropietarioId)
            return (false, "El propietario no puede ser miembro de su propio grupo.");

        // Validar que el usuario existe
        var usuario = await _db.Usuarios.FindAsync(miembroId);
        if (usuario is null) return (false, "Usuario no encontrado.");

        // Validar que no esté ya en el grupo
        if (grupo.Miembros.Any(m => m.UsuarioId == miembroId))
            return (false, "El usuario ya es miembro de este grupo (o tiene invitación pendiente).");

        // Validar límite
        if (grupo.Miembros.Count >= MaxMiembrosPorGrupo)
            return (false, $"El grupo ha alcanzado el límite de {MaxMiembrosPorGrupo} miembros.");

        var miembro = new MiembroGrupoConfianza
        {
            GrupoConfianzaId = grupoId,
            UsuarioId = miembroId,
            Estado = EstadoMiembro.Pendiente
        };
        grupo.Miembros.Add(miembro);

        await _db.SaveChangesAsync();

        // Notificar por WebSocket mediante Microservicio B
        _ = NotificarInvitacionAsync(miembroId, grupo.Nombre);

        return (true, null);
    }

    private async Task NotificarInvitacionAsync(int usuarioId, string grupoNombre)
    {
        try
        {
            var http = _httpFactory.CreateClient();
            var res = await http.PostAsJsonAsync($"{_microBUrl}/api/wsnotificaciones/invitacion", new
            {
                UsuarioId = usuarioId,
                GrupoNombre = grupoNombre
            });
            if (!res.IsSuccessStatusCode)
            {
                Console.WriteLine($"[GrupoConfianzaService] Error al notificar invitación a MS B. StatusCode: {res.StatusCode}");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[GrupoConfianzaService] Excepción al notificar invitación a MS B: {ex.Message}");
        }
    }

    // ── Quitar miembro ─────────────────────────────────────────────────────
    public async Task<(bool ok, string? error)> QuitarMiembroAsync(
        int grupoId, int userId, string rol, int miembroId)
    {
        var grupo = await _db.GruposConfianza
            .Include(g => g.Miembros)
            .FirstOrDefaultAsync(g => g.Id == grupoId);

        if (grupo is null) return (false, "Grupo no encontrado.");

        if (grupo.PropietarioId != userId && !EsAdmin(rol))
            return (false, "No tienes permiso para modificar este grupo.");

        var miembro = grupo.Miembros.FirstOrDefault(m => m.UsuarioId == miembroId);
        if (miembro is null) return (false, "El usuario no es miembro de este grupo.");

        _db.MiembrosGrupoConfianza.Remove(miembro);
        await _db.SaveChangesAsync();
        return (true, null);
    }

    // ── Buscar usuarios para agregar ───────────────────────────────────────
    public async Task<List<BuscarUsuarioDto>> BuscarUsuariosAsync(string query, int grupoId)
    {
        if (string.IsNullOrWhiteSpace(query) || query.Length < 2)
            return new List<BuscarUsuarioDto>();

        // Obtener IDs de miembros actuales del grupo
        var miembrosIds = await _db.MiembrosGrupoConfianza
            .Where(m => m.GrupoConfianzaId == grupoId)
            .Select(m => m.UsuarioId)
            .ToListAsync();

        // Obtener propietario del grupo
        var grupo = await _db.GruposConfianza.FindAsync(grupoId);
        if (grupo is not null) miembrosIds.Add(grupo.PropietarioId);

        var usuarios = await _db.Usuarios
            .Where(u => u.Estado == EstadoUsuario.Activo
                && !miembrosIds.Contains(u.Id)
                && (u.Nombre.Contains(query) || u.Correo.Contains(query)))
            .Take(10)
            .Select(u => new BuscarUsuarioDto(u.Id, u.Nombre, u.Correo, u.Rol.ToString()))
            .ToListAsync();

        return usuarios;
    }

    // ── Responder Invitación ────────────────────────────────────────────────
    public async Task<(bool ok, string? error)> ResponderInvitacionAsync(int grupoId, int userId, bool aceptar)
    {
        var miembro = await _db.MiembrosGrupoConfianza
            .FirstOrDefaultAsync(m => m.GrupoConfianzaId == grupoId && m.UsuarioId == userId);

        if (miembro is null)
            return (false, "No se encontró la invitación al grupo.");

        if (miembro.Estado == EstadoMiembro.Aceptado)
            return (false, "Ya eres miembro de este grupo.");

        if (aceptar)
        {
            miembro.Estado = EstadoMiembro.Aceptado;
        }
        else
        {
            _db.MiembrosGrupoConfianza.Remove(miembro);
        }

        await _db.SaveChangesAsync();
        return (true, null);
    }

    // ── Listar Invitaciones Pendientes ──────────────────────────────────────
    public async Task<List<GrupoConfianzaDto>> ListarInvitacionesPendientesAsync(int userId)
    {
        var membresias = await _db.MiembrosGrupoConfianza
            .Include(m => m.GrupoConfianza)
                .ThenInclude(g => g.Propietario)
            .Where(m => m.UsuarioId == userId && m.Estado == EstadoMiembro.Pendiente)
            .ToListAsync();

        return membresias.Select(m => new GrupoConfianzaDto(
            m.GrupoConfianza.Id,
            m.GrupoConfianza.Nombre,
            m.GrupoConfianza.Descripcion,
            m.GrupoConfianza.PropietarioId,
            m.GrupoConfianza.Propietario.Nombre,
            0,
            new List<MiembroDto>(), // No enviamos miembros para la vista de invitación
            m.GrupoConfianza.CreadoEn
        )).ToList();
    }

    // ── Obtener Contactos Confianza (Para Emergencias) ──────────────────────
    public async Task<List<int>> ObtenerContactosConfianzaAsync(int userId)
    {
        // Obtener a todos los miembros de todos los grupos de confianza del usuario (solo Aceptados)
        var contactosIds = await _db.GruposConfianza
            .Where(g => g.PropietarioId == userId)
            .SelectMany(g => g.Miembros)
            .Where(m => m.Estado == EstadoMiembro.Aceptado)
            .Select(m => m.UsuarioId)
            .Distinct()
            .ToListAsync();

        return contactosIds;
    }

    // ── Helpers ─────────────────────────────────────────────────────────────
    private static bool EsAdmin(string rol) =>
        rol.Equals("Administrador", StringComparison.OrdinalIgnoreCase);

    private static GrupoConfianzaResumenDto MapToResumen(GrupoConfianza g) => new(
        g.Id,
        g.Nombre,
        g.Descripcion,
        g.PropietarioId,
        g.Propietario.Nombre,
        g.Miembros.Count,
        g.Miembros
            .OrderByDescending(m => m.AgregadoEn)
            .Take(PreviewMiembros)
            .Select(m => new MiembroDto(
                m.Id, m.UsuarioId, m.Usuario.Nombre,
                m.Usuario.Correo, m.Usuario.Rol.ToString(),
                m.Estado.ToString(),
                m.AgregadoEn
            )).ToList(),
        g.CreadoEn
    );
}

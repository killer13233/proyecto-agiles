using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using MicroservicioB.Data;
using MicroservicioB.Models;

namespace MicroservicioB.Services;

public interface IAlertaService
{
    Task<Alerta> CrearAsync(string usuarioId, string nombreUsuario, string rolUsuario, CrearAlertaRequest req);
    Task<bool> AsumirAsync(int alertaId, AsumirAlertaRequest req);
    Task<(bool ok, string? error)> CerrarAsync(int alertaId, string guardiaId, CerrarAlertaRequest req);
    Task<IEnumerable<AlertaDto>> ListarAsync(string? zona, string? estado);
}

public class AlertaService : IAlertaService
{
    private readonly AlertaDbContext _db;
    private readonly IWebSocketManager _ws;
    private readonly IHttpClientFactory _httpFactory;   // ← corregido
    private readonly string _microCUrl;

    public AlertaService(
        AlertaDbContext db,
        IWebSocketManager ws,
        IConfiguration config,
        IHttpClientFactory httpFactory)                 // ← corregido
    {
        _db          = db;
        _ws          = ws;
        _httpFactory = httpFactory;                     // ← corregido
        _microCUrl   = config["MicroservicioC:BaseUrl"] ?? "http://microservicio-c:8083";
    }

    public async Task<Alerta> CrearAsync(
        string usuarioId, string nombreUsuario, string rolUsuario,
        CrearAlertaRequest req)
    {
        var zona = await ConsultarZonaAsync(req.Latitud, req.Longitud);

        var alerta = new Alerta
        {
            UsuarioId     = usuarioId,
            NombreUsuario = nombreUsuario,
            RolUsuario    = rolUsuario,
            Motivo        = req.Motivo,
            Latitud       = req.Latitud,
            Longitud      = req.Longitud,
            Zona          = zona,
            Estado        = EstadoAlerta.Activa
        };

        _db.Alertas.Add(alerta);
        await _db.SaveChangesAsync();

        await _ws.BroadcastGuardiasAsync(new
        {
            tipo          = "nueva_alerta",
            alertaId      = alerta.Id,
            nombreUsuario,
            rolUsuario,
            motivo        = req.Motivo,
            latitud       = req.Latitud,
            longitud      = req.Longitud,
            zona,
            creadaEn      = alerta.CreadaEn
        });

        return alerta;
    }

    public async Task<bool> AsumirAsync(int alertaId, AsumirAlertaRequest req)
    {
        var alerta = await _db.Alertas.FindAsync(alertaId);
        if (alerta is null || alerta.Estado == EstadoAlerta.Cerrada) return false;

        var guardias = JsonSerializer.Deserialize<List<string>>(alerta.GuardiasInvolucrados)
            ?? new List<string>();

        if (!guardias.Contains(req.GuardiaId))
        {
            guardias.Add(req.GuardiaId);
            alerta.GuardiasInvolucrados = JsonSerializer.Serialize(guardias);
            alerta.Estado = EstadoAlerta.Asumida;
            await _db.SaveChangesAsync();
        }

        await _ws.BroadcastGuardiasAsync(new
        {
            tipo          = "alerta_asumida",
            alertaId,
            guardiaId     = req.GuardiaId,
            nombreGuardia = req.NombreGuardia
        });

        return true;
    }

    public async Task<(bool ok, string? error)> CerrarAsync(
        int alertaId, string guardiaId, CerrarAlertaRequest req)
    {
        var alerta = await _db.Alertas.FindAsync(alertaId);
        if (alerta is null)                          return (false, "Alerta no encontrada.");
        if (alerta.Estado == EstadoAlerta.Cerrada)   return (false, "La alerta ya está cerrada.");

        alerta.Estado                = EstadoAlerta.Cerrada;
        alerta.MotivoResolucion      = req.MotivoResolucion;
        alerta.ResolucionDescripcion = req.ResolucionDescripcion;
        alerta.CerradaPor            = guardiaId;
        alerta.CerradaEn             = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        await _ws.BroadcastGuardiasAsync(new
        {
            tipo       = "alerta_cerrada",
            alertaId,
            cerradaPor = guardiaId,
            resolucion = req.ResolucionDescripcion
        });

        Console.WriteLine($"[Alertas] Caso #{alertaId} cerrado por guardia {guardiaId}.");
        return (true, null);
    }

    public async Task<IEnumerable<AlertaDto>> ListarAsync(string? zona, string? estado)
    {
        var query = _db.Alertas.AsQueryable();

        if (!string.IsNullOrWhiteSpace(zona))
            query = query.Where(a => a.Zona == zona);

        if (!string.IsNullOrWhiteSpace(estado) &&
            Enum.TryParse<EstadoAlerta>(estado, ignoreCase: true, out var est))
            query = query.Where(a => a.Estado == est);

        return await query
            .OrderByDescending(a => a.CreadaEn)
           .Select(a => new AlertaDto(
    a.Id,
    a.UsuarioId,
    a.NombreUsuario,
    a.RolUsuario,
    a.Motivo,
    a.Latitud,
    a.Longitud,
    a.Zona,
    a.Estado.ToString(),
    a.GuardiasInvolucrados,
    a.MotivoResolucion,
    a.ResolucionDescripcion,
    a.CerradaPor,
    a.CreadaEn,
    a.CerradaEn
))
            .ToListAsync();
    }

    // ── Privado ───────────────────────────────────────────────────────────────
    private async Task<string> ConsultarZonaAsync(double lat, double lon)
    {
        try
        {
            var http = _httpFactory.CreateClient();         // ← corregido
            http.Timeout = TimeSpan.FromSeconds(2);
            var res = await http.GetAsync(
                $"{_microCUrl}/api/zonas/punto?lat={lat}&lon={lon}");

            if (res.IsSuccessStatusCode)
            {
                var json = await res.Content.ReadAsStringAsync();
                var doc  = JsonDocument.Parse(json);
                return doc.RootElement.GetProperty("zona").GetString() ?? "Zona No Definida";
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[AlertaService] No se pudo consultar zona: {ex.Message}");
        }
        return "Zona No Definida";
    }
}
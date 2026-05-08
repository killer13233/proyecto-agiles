using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using MicroservicioC.Data;
using MicroservicioC.Models;

namespace MicroservicioC.Services;

public interface IGeoService
{
    Task<PuntoEnZonaResponse> ObtenerZonaDePuntoAsync(double lat, double lon);
    Task<IEnumerable<ZonaDto>> ListarZonasAsync();
    Task<Zona> CrearZonaAsync(CrearZonaRequest req);
    Task<(bool ok, string? error)> ActualizarZonaAsync(int id, ActualizarZonaRequest req);
    Task<bool> EliminarZonaAsync(int id);
}

public class GeoService : IGeoService
{
    private readonly ZonaDbContext _db;
    public GeoService(ZonaDbContext db) => _db = db;

    // ── Point-in-polygon (raycasting) ─────────────────────────────────────
    /// <summary>
    /// Determina si un punto (lat, lon) cae dentro de un polígono GeoJSON.
    /// El polígono se representa como [[lon,lat],[lon,lat],...].
    /// </summary>
    public static bool PuntoEnPoligono(double lat, double lon, double[][] vertices)
    {
        // Convertimos a coordenadas (x=lon, y=lat) para el algoritmo
        double x = lon, y = lat;
        int n = vertices.Length;
        bool dentro = false;

        for (int i = 0, j = n - 1; i < n; j = i++)
        {
            double xi = vertices[i][0], yi = vertices[i][1];
            double xj = vertices[j][0], yj = vertices[j][1];

            bool intersecta = ((yi > y) != (yj > y))
                && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);

            if (intersecta) dentro = !dentro;
        }

        return dentro;
    }

    public async Task<PuntoEnZonaResponse> ObtenerZonaDePuntoAsync(double lat, double lon)
    {
        var zonas = await _db.Zonas.ToListAsync();

        foreach (var zona in zonas)
        {
            try
            {
                var vertices = JsonSerializer.Deserialize<double[][]>(zona.Poligono);
                if (vertices is null || vertices.Length < 3) continue;

                if (PuntoEnPoligono(lat, lon, vertices))
                    return new PuntoEnZonaResponse(zona.Nombre, true);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Geo] Error procesando zona {zona.Nombre}: {ex.Message}");
            }
        }

        Console.WriteLine($"[Geo] WARN: punto ({lat},{lon}) fuera de todos los polígonos.");
        return new PuntoEnZonaResponse("Zona No Definida", false);
    }

    // ── CRUD Zonas ─────────────────────────────────────────────────────────
    public async Task<IEnumerable<ZonaDto>> ListarZonasAsync()
        => await _db.Zonas
            .Select(z => new ZonaDto(z.Id, z.Nombre, z.Color, z.Poligono))
            .ToListAsync();

    public async Task<Zona> CrearZonaAsync(CrearZonaRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Nombre))
            throw new ArgumentException("El nombre de la zona es obligatorio.");

        var zona = new Zona
        {
            Nombre   = req.Nombre,
            Color    = req.Color,
            Poligono = req.Poligono
        };
        _db.Zonas.Add(zona);
        await _db.SaveChangesAsync();
        return zona;
    }

    public async Task<(bool ok, string? error)> ActualizarZonaAsync(int id, ActualizarZonaRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Nombre))
            return (false, "El nombre de la zona es obligatorio.");

        var zona = await _db.Zonas.FindAsync(id);
        if (zona is null) return (false, "Zona no encontrada.");

        zona.Nombre          = req.Nombre;
        zona.Color           = req.Color;
        zona.Poligono        = req.Poligono;
        zona.ActualizadaEn   = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return (true, null);
    }

    public async Task<bool> EliminarZonaAsync(int id)
    {
        var zona = await _db.Zonas.FindAsync(id);
        if (zona is null) return false;
        _db.Zonas.Remove(zona);
        await _db.SaveChangesAsync();
        return true;
    }
}

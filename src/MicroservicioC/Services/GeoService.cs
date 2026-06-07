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
    Task<bool> CambiarEstadoZonaAsync(int id, string estado);
    Task<IEnumerable<CamaraDto>> ListarCamarasAsync(int? zonaId = null);
    Task<IEnumerable<CamaraDto>> ListarCamarasPorZonaAsync(int zonaId);
    Task<IEnumerable<CamaraCercanaDto>> ObtenerCamarasCercanasAsync(double lat, double lon, int maxResultados = 6);
    Task<Camara> CrearCamaraAsync(CrearCamaraRequest req);
    Task<bool> EliminarCamaraAsync(int id);
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
            .Select(z => new ZonaDto(z.Id, z.Nombre, z.Descripcion, z.Color, z.Estado, z.Poligono))
            .ToListAsync();

    public async Task<Zona> CrearZonaAsync(CrearZonaRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Nombre))
            throw new ArgumentException("El nombre de la zona es obligatorio.");

        var zona = new Zona
        {
            Nombre      = req.Nombre,
            Descripcion = req.Descripcion ?? "",
            Color       = req.Color,
            Estado      = string.IsNullOrEmpty(req.Estado) ? "Activa" : req.Estado,
            Poligono    = req.Poligono
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

        zona.Nombre        = req.Nombre;
        zona.Descripcion   = req.Descripcion ?? "";
        zona.Color         = req.Color;
        zona.Estado        = string.IsNullOrEmpty(req.Estado) ? "Activa" : req.Estado;
        zona.Poligono      = req.Poligono;
        zona.ActualizadaEn = DateTime.UtcNow;

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

    public async Task<bool> CambiarEstadoZonaAsync(int id, string estado)
    {
        var zona = await _db.Zonas.FindAsync(id);
        if (zona is null) return false;
        zona.Estado = estado;
        zona.ActualizadaEn = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return true;
    }

    // ── Cámaras cercanas ─────────────────────────────────────────────────
    private static double CalcularDistancia(double lat1, double lon1, double lat2, double lon2)
    {
        const double R = 6371000;
        var dLat = (lat2 - lat1) * Math.PI / 180;
        var dLon = (lon2 - lon1) * Math.PI / 180;
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(lat1 * Math.PI / 180) * Math.Cos(lat2 * Math.PI / 180) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return R * c;
    }

    public async Task<IEnumerable<CamaraCercanaDto>> ObtenerCamarasCercanasAsync(double lat, double lon, int maxResultados = 6)
    {
        var camaras = await _db.Camaras.ToListAsync();

        var conDistancia = camaras
            .Select(c => new CamaraCercanaDto(
                c.Id, c.Nombre, c.Facultad, c.Posicion,
                c.Latitud, c.Longitud,
                Math.Round(CalcularDistancia(lat, lon, c.Latitud, c.Longitud), 1)
            ))
            .OrderBy(c => c.DistanciaMetros)
            .ToList();

        // Intentar radio 50m, si hay menos de 3 expandir a 100m
        var cercanas = conDistancia.Where(c => c.DistanciaMetros <= 50).Take(maxResultados).ToList();
        if (cercanas.Count < 3)
            cercanas = conDistancia.Where(c => c.DistanciaMetros <= 100).Take(maxResultados).ToList();
        if (cercanas.Count < 3)
            cercanas = conDistancia.Take(maxResultados).ToList();

        return cercanas;
    }

    // ── Cámaras ─────────────────────────────────────────────────────────
    public async Task<IEnumerable<CamaraDto>> ListarCamarasAsync(int? zonaId = null)
    {
        var query = _db.Camaras.AsQueryable();
        if (zonaId.HasValue)
            query = query.Where(c => c.ZonaId == zonaId.Value);

        return await query
            .OrderBy(c => c.Nombre)
            .Select(c => new CamaraDto(
                c.Id, c.Nombre, c.Facultad, c.Posicion,
                c.Latitud, c.Longitud, c.ZonaId,
                c.Zona != null ? c.Zona.Nombre : null
            ))
            .ToListAsync();
    }

    public async Task<IEnumerable<CamaraDto>> ListarCamarasPorZonaAsync(int zonaId)
        => await ListarCamarasAsync(zonaId);

    public async Task<Camara> CrearCamaraAsync(CrearCamaraRequest req)
    {
        var camara = new Camara
        {
            Nombre    = req.Nombre,
            Facultad  = req.Facultad,
            Posicion  = req.Posicion,
            Latitud   = req.Latitud,
            Longitud  = req.Longitud,
            ZonaId    = req.ZonaId
        };
        _db.Camaras.Add(camara);
        await _db.SaveChangesAsync();
        return camara;
    }

    public async Task<bool> EliminarCamaraAsync(int id)
    {
        var camara = await _db.Camaras.FindAsync(id);
        if (camara is null) return false;
        _db.Camaras.Remove(camara);
        await _db.SaveChangesAsync();
        return true;
    }
}

namespace MicroservicioC.Models;

/// <summary>
/// Zona del campus UTA Huachi definida como un polígono GeoJSON.
/// Los vértices se almacenan como JSON: [[lon,lat],[lon,lat],...]
/// </summary>
public class Zona
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;   // "Zona A — Ingeniería"
    public string Color { get; set; } = "#3388ff";        // color hex para el mapa
    public string Poligono { get; set; } = "[]";          // JSON de coordenadas [[lon,lat],...]
    public DateTime CreadaEn { get; set; } = DateTime.UtcNow;
    public DateTime ActualizadaEn { get; set; } = DateTime.UtcNow;
}

// ── DTOs ───────────────────────────────────────────────────────────────────
public record CrearZonaRequest(string Nombre, string Color, string Poligono);
public record ActualizarZonaRequest(string Nombre, string Color, string Poligono);
public record ZonaDto(int Id, string Nombre, string Color, string Poligono);
public record PuntoEnZonaResponse(string Zona, bool DentroDelCampus);

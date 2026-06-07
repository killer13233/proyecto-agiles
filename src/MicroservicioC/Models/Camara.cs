namespace MicroservicioC.Models;

public class Camara
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Facultad { get; set; } = string.Empty;
    public string Posicion { get; set; } = string.Empty;
    public double Latitud { get; set; }
    public double Longitud { get; set; }
    public int? ZonaId { get; set; }
    public Zona? Zona { get; set; }
    public DateTime CreadaEn { get; set; } = DateTime.UtcNow;
}

public record CamaraDto(
    int Id, string Nombre, string Facultad, string Posicion,
    double Latitud, double Longitud, int? ZonaId, string? ZonaNombre
);

public record CrearCamaraRequest(
    string Nombre, string Facultad, string Posicion,
    double Latitud, double Longitud, int? ZonaId
);

public record CamaraCercanaDto(
    int Id, string Nombre, string Facultad, string Posicion,
    double Latitud, double Longitud, double DistanciaMetros
);

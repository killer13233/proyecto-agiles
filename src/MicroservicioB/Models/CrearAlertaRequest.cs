namespace MicroservicioB.Models;

public class CrearAlertaRequest
{
    public string Motivo { get; set; } = "";
    public double Latitud { get; set; }
    public double Longitud { get; set; }
    public string Zona { get; set; } = "";
}
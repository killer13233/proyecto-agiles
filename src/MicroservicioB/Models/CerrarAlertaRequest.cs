namespace MicroservicioB.Models;

public class CerrarAlertaRequest
{
    public string MotivoResolucion { get; set; } = "";
    public string? ResolucionDescripcion { get; set; }
}
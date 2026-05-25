public class AlertaHistorial
{
    public int Id { get; set; }
    public int AlertaId { get; set; }
    public string Accion { get; set; } = "";
    public string GuardiaId { get; set; } = "";
    public string NombreGuardia { get; set; } = "";
    public DateTime FechaHora { get; set; }
}
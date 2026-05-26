namespace MicroservicioB.Models;

public class Alerta
{
    public int Id { get; set; }
    public string UsuarioId { get; set; } = "";
    public string NombreUsuario { get; set; } = "";
    public string RolUsuario { get; set; } = "";
    public string Motivo { get; set; } = "";
    public double Latitud { get; set; }
    public double Longitud { get; set; }
    public string Zona { get; set; } = "";
public EstadoAlerta Estado { get; set; } = EstadoAlerta.Activa;
    public string GuardiasInvolucrados { get; set; } = "[]"; // JSON string
    public string? MotivoResolucion { get; set; }
    public string? ResolucionDescripcion { get; set; }
    public string? CerradaPor { get; set; }
    public DateTime CreadaEn { get; set; }
    public DateTime? CerradaEn { get; set; }
      public string Prioridad { get; set; } = "Media"; // ← agregar
}

public record AlertaDto(
    int Id,
    string UsuarioId,
    string NombreUsuario,
    string RolUsuario,
    string Motivo,
    string Prioridad,
    double Latitud,
    double Longitud,
    string Zona,
    string Estado,
    string GuardiasInvolucrados,
    string? MotivoResolucion,
    string? ResolucionDescripcion,
    string? CerradaPor,
    DateTime CreadaEn,
    DateTime? CerradaEn
);
// ── Response completo con datos del guardia y resolución ──────────────────
public record AlertaDetalleDto(
    int Id,
    string UsuarioId,
    string NombreUsuario,
    string RolUsuario,
    string Motivo,
    double Latitud,
    double Longitud,
    string Zona,
    string Estado,
    List<string> GuardiasInvolucrados,   // deserializado desde el JSON del modelo
    string? MotivoResolucion,
    string? ResolucionDescripcion,
    string? CerradaPor,
    DateTime CreadaEn,
    DateTime? CerradaEn
);

// ── Response paginado para GET /api/alertas ───────────────────────────────
public record AlertasPagedDto(
    List<AlertaDetalleDto> Items,
    int Total,
    int Pagina,
    int TamañoPagina
);

// ── Mensaje WebSocket broadcast ───────────────────────────────────────────
public record WsEventoDto(
    string Tipo,       // NUEVA_ALERTA | ALERTA_ASUMIDA | ALERTA_CERRADA
    AlertaDetalleDto Data,
    DateTime Timestamp
);

// ── Respuesta del endpoint /ws/ping ───────────────────────────────────────
public record WsPingResponse(
    string Status,
    int ConexionesActivas,
    DateTime ServerTime
);
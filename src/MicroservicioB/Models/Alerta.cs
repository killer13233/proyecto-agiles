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
    public string GuardiasInvolucrados { get; set; } = "[]";
    public string? GuardiaResponsableId { get; set; }
    public string? NombreGuardiaResponsable { get; set; }
    public string? MotivoResolucion { get; set; }
    public string? ResolucionDescripcion { get; set; }
    public string? CerradaPor { get; set; }
    public DateTime CreadaEn { get; set; }
    public DateTime? CerradaEn { get; set; }
}

public class AlertaHistorial
{
    public int Id { get; set; }
    public int AlertaId { get; set; }
    public string Accion { get; set; } = "";
    public string GuardiaId { get; set; } = "";
    public string NombreGuardia { get; set; } = "";
    public DateTime FechaHora { get; set; }
}

public record AlertaDto(
    int Id,
    string UsuarioId,
    string NombreUsuario,
    string RolUsuario,
    string Motivo,
    double Latitud,
    double Longitud,
    string Zona,
    string Estado,
    string GuardiasInvolucrados,
    string? GuardiaResponsableId,
    string? NombreGuardiaResponsable,
    string? MotivoResolucion,
    string? ResolucionDescripcion,
    string? CerradaPor,
    DateTime CreadaEn,
    DateTime? CerradaEn
);

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
    List<string> GuardiasInvolucrados,
    string? MotivoResolucion,
    string? ResolucionDescripcion,
    string? CerradaPor,
    DateTime CreadaEn,
    DateTime? CerradaEn
);

public record AlertasPagedDto(
    List<AlertaDetalleDto> Items,
    int Total,
    int Pagina,
    int TamañoPagina
);

public record WsEventoDto(
    string Tipo,
    AlertaDetalleDto Data,
    DateTime Timestamp
);

public record WsPingResponse(
    string Status,
    int ConexionesActivas,
    DateTime ServerTime
);

public record AlertaConHistorialDto(
    int Id,
    string NombreUsuario,
    string Motivo,
    string Zona,
    string Estado,
    string? GuardiaResponsableId,
    string? NombreGuardiaResponsable,
    DateTime CreadaEn,
    DateTime? CerradaEn,
    List<AlertaHistorialDto> Historial
);

public record AlertaHistorialDto(
    string Accion,
    string NombreGuardia,
    DateTime FechaHora
);
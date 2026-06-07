namespace MicroservicioA.Models;

/// <summary>
/// Grupo de confianza: un conjunto de usuarios que reciben notificaciones
/// prioritarias cuando el propietario emite una alerta de emergencia.
/// </summary>
public class GrupoConfianza
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }

    // FK al usuario que creó el grupo
    public int PropietarioId { get; set; }
    public Usuario Propietario { get; set; } = null!;

    // Miembros del grupo
    public ICollection<MiembroGrupoConfianza> Miembros { get; set; } = new List<MiembroGrupoConfianza>();

    public DateTime CreadoEn { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Relación muchos-a-muchos entre grupos de confianza y usuarios.
/// </summary>
public class MiembroGrupoConfianza
{
    public int Id { get; set; }

    public int GrupoConfianzaId { get; set; }
    public GrupoConfianza GrupoConfianza { get; set; } = null!;

    public int UsuarioId { get; set; }
    public Usuario Usuario { get; set; } = null!;

    public DateTime AgregadoEn { get; set; } = DateTime.UtcNow;
}

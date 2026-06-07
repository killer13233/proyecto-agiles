using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MicroservicioA.Models;
using MicroservicioA.Services;

namespace MicroservicioA.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class GruposConfianzaController : ControllerBase
{
    private readonly IGrupoConfianzaService _svc;
    public GruposConfianzaController(IGrupoConfianzaService svc) => _svc = svc;

    /// <summary>
    /// Lista los grupos de confianza del usuario autenticado.
    /// GET /api/gruposconfianza
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> ListarMisGrupos()
    {
        var userId = GetUserId();
        var grupos = await _svc.ListarPorUsuarioAsync(userId);
        return Ok(grupos);
    }

    /// <summary>
    /// Lista TODOS los grupos de confianza. Solo Administradores.
    /// GET /api/gruposconfianza/todos
    /// </summary>
    [HttpGet("todos")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> ListarTodos()
    {
        var grupos = await _svc.ListarTodosAsync();
        return Ok(grupos);
    }

    /// <summary>
    /// Obtiene el detalle de un grupo con todos sus miembros.
    /// GET /api/gruposconfianza/5
    /// </summary>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> Obtener(int id)
    {
        var grupo = await _svc.ObtenerPorIdAsync(id);
        if (grupo is null) return NotFound(new ErrorResponse("Grupo no encontrado."));

        // Solo el propietario o un admin pueden ver el detalle
        var userId = GetUserId();
        var rol = GetUserRol();
        if (grupo.PropietarioId != userId && !rol.Equals("Administrador", StringComparison.OrdinalIgnoreCase))
            return Forbid();

        return Ok(grupo);
    }

    /// <summary>
    /// Crea un nuevo grupo de confianza.
    /// POST /api/gruposconfianza
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Crear([FromBody] CrearGrupoConfianzaRequest request)
    {
        var userId = GetUserId();
        var (grupo, error) = await _svc.CrearAsync(userId, request);
        if (grupo is null) return BadRequest(new ErrorResponse(error!));
        return CreatedAtAction(nameof(Obtener), new { id = grupo.Id }, grupo);
    }

    /// <summary>
    /// Actualiza nombre y descripción de un grupo.
    /// PUT /api/gruposconfianza/5
    /// </summary>
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Actualizar(int id, [FromBody] ActualizarGrupoConfianzaRequest request)
    {
        var (ok, error) = await _svc.ActualizarAsync(id, GetUserId(), GetUserRol(), request);
        if (!ok) return BadRequest(new ErrorResponse(error!));
        return NoContent();
    }

    /// <summary>
    /// Elimina un grupo de confianza.
    /// DELETE /api/gruposconfianza/5
    /// </summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Eliminar(int id)
    {
        var (ok, error) = await _svc.EliminarAsync(id, GetUserId(), GetUserRol());
        if (!ok) return BadRequest(new ErrorResponse(error!));
        return NoContent();
    }

    /// <summary>
    /// Agrega un miembro a un grupo.
    /// POST /api/gruposconfianza/5/miembros
    /// </summary>
    [HttpPost("{id:int}/miembros")]
    public async Task<IActionResult> AgregarMiembro(int id, [FromBody] AgregarMiembroRequest request)
    {
        var (ok, error) = await _svc.AgregarMiembroAsync(id, GetUserId(), GetUserRol(), request.UsuarioId);
        if (!ok) return BadRequest(new ErrorResponse(error!));
        return Ok(new { mensaje = "Miembro agregado exitosamente." });
    }

    /// <summary>
    /// Quita un miembro de un grupo.
    /// DELETE /api/gruposconfianza/5/miembros/3
    /// </summary>
    [HttpDelete("{id:int}/miembros/{miembroId:int}")]
    public async Task<IActionResult> QuitarMiembro(int id, int miembroId)
    {
        var (ok, error) = await _svc.QuitarMiembroAsync(id, GetUserId(), GetUserRol(), miembroId);
        if (!ok) return BadRequest(new ErrorResponse(error!));
        return NoContent();
    }

    /// <summary>
    /// Busca usuarios para agregar a un grupo (excluye miembros actuales).
    /// GET /api/gruposconfianza/5/buscar-usuarios?q=Juan
    /// </summary>
    [HttpGet("{id:int}/buscar-usuarios")]
    public async Task<IActionResult> BuscarUsuarios(int id, [FromQuery] string q)
    {
        var usuarios = await _svc.BuscarUsuariosAsync(q, id);
        return Ok(usuarios);
    }

    /// <summary>
    /// Lista las invitaciones pendientes del usuario autenticado.
    /// GET /api/gruposconfianza/invitaciones
    /// </summary>
    [HttpGet("invitaciones")]
    public async Task<IActionResult> ListarInvitaciones()
    {
        var invitaciones = await _svc.ListarInvitacionesPendientesAsync(GetUserId());
        return Ok(invitaciones);
    }

    /// <summary>
    /// Responde a una invitación de un grupo.
    /// PUT /api/gruposconfianza/{id}/invitaciones/responder?aceptar=true
    /// </summary>
    [HttpPut("{id:int}/invitaciones/responder")]
    public async Task<IActionResult> ResponderInvitacion(int id, [FromQuery] bool aceptar)
    {
        var (ok, error) = await _svc.ResponderInvitacionAsync(id, GetUserId(), aceptar);
        if (!ok) return BadRequest(new ErrorResponse(error!));
        return Ok(new { mensaje = aceptar ? "Invitación aceptada." : "Invitación rechazada." });
    }

    /// <summary>
    /// Obtiene los IDs de los contactos de confianza del usuario (solo uso interno entre microservicios).
    /// GET /api/gruposconfianza/usuario/{id}/contactos
    /// </summary>
    [HttpGet("usuario/{id:int}/contactos")]
    [AllowAnonymous] // Opcional: Proteger con API Key o Policy para MS
    public async Task<IActionResult> ObtenerContactos(int id)
    {
        var contactos = await _svc.ObtenerContactosConfianzaAsync(id);
        return Ok(contactos);
    }

    // ── Helpers para extraer claims del token JWT ──────────────────────────
    private int GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)
            ?? User.FindFirst("sub")
            ?? User.FindFirst("id");
        return int.Parse(claim?.Value ?? "0");
    }

    private string GetUserRol()
    {
        return User.FindFirst(ClaimTypes.Role)?.Value
            ?? User.FindFirst("role")?.Value
            ?? "";
    }
}

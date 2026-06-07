using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MicroservicioB.Services;

namespace MicroservicioB.Controllers;

[ApiController]
[Route("api/[controller]")]
[AllowAnonymous] // Podría asegurarse con un token/API Key de servicio a servicio
public class WsNotificacionesController : ControllerBase
{
    private readonly IWebSocketManager _ws;

    public WsNotificacionesController(IWebSocketManager ws)
    {
        _ws = ws;
    }

    [HttpPost("invitacion")]
    public async Task<IActionResult> NotificarInvitacion([FromBody] NotificarInvitacionRequest req)
    {
        if (req.UsuarioId <= 0 || string.IsNullOrEmpty(req.GrupoNombre))
            return BadRequest();

        await _ws.EnviarAUsuarioAsync(req.UsuarioId.ToString(), new
        {
            tipo = "nueva_invitacion",
            grupoNombre = req.GrupoNombre
        });

        return Ok();
    }
}

public record NotificarInvitacionRequest(int UsuarioId, string GrupoNombre);

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MicroservicioA.Models;
using MicroservicioA.Services;

namespace MicroservicioA.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsuariosController : ControllerBase
{
    private readonly IUsuarioService _svc;
    public UsuariosController(IUsuarioService svc) => _svc = svc;

    /// <summary>
    /// Lista usuarios paginados. Solo administradores.
    /// GET /api/usuarios?pagina=1&tamaño=10&rol=Guardia
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Listar(
        [FromQuery] int pagina = 1,
        [FromQuery] int tamaño = 10,
        [FromQuery] string? rol = null)
    {
        if (pagina < 1) pagina = 1;
        if (tamaño < 1 || tamaño > 100) tamaño = 10;

        var resultado = await _svc.ListarAsync(pagina, tamaño, rol);
        return Ok(resultado);
    }

    /// <summary>
    /// Cambia el rol de un usuario. Solo administradores.
    /// PUT /api/usuarios/5/rol
    /// </summary>
    [HttpPut("{id:int}/rol")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> CambiarRol(int id, [FromBody] CambiarRolRequest request)
    {
        var (ok, error) = await _svc.CambiarRolAsync(id, request.NuevoRol);
        if (!ok) return BadRequest(new ErrorResponse(error!));
        return NoContent();
    }

    /// <summary>
    /// Cambia el estado de un usuario (Activo/Inactivo/Bloqueado). Solo administradores.
    /// PATCH /api/usuarios/5/estado
    /// </summary>
    [HttpPatch("{id:int}/estado")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> CambiarEstado(int id, [FromBody] CambiarEstadoRequest request)
    {
        var (ok, error) = await _svc.CambiarEstadoAsync(id, request.NuevoEstado);
        if (!ok) return BadRequest(new ErrorResponse(error!));
        return NoContent();
    }
}

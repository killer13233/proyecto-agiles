using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MicroservicioC.Models;
using MicroservicioC.Services;

namespace MicroservicioC.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ZonasController : ControllerBase
{
    private readonly IGeoService _geo;
    public ZonasController(IGeoService geo) => _geo = geo;

    /// <summary>GET /api/zonas — lista todas las zonas definidas</summary>
    [HttpGet]
    public async Task<IActionResult> Listar()
        => Ok(await _geo.ListarZonasAsync());

    /// <summary>
    /// GET /api/zonas/punto?lat=-1.2345&lon=-78.6789
    /// Llamado internamente por MicroservicioB al crear una alerta.
    /// </summary>
    [HttpGet("punto")]
    public async Task<IActionResult> PuntoenZona([FromQuery] double lat, [FromQuery] double lon)
    {
        var resultado = await _geo.ObtenerZonaDePuntoAsync(lat, lon);
        return Ok(resultado);
    }

    /// <summary>POST /api/zonas — crea una nueva zona. Solo administradores.</summary>
    [HttpPost]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Crear([FromBody] CrearZonaRequest req)
    {
        try
        {
            var zona = await _geo.CrearZonaAsync(req);
            return CreatedAtAction(nameof(Listar), new { id = zona.Id }, zona);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
    }

    /// <summary>PUT /api/zonas/3 — actualiza vértices o nombre de una zona.</summary>
    [HttpPut("{id:int}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Actualizar(int id, [FromBody] ActualizarZonaRequest req)
    {
        var (ok, error) = await _geo.ActualizarZonaAsync(id, req);
        if (!ok) return BadRequest(new { mensaje = error });
        return NoContent();
    }

    /// <summary>PATCH /api/zonas/{id}/estado — cambia estado de una zona</summary>
    [HttpPatch("{id:int}/estado")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> CambiarEstado(int id, [FromBody] CambiarEstadoRequest req)
    {
        var ok = await _geo.CambiarEstadoZonaAsync(id, req.Estado);
        if (!ok) return NotFound();
        return NoContent();
    }

    /// <summary>DELETE /api/zonas/3</summary>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Eliminar(int id)
    {
        var ok = await _geo.EliminarZonaAsync(id);
        if (!ok) return NotFound();
        return NoContent();
    }

    // ── Cámaras ─────────────────────────────────────────────────────────

    /// <summary>GET /api/zonas/camaras — lista todas las cámaras (opcional ?zonaId=)</summary>
    [HttpGet("camaras")]
    public async Task<IActionResult> ListarCamaras([FromQuery] int? zonaId)
        => Ok(await _geo.ListarCamarasAsync(zonaId));

    /// <summary>GET /api/zonas/{zonaId}/camaras — lista cámaras de una zona</summary>
    [HttpGet("{zonaId:int}/camaras")]
    public async Task<IActionResult> ListarCamarasPorZona(int zonaId)
        => Ok(await _geo.ListarCamarasPorZonaAsync(zonaId));

    /// <summary>GET /api/zonas/camaras/cercanas?lat=X&lon=Y — cámaras más cercanas ordenadas por distancia</summary>
    [HttpGet("camaras/cercanas")]
    public async Task<IActionResult> ObtenerCamarasCercanas([FromQuery] double lat, [FromQuery] double lon)
        => Ok(await _geo.ObtenerCamarasCercanasAsync(lat, lon));

    /// <summary>POST /api/zonas/camaras — crea una nueva cámara</summary>
    [HttpPost("camaras")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> CrearCamara([FromBody] CrearCamaraRequest req)
    {
        var camara = await _geo.CrearCamaraAsync(req);
        return CreatedAtAction(nameof(ListarCamaras), new { id = camara.Id }, camara);
    }

    /// <summary>DELETE /api/zonas/camaras/5</summary>
    [HttpDelete("camaras/{id:int}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> EliminarCamara(int id)
    {
        var ok = await _geo.EliminarCamaraAsync(id);
        if (!ok) return NotFound();
        return NoContent();
    }
}

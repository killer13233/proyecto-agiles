using System.Net.WebSockets;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MicroservicioB.Models;
using MicroservicioB.Services;

namespace MicroservicioB.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AlertasController : ControllerBase
{
    private readonly IAlertaService _svc;
    public AlertasController(IAlertaService svc) => _svc = svc;

    [HttpPost]
    public async Task<IActionResult> Crear([FromBody] CrearAlertaRequest req)
    {
        var usuarioId     = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";
        var nombreUsuario = User.FindFirstValue("nombre") ?? "";
        var rolUsuario    = User.FindFirstValue(ClaimTypes.Role) ?? "";

        var alerta = await _svc.CrearAsync(usuarioId, nombreUsuario, rolUsuario, req);
        return CreatedAtAction(nameof(Listar), new { id = alerta.Id }, alerta);
    }

    [HttpGet]
    public async Task<IActionResult> Listar([FromQuery] string? zona, [FromQuery] string? estado)
    {
        var alertas = await _svc.ListarAsync(zona, estado);
        return Ok(alertas);
    }

    [HttpPatch("{id:int}/asumir")]
    [Authorize(Roles = "Guardia,Administrador")]
    public async Task<IActionResult> Asumir(int id, [FromBody] AsumirAlertaRequest req)
    {
        var ok = await _svc.AsumirAsync(id, req);
        if (!ok) return BadRequest(new { mensaje = "No se pudo asumir la alerta." });
        return NoContent();
    }

    [HttpPost("{id:int}/cerrar")]
    [Authorize(Roles = "Guardia")]
    public async Task<IActionResult> Cerrar(int id, [FromBody] CerrarAlertaRequest req)
    {
        var guardiaId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";
        var (ok, error) = await _svc.CerrarAsync(id, guardiaId, req);
        if (!ok) return BadRequest(new { mensaje = error });
        return NoContent();
    }
}

[ApiController]
[Route("ws")]
public class WebSocketController : ControllerBase
{
    private readonly IWebSocketManager _wsManager;
    private readonly IConfiguration _config;

    public WebSocketController(IWebSocketManager wsManager, IConfiguration config)
    {
        _wsManager = wsManager;
        _config    = config;
    }

    [HttpGet]
    public async Task Connect()
    {
        if (!HttpContext.WebSockets.IsWebSocketRequest)
        {
            HttpContext.Response.StatusCode = 400;
            return;
        }

        var token  = HttpContext.Request.Query["token"].ToString();
        var claims = ValidarToken(token);

        if (claims is null)
        {
            HttpContext.Response.StatusCode = 401;
            return;
        }

        var userId = claims.FindFirstValue(ClaimTypes.NameIdentifier) ?? Guid.NewGuid().ToString();
        var rol    = claims.FindFirstValue(ClaimTypes.Role) ?? "Desconocido";

        using var socket = await HttpContext.WebSockets.AcceptWebSocketAsync();
        _wsManager.Agregar(userId, rol, socket);

        // ← CAMBIO 1: Si es admin, enviarle los estados actuales de disponibilidad
        if (rol == "Administrador")
        {
            await _wsManager.EnviarEstadosAAdmin(userId);
        }

        await EscucharAsync(socket, userId);
    }

    [HttpGet("ping")]
    [AllowAnonymous]
    public IActionResult Ping()
    {
        return Ok(new WsPingResponse(
            "OK",
            _wsManager.ConexionesActivas(),
            DateTime.UtcNow
        ));
    }

  private async Task EscucharAsync(WebSocket socket, string userId)
{
    var buffer = new byte[1024 * 4];

    try
    {
        while (socket.State == WebSocketState.Open)
        {
            var result = await socket.ReceiveAsync(
                new ArraySegment<byte>(buffer),
                CancellationToken.None);

            if (result.MessageType == WebSocketMessageType.Close)
                break;

            if (result.MessageType == WebSocketMessageType.Text)
            {
                var mensaje = System.Text.Encoding.UTF8.GetString(
                    buffer,
                    0,
                    result.Count);

                try
                {
                    var json = System.Text.Json.JsonDocument.Parse(mensaje);
                    var tipo = json.RootElement.GetProperty("tipo").GetString();

                    if (tipo == "disponibilidad")
                    {
                        var disponible = json.RootElement
                            .GetProperty("disponible")
                            .GetBoolean();

                        _wsManager.ActualizarDisponibilidad(
                            userId,
                            disponible);

                        var payload = System.Text.Json.JsonSerializer.Serialize(new
                        {
                            tipo = "guardia_disponibilidad",
                            guardiaId = userId,
                            disponible
                        });

                        await _wsManager.EnviarAAdminsAsync(payload);
                    }
                    else if (tipo == "ubicacion_usuario")
                    {
                        var alertaId = json.RootElement
                            .GetProperty("alertaId")
                            .GetInt32();

                        var lat = json.RootElement
                            .GetProperty("latitud")
                            .GetDouble();

                        var lon = json.RootElement
                            .GetProperty("longitud")
                            .GetDouble();

                        var payload = System.Text.Json.JsonSerializer.Serialize(new
                        {
                            tipo = "ubicacion_usuario",
                            usuarioId = userId,
                            alertaId,
                            latitud = lat,
                            longitud = lon
                        });

                        await _wsManager.BroadcastUbicacionUsuarioAsync(payload);
                    }
                    else if (tipo == "ubicacion_guardia")
                    {
                        int? alertaId = null;
                        if (json.RootElement.TryGetProperty("alertaId", out var alertaProp))
                            alertaId = alertaProp.GetInt32();

                        var lat = json.RootElement
                            .GetProperty("latitud")
                            .GetDouble();

                        var lon = json.RootElement
                            .GetProperty("longitud")
                            .GetDouble();

                        var payload = System.Text.Json.JsonSerializer.Serialize(new
                        {
                            tipo = "ubicacion_guardia",
                            guardiaId = userId,
                            alertaId,
                            latitud = lat,
                            longitud = lon
                        });

                        await _wsManager.BroadcastUbicacionGuardiaAsync(payload);
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error procesando mensaje: {ex.Message}");
                }
            }
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error WebSocket: {ex.Message}");
    }
    finally
    {
        _wsManager.Remover(userId);

        if (socket.State == WebSocketState.Open)
        {
            await socket.CloseAsync(
                WebSocketCloseStatus.NormalClosure,
                "Desconectado",
                CancellationToken.None);
        }
    }
}

    private ClaimsPrincipal? ValidarToken(string token)
    {
        if (string.IsNullOrWhiteSpace(token)) return null;
        try
        {
            var handler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
            var key     = System.Text.Encoding.UTF8.GetBytes(_config["Jwt:Key"]!);
            var result  = handler.ValidateToken(token, new Microsoft.IdentityModel.Tokens.TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey         = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(key),
                ValidateIssuer           = true,
                ValidIssuer              = _config["Jwt:Issuer"],
                ValidateAudience         = true,
                ValidAudience            = _config["Jwt:Audience"],
                ValidateLifetime         = true
            }, out _);
            return result;
        }
        catch { return null; }
    }
}
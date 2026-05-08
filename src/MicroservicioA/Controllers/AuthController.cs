using Microsoft.AspNetCore.Mvc;
using MicroservicioA.Models;
using MicroservicioA.Services;

namespace MicroservicioA.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _auth;
    public AuthController(IAuthService auth) => _auth = auth;

    /// <summary>
    /// Login con correo y contraseña. Devuelve JWT si las credenciales son válidas.
    /// </summary>
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Correo) ||
            string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new ErrorResponse("Correo y contraseña son requeridos."));

        var (response, error) = await _auth.LoginAsync(request);

        if (error is not null)
            return Unauthorized(new ErrorResponse(error));

        return Ok(response);
    }
}

using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MicroservicioA.Data;
using MicroservicioA.Models;

namespace MicroservicioA.Services;

public interface IAuthService
{
    Task<(LoginResponse? response, string? error)> LoginAsync(LoginRequest request);
}

public class AuthService : IAuthService
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;
    private const int MaxIntentos = 3;

    public AuthService(AppDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    public async Task<(LoginResponse? response, string? error)> LoginAsync(LoginRequest request)
    {
        var usuario = await _db.Usuarios
            .FirstOrDefaultAsync(u => u.Correo == request.Correo);

        // Usuario no encontrado — mismo mensaje para no revelar si existe
        if (usuario is null)
            return (null, "Credenciales incorrectas. Intente nuevamente.");

        // Cuenta bloqueada
        if (usuario.Estado == EstadoUsuario.Bloqueado)
            return (null, "Cuenta bloqueada. Contacte al administrador para reactivarla.");

        // Cuenta inactiva
        if (usuario.Estado == EstadoUsuario.Inactivo)
            return (null, "Cuenta inactiva. Contacte al administrador.");

        // Verificar contraseña
        var passwordValida = BCrypt.Net.BCrypt.Verify(request.Password, usuario.PasswordHash);

        if (!passwordValida)
        {
            usuario.IntentosFallidos++;

            if (usuario.IntentosFallidos >= MaxIntentos)
            {
                usuario.Estado = EstadoUsuario.Bloqueado;
                await _db.SaveChangesAsync();

                // TODO Sprint 2: enviar correo real. Por ahora solo log.
                Console.WriteLine($"[Auth] ALERTA: cuenta {usuario.Correo} bloqueada tras {MaxIntentos} intentos fallidos.");

                return (null, $"Cuenta bloqueada tras {MaxIntentos} intentos fallidos. Contacte al administrador.");
            }

            await _db.SaveChangesAsync();
            var restantes = MaxIntentos - usuario.IntentosFallidos;
            return (null, $"Credenciales incorrectas. Intente nuevamente. ({restantes} intento(s) restante(s))");
        }

        // Login exitoso — resetear intentos
        usuario.IntentosFallidos = 0;
        usuario.UltimoAcceso = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        var token = GenerarToken(usuario);
        var expHours = int.Parse(_config["Jwt:ExpirationHours"] ?? "8");

        return (new LoginResponse(
            Token: token,
            Nombre: usuario.Nombre,
            Correo: usuario.Correo,
            Rol: usuario.Rol.ToString(),
            ZonaAsignada: usuario.ZonaAsignada,
            ExpiresInHours: expHours
        ), null);
    }

    private string GenerarToken(Usuario usuario)
    {
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));

        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expHours = int.Parse(_config["Jwt:ExpirationHours"] ?? "8");

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, usuario.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, usuario.Correo),
            new Claim("nombre", usuario.Nombre),
            new Claim(ClaimTypes.Role, usuario.Rol.ToString()),
            new Claim("zona", usuario.ZonaAsignada ?? ""),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(expHours),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

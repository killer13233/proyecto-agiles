using Microsoft.EntityFrameworkCore;
using MicroservicioA.Data;
using MicroservicioA.Models;

namespace MicroservicioA.Services;

public interface IUsuarioService
{
    Task<PaginadoResponse<UsuarioDto>> ListarAsync(int pagina, int tamaño, string? rolFiltro, string? busqueda = null);
    Task<(bool ok, string? error)> CambiarRolAsync(int id, string nuevoRol);
    Task<(bool ok, string? error)> CambiarEstadoAsync(int id, string nuevoEstado, string? motivoDesactivacion = null);
}

public class UsuarioService : IUsuarioService
{
    private readonly AppDbContext _db;
    private static readonly string[] RolesValidos =
        Enum.GetNames<Rol>();

    public UsuarioService(AppDbContext db) => _db = db;

    public async Task<PaginadoResponse<UsuarioDto>> ListarAsync(
        int pagina, int tamaño, string? rolFiltro, string? busqueda = null)
    {
        var query = _db.Usuarios.AsQueryable();

        if (!string.IsNullOrWhiteSpace(rolFiltro) &&
            Enum.TryParse<Rol>(rolFiltro, ignoreCase: true, out var rol))
        {
            query = query.Where(u => u.Rol == rol);
        }

        if (!string.IsNullOrWhiteSpace(busqueda))
        {
            var q = busqueda.ToLower();
            query = query.Where(u => u.Nombre.ToLower().Contains(q) || u.Correo.ToLower().Contains(q));
        }

        var total = await query.CountAsync();

        var items = await query
            .OrderBy(u => u.Nombre)
            .Skip((pagina - 1) * tamaño)
            .Take(tamaño)
            .Select(u => new UsuarioDto(
                u.Id, u.Nombre, u.Correo,
                u.Rol.ToString(), u.Estado.ToString(),
                u.ZonaAsignada, u.UltimoAcceso, u.MotivoDesactivacion))
            .ToListAsync();

        return new PaginadoResponse<UsuarioDto>(items, total, pagina, tamaño);
    }

    public async Task<(bool ok, string? error)> CambiarRolAsync(int id, string nuevoRol)
    {
        if (!Enum.TryParse<Rol>(nuevoRol, ignoreCase: true, out var rol))
            return (false, $"Rol inválido. Roles válidos: {string.Join(", ", RolesValidos)}");

        var usuario = await _db.Usuarios.FindAsync(id);
        if (usuario is null) return (false, "Usuario no encontrado.");

        usuario.Rol = rol;
        await _db.SaveChangesAsync();
        return (true, null);
    }

    public async Task<(bool ok, string? error)> CambiarEstadoAsync(int id, string nuevoEstado, string? motivoDesactivacion = null)
    {
        if (!Enum.TryParse<EstadoUsuario>(nuevoEstado, ignoreCase: true, out var estado))
            return (false, $"Estado inválido. Estados válidos: {string.Join(", ", Enum.GetNames<EstadoUsuario>())}");

        var usuario = await _db.Usuarios.FindAsync(id);
        if (usuario is null) return (false, "Usuario no encontrado.");

        if (estado == EstadoUsuario.Activo)
        {
            // Reactivando — resetear intentos y limpiar motivo
            usuario.IntentosFallidos = 0;
            usuario.MotivoDesactivacion = null;
        }
        else if (estado == EstadoUsuario.Inactivo)
        {
            // Desactivando — guardar el motivo
            usuario.MotivoDesactivacion = motivoDesactivacion;
        }

        usuario.Estado = estado;
        await _db.SaveChangesAsync();
        return (true, null);
    }
}

using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;

namespace MicroservicioB.Services;

public interface IWebSocketManager
{
    void Agregar(string userId, string rol, WebSocket socket);
    void Remover(string userId);
    Task BroadcastGuardiasAsync(object mensaje);
    Task EnviarAUsuarioAsync(string userId, object mensaje);
    Task EnviarAAdminsAsync(string payload);
    void ActualizarDisponibilidad(string guardiaId, bool disponible);
    Task EnviarEstadosAAdmin(string adminId);
    int ConexionesActivas();
}

public class WebSocketConnectionManager : IWebSocketManager
{
    private readonly ConcurrentDictionary<string, (WebSocket Socket, string Rol)>
        _conexiones = new();

    private readonly ConcurrentDictionary<string, bool> _disponibilidades = new();

    public void Agregar(string userId, string rol, WebSocket socket)
    {
        _conexiones[userId] = (socket, rol);
        Console.WriteLine($"[WS] Conectado: {userId} ({rol}). Total: {_conexiones.Count}");
    }

    public void Remover(string userId)
    {
        _conexiones.TryRemove(userId, out _);
        _disponibilidades.TryRemove(userId, out _);
        Console.WriteLine($"[WS] Desconectado: {userId}. Total: {_conexiones.Count}");
    }

    public void ActualizarDisponibilidad(string guardiaId, bool disponible)
    {
        _disponibilidades[guardiaId] = disponible;
    }

    public async Task EnviarEstadosAAdmin(string adminId)
    {
        if (!_conexiones.TryGetValue(adminId, out var conn)) return;
        if (conn.Socket.State != WebSocketState.Open) return;

        foreach (var kv in _disponibilidades)
        {
            var payload = JsonSerializer.Serialize(new
            {
                tipo = "guardia_disponibilidad",
                guardiaId = kv.Key,
                disponible = kv.Value
            });
            var bytes = Encoding.UTF8.GetBytes(payload);
            await conn.Socket.SendAsync(
                new ArraySegment<byte>(bytes),
                WebSocketMessageType.Text,
                true,
                CancellationToken.None);
        }
    }

    public async Task BroadcastGuardiasAsync(object mensaje)
    {
        var json = JsonSerializer.Serialize(mensaje);
        var bytes = Encoding.UTF8.GetBytes(json);
        var segment = new ArraySegment<byte>(bytes);

        var guardias = _conexiones
            .Where(kv => kv.Value.Rol == "Guardia" &&
                         kv.Value.Socket.State == WebSocketState.Open)
            .ToList();

        Console.WriteLine($"[WS] Broadcast a {guardias.Count} guardia(s).");

        var tareas = guardias.Select(kv =>
            kv.Value.Socket.SendAsync(segment, WebSocketMessageType.Text, true, CancellationToken.None));

        await Task.WhenAll(tareas);
    }

    public async Task EnviarAAdminsAsync(string payload)
    {
        var bytes = Encoding.UTF8.GetBytes(payload);
        var segment = new ArraySegment<byte>(bytes);

        var admins = _conexiones
            .Where(kv => kv.Value.Rol == "Administrador" &&
                         kv.Value.Socket.State == WebSocketState.Open)
            .ToList();

        Console.WriteLine($"[WS] Enviando a {admins.Count} admin(s).");

        var tareas = admins.Select(kv =>
            kv.Value.Socket.SendAsync(segment, WebSocketMessageType.Text, true, CancellationToken.None));

        await Task.WhenAll(tareas);
    }

    public async Task EnviarAUsuarioAsync(string userId, object mensaje)
    {
        if (!_conexiones.TryGetValue(userId, out var conn)) return;
        if (conn.Socket.State != WebSocketState.Open) return;

        var json = JsonSerializer.Serialize(mensaje);
        var bytes = Encoding.UTF8.GetBytes(json);
        await conn.Socket.SendAsync(
            new ArraySegment<byte>(bytes),
            WebSocketMessageType.Text,
            true,
            CancellationToken.None);
    }

    public int ConexionesActivas() => _conexiones.Count;
}
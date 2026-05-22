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
    int ConexionesActivas();
}

/// <summary>
/// Maneja todas las conexiones WebSocket activas.
/// Singleton — vive durante toda la vida de la aplicación.
/// </summary>
public class WebSocketConnectionManager : IWebSocketManager
{
    // userId → (socket, rol)
    private readonly ConcurrentDictionary<string, (WebSocket Socket, string Rol)>
        _conexiones = new();

    public void Agregar(string userId, string rol, WebSocket socket)
    {
        _conexiones[userId] = (socket, rol);
        Console.WriteLine($"[WS] Conectado: {userId} ({rol}). Total: {_conexiones.Count}");
    }
    // En la clase WebSocketConnectionManager agrega este método:
public async Task EnviarAAdminsAsync(string payload)
{
    var bytes = Encoding.UTF8.GetBytes(payload);
    var segment = new ArraySegment<byte>(bytes);

    var admins = _conexiones
        .Where(kv => kv.Value.Rol == "Administrador" &&
                     kv.Value.Socket.State == WebSocketState.Open)
        .ToList();

    Console.WriteLine($"[WS] Enviando disponibilidad a {admins.Count} admin(s).");

    var tareas = admins.Select(kv =>
        kv.Value.Socket.SendAsync(segment, WebSocketMessageType.Text, true, CancellationToken.None));

    await Task.WhenAll(tareas);
}

    public void Remover(string userId)
    {
        _conexiones.TryRemove(userId, out _);
        Console.WriteLine($"[WS] Desconectado: {userId}. Total: {_conexiones.Count}");
    }

    /// <summary>
    /// Envía un mensaje a todos los guardias conectados con socket abierto.
    /// </summary>
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

    /// <summary>
    /// Envía un mensaje a un usuario específico por su userId.
    /// </summary>
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

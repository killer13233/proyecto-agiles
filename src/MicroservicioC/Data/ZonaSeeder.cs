using MicroservicioC.Models;
using Microsoft.EntityFrameworkCore;

namespace MicroservicioC.Data;

public static class ZonaSeeder
{
    public static async Task SeedAsync(ZonaDbContext db)
    {
        try 
        {
            // Limpiar zonas obsoletas con nombres cortos para evitar duplicados en el equipo
            var nombresObsoletos = new[] { "Zona A", "Zona B", "Zona C", "Zona D" };
            var zonasObsoletas = await db.Zonas
                .Where(z => nombresObsoletos.Contains(z.Nombre))
                .ToListAsync();

            if (zonasObsoletas.Any())
            {
                db.Zonas.RemoveRange(zonasObsoletas);
                await db.SaveChangesAsync();
                Console.WriteLine($"[ZonaSeeder] ✓ Eliminadas {zonasObsoletas.Count} zonas obsoletas.");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[ZonaSeeder] Error limpiando zonas: {ex.Message}");
        }

        var zonasBase = new List<(string Nombre, string Color, string Poligono)>
        {
            ("Zona A — Ingeniería", "#FF5733", "[[-78.6215,-1.2405],[-78.6200,-1.2405],[-78.6200,-1.2420],[-78.6215,-1.2420],[-78.6215,-1.2405]]"),
            ("Zona B — Rectorado", "#33C3FF", "[[-78.6200,-1.2405],[-78.6185,-1.2405],[-78.6185,-1.2420],[-78.6200,-1.2420],[-78.6200,-1.2405]]"),
            ("Zona C — Biblioteca", "#33FF57", "[[-78.6215,-1.2420],[-78.6200,-1.2420],[-78.6200,-1.2435],[-78.6215,-1.2435],[-78.6215,-1.2420]]"),
            ("Zona D — Deportivo", "#FFD433", "[[-78.6200,-1.2420],[-78.6185,-1.2420],[-78.6185,-1.2435],[-78.6200,-1.2435],[-78.6200,-1.2420]]")
        };

        foreach (var (nombre, color, poligono) in zonasBase)
        {
            // Solo inserta si no existe ya una zona con ese nombre
            if (!db.Zonas.Any(z => z.Nombre == nombre))
            {
                db.Zonas.Add(new Zona
                {
                    Nombre   = nombre,
                    Color    = color,
                    Poligono = poligono
                });
            }
        }

        await db.SaveChangesAsync();
        Console.WriteLine("[ZonaSeeder] ✓ Zonas base verificadas.");
    }
}
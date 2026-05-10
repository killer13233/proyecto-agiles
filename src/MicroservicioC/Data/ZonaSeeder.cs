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

        var zonasBase = new List<(string Nombre, string Color, string Poligono)>();

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
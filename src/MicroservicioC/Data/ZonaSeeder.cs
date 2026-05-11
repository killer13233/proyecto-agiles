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
            ("Zona A", "#ef4444", "[[-78.62244206459614,-1.2702395307744139],[-78.62387449684503,-1.270046467851898],[-78.62371354940134,-1.2698587677744713],[-78.62340774925832,-1.269633527663598],[-78.62333800536605,-1.2687969213656822],[-78.62335410011042,-1.267928137616123],[-78.62370281957176,-1.2680246691582437],[-78.62356333178722,-1.2685073268149165],[-78.62482408676284,-1.2688398242593324],[-78.62503331843966,-1.2684268838783928],[-78.62596681361309,-1.2687647441949963],[-78.6263369927336,-1.2703950536737503],[-78.62225965749327,-1.2709956937487832],[-78.62244206459614,-1.2702395307744139]]"),
            ("Zona B", "#10b981", "[[-78.62596929073335,-1.2687474601603914],[-78.6250412464142,-1.2684042215542302],[-78.62481594085695,-1.2688225435994231],[-78.62357676029207,-1.2684793050032233],[-78.62371087074281,-1.2680180780678698],[-78.62397372722627,-1.2679966256502695],[-78.62422585487367,-1.2672940588757156],[-78.62568497657777,-1.267760649044975],[-78.62596392631532,-1.2686723767191843],[-78.62596929073335,-1.2687474601603914]]"),
            ("Zona C", "#f59e0b", "[[-78.62335681915285,-1.2679108159781],[-78.62370550632478,-1.2680019887546887],[-78.62395763397218,-1.267975173232504],[-78.62421512603761,-1.2672940588757156],[-78.62420976161958,-1.266527134621791],[-78.62320661544801,-1.26660221812521],[-78.62332463264467,-1.267186796755947],[-78.62335681915285,-1.2679108159781]]"),
            ("Zona D", "#2563eb", "[[-78.62528800964357,-1.2663930569317094],[-78.62420439720154,-1.2665056821918375],[-78.6242312192917,-1.2672779695580307],[-78.62567961215974,-1.2677391966252374],[-78.62526655197145,-1.2663018840984943],[-78.62528800964357,-1.2663930569317094]]")
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
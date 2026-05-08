using Microsoft.EntityFrameworkCore;
using MicroservicioC.Models;

namespace MicroservicioC.Data;

public class ZonaDbContext : DbContext
{
    public ZonaDbContext(DbContextOptions<ZonaDbContext> options) : base(options) { }
    public DbSet<Zona> Zonas => Set<Zona>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Zona>(e =>
        {
            e.HasKey(z => z.Id);
            e.HasIndex(z => z.Nombre).IsUnique();
            e.Property(z => z.Nombre).HasMaxLength(100).IsRequired();
            e.Property(z => z.Poligono).HasColumnType("nvarchar(max)");
        });
    }
}

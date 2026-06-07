using Microsoft.EntityFrameworkCore;
using MicroservicioC.Models;

namespace MicroservicioC.Data;

public class ZonaDbContext : DbContext
{
    public ZonaDbContext(DbContextOptions<ZonaDbContext> options) : base(options) { }
    public DbSet<Zona> Zonas => Set<Zona>();
    public DbSet<Camara> Camaras => Set<Camara>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Zona>(e =>
        {
            e.HasKey(z => z.Id);
            e.HasIndex(z => z.Nombre).IsUnique();
            e.Property(z => z.Nombre).HasMaxLength(100).IsRequired();
            e.Property(z => z.Descripcion).HasColumnType("nvarchar(max)");
            e.Property(z => z.Estado).HasMaxLength(20).HasDefaultValue("Activa");
            e.Property(z => z.Poligono).HasColumnType("nvarchar(max)");
        });

        modelBuilder.Entity<Camara>(e =>
        {
            e.HasKey(c => c.Id);
            e.Property(c => c.Nombre).HasMaxLength(100).IsRequired();
            e.Property(c => c.Facultad).HasMaxLength(50);
            e.Property(c => c.Posicion).HasMaxLength(50);
            e.HasOne(c => c.Zona)
             .WithMany()
             .HasForeignKey(c => c.ZonaId)
             .OnDelete(DeleteBehavior.SetNull);
        });
    }
}

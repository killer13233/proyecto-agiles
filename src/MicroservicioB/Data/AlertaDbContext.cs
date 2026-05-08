using Microsoft.EntityFrameworkCore;
using MicroservicioB.Models;

namespace MicroservicioB.Data;

public class AlertaDbContext : DbContext
{
    public AlertaDbContext(DbContextOptions<AlertaDbContext> options) : base(options) { }

    public DbSet<Alerta> Alertas => Set<Alerta>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Alerta>(e =>
        {
            e.HasKey(a => a.Id);
            e.Property(a => a.Estado).HasConversion<string>();
            e.Property(a => a.Motivo).HasMaxLength(200);
            e.Property(a => a.Zona).HasMaxLength(100);
        });
    }
}

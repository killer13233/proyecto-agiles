using Microsoft.EntityFrameworkCore;
using MicroservicioA.Models;

namespace MicroservicioA.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Usuario> Usuarios => Set<Usuario>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Usuario>(e =>
        {
            e.HasKey(u => u.Id);
            e.HasIndex(u => u.Correo).IsUnique();
            e.Property(u => u.Correo).HasMaxLength(200).IsRequired();
            e.Property(u => u.Nombre).HasMaxLength(200).IsRequired();
            e.Property(u => u.PasswordHash).IsRequired();
            e.Property(u => u.Rol).HasConversion<string>();
            e.Property(u => u.Estado).HasConversion<string>();
        });
    }
}

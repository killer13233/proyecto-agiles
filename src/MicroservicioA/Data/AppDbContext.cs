using Microsoft.EntityFrameworkCore;
using MicroservicioA.Models;

namespace MicroservicioA.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<GrupoConfianza> GruposConfianza => Set<GrupoConfianza>();
    public DbSet<MiembroGrupoConfianza> MiembrosGrupoConfianza => Set<MiembroGrupoConfianza>();

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

        modelBuilder.Entity<GrupoConfianza>(e =>
        {
            e.HasKey(g => g.Id);
            e.Property(g => g.Nombre).HasMaxLength(100).IsRequired();
            e.Property(g => g.Descripcion).HasMaxLength(250);

            e.HasOne(g => g.Propietario)
             .WithMany()
             .HasForeignKey(g => g.PropietarioId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<MiembroGrupoConfianza>(e =>
        {
            e.HasKey(m => m.Id);

            // Un usuario solo puede estar una vez en un grupo
            e.HasIndex(m => new { m.GrupoConfianzaId, m.UsuarioId }).IsUnique();
            
            e.Property(m => m.Estado).HasConversion<string>();

            e.HasOne(m => m.GrupoConfianza)
             .WithMany(g => g.Miembros)
             .HasForeignKey(m => m.GrupoConfianzaId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(m => m.Usuario)
             .WithMany()
             .HasForeignKey(m => m.UsuarioId)
             .OnDelete(DeleteBehavior.Restrict);
        });
    }
}


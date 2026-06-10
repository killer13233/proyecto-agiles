using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using MicroservicioA.Data;
using MicroservicioA.Services;

var builder = WebApplication.CreateBuilder(args);

// ─────────────────────────────────────────────────────────────
// BASE DE DATOS
// ─────────────────────────────────────────────────────────────
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection"))
);

// ─────────────────────────────────────────────────────────────
// JWT AUTH
// ─────────────────────────────────────────────────────────────
var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("Jwt:Key no configurado");

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,

            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],

            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddAuthorization();

// ─────────────────────────────────────────────────────────────
// SERVICES
// ─────────────────────────────────────────────────────────────
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUsuarioService, UsuarioService>();
builder.Services.AddScoped<IGrupoConfianzaService, GrupoConfianzaService>();
builder.Services.AddHttpClient();

// ─────────────────────────────────────────────────────────────
// CORS
// ─────────────────────────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("UtaPolicy", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// ─────────────────────────────────────────────────────────────
// CONTROLLERS
// ─────────────────────────────────────────────────────────────
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// ─────────────────────────────────────────────────────────────
// SWAGGER + JWT AUTH BUTTON 🔒
/*
    ESTE ES EL BLOQUE QUE TE FALTABA BIEN HECHO
*/
// ─────────────────────────────────────────────────────────────
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "MicroservicioA",   // ← debe coincidir exactamente con lo del JSON
        Version = "v1"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name         = "Authorization",
        Type         = SecuritySchemeType.Http,
        Scheme       = "bearer",
        BearerFormat = "JWT",
        In           = ParameterLocation.Header,
        Description  = "Escribe tu token JWT aquí"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id   = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// ─────────────────────────────────────────────────────────────
// BUILD APP
// ─────────────────────────────────────────────────────────────
var app = builder.Build();

// ─────────────────────────────────────────────────────────────
// SWAGGER PIPELINE
// ─────────────────────────────────────────────────────────────
app.UseSwagger();

app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Microservicio A v1");
});

// ─────────────────────────────────────────────────────────────
// DB SEEDER
// ─────────────────────────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();

    // Agregar columna MotivoDesactivacion si no existe (migración manual sin delete)
    try { db.Database.ExecuteSqlRaw("SELECT MotivoDesactivacion FROM Usuarios"); }
    catch { db.Database.ExecuteSqlRaw("ALTER TABLE Usuarios ADD MotivoDesactivacion nvarchar(max) NULL"); }

    try { db.Database.ExecuteSqlRaw("SELECT Estado FROM MiembrosGrupoConfianza"); }
    catch { Console.WriteLine("[DB] Se requiere recrear la base de datos. Ejecuta: docker compose down -v && docker compose up -d"); }

    await DbSeeder.SeedAsync(db);
}

// ─────────────────────────────────────────────────────────────
// MIDDLEWARE
// ─────────────────────────────────────────────────────────────
app.UseCors("UtaPolicy");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// ─────────────────────────────────────────────────────────────
// RUN
// ─────────────────────────────────────────────────────────────
app.Run();
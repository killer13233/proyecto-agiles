using Microsoft.EntityFrameworkCore;
using MicroservicioC.Data;
using MicroservicioC.Services;

var builder = WebApplication.CreateBuilder(args);

// DB
builder.Services.AddDbContext<ZonaDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection"))
);

// Services
builder.Services.AddScoped<IGeoService, GeoService>();

// CORS
builder.Services.AddCors(options =>
    options.AddPolicy("UtaPolicy", policy =>
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader()));

// Controllers + Swagger
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Swagger
app.UseSwagger();
app.UseSwaggerUI();

// Crear DB automáticamente
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ZonaDbContext>();
    db.Database.EnsureCreated();
}

// Middleware
app.UseCors("UtaPolicy");

app.MapControllers();

app.Run();
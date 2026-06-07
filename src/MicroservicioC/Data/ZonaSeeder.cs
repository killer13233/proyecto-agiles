using System.Text.Json;
using MicroservicioC.Models;
using MicroservicioC.Services;
using Microsoft.EntityFrameworkCore;

namespace MicroservicioC.Data;

public static class ZonaSeeder
{
    private static readonly CameraGeoData[] CamarasData = [
        new("FCHE", "Norte-Oeste", "FCHE - Norte-Oeste - CAM-01", -78.6252106, -1.2682855),
        new("FCHE", "Norte-Oeste", "FCHE - Norte-Oeste - CAM-02", -78.625413, -1.2680244),
        new("FCHE", "Norte-Oeste", "FCHE - Norte-Oeste - CAM-03", -78.6254979, -1.2677763),
        new("FCHE", "Norte-Oeste", "FCHE - Norte-Oeste - CAM-04", -78.6250196, -1.2682268),
        new("FAD", "Norte-Centro", "FAD - Norte-Centro - CAM-01", -78.6251454, -1.267876),
        new("FAD", "Norte-Centro", "FAD - Norte-Centro - CAM-02", -78.6252296, -1.2676234),
        new("FAD", "Norte-Centro", "FAD - Norte-Centro - CAM-03", -78.6255344, -1.2675954),
        new("FAD", "Norte-Centro", "FAD - Norte-Centro - CAM-04", -78.6252818, -1.2675032),
        new("FAD", "Norte-Centro", "FAD - Norte-Centro - CAM-05", -78.6254542, -1.267407),
        new("FAD", "Norte-Centro", "FAD - Norte-Centro - CAM-06", -78.6254502, -1.2671865),
        new("FAD", "Norte-Centro", "FAD - Norte-Centro - CAM-07", -78.6254061, -1.2671624),
        new("FIBA", "Norte-Este", "FIBA - Norte-Este - CAM-01", -78.6252123, -1.2674156),
        new("FIBA", "Norte-Este", "FIBA - Norte-Este - CAM-02", -78.6249674, -1.2673246),
        new("FIBA", "Norte-Este", "FIBA - Norte-Este - CAM-03", -78.6250396, -1.2670453),
        new("FIBA", "Norte-Este", "FIBA - Norte-Este - CAM-04", -78.6252813, -1.2671363),
        new("FJ", "Centro-Norte", "FJ - Centro-Norte - CAM-01", -78.6250239, -1.2669291),
        new("FJ", "Centro-Norte", "FJ - Centro-Norte - CAM-02", -78.6249831, -1.2667628),
        new("FJ", "Centro-Norte", "FJ - Centro-Norte - CAM-03", -78.6250113, -1.2665745),
        new("FJ", "Centro-Norte", "FJ - Centro-Norte - CAM-04", -78.6252562, -1.2665243),
        new("FJ", "Centro-Norte", "FJ - Centro-Norte - CAM-05", -78.6253159, -1.2667753),
        new("FJ", "Centro-Norte", "FJ - Centro-Norte - CAM-06", -78.6253598, -1.2666059),
        new("FJ", "Centro-Norte", "FJ - Centro-Norte - CAM-07", -78.6253943, -1.2666875),
        new("FJ", "Centro-Norte", "FJ - Centro-Norte - CAM-08", -78.625093, -1.2668569),
        new("FAL", "Centro-Oeste", "FAL - Centro-Oeste - CAM-01", -78.624729, -1.2669733),
        new("FAL", "Centro-Oeste", "FAL - Centro-Oeste - CAM-02", -78.6246714, -1.2672442),
        new("FAL", "Centro-Oeste", "FAL - Centro-Oeste - CAM-03", -78.624536, -1.2669122),
        new("FAL", "Centro-Oeste", "FAL - Centro-Oeste - CAM-04", -78.6245518, -1.2668396),
        new("FAL", "Centro-Oeste", "FAL - Centro-Oeste - CAM-05", -78.6245045, -1.2667955),
        new("FAL", "Centro-Oeste", "FAL - Centro-Oeste - CAM-06", -78.6244287, -1.2671932),
        new("FAL", "Centro-Oeste", "FAL - Centro-Oeste - CAM-07", -78.6245108, -1.2667386),
        new("FICM", "Centro", "FICM - Centro - CAM-01", -78.6244761, -1.2667008),
        new("FICM", "Centro", "FICM - Centro - CAM-02", -78.6244887, -1.266625),
        new("FICM", "Centro", "FICM - Centro - CAM-03", -78.6242456, -1.2665587),
        new("FICM", "Centro", "FICM - Centro - CAM-04", -78.624233, -1.2666376),
        new("FICM", "Centro", "FICM - Centro - CAM-05", -78.6242199, -1.2666721),
        new("FICM", "Centro", "FICM - Centro - CAM-06", -78.6243919, -1.2667239),
        new("FICM", "Centro", "FICM - Centro - CAM-07", -78.6243264, -1.2669887),
        new("FICM", "Centro", "FICM - Centro - CAM-08", -78.6244219, -1.2669996),
        new("FICM", "Centro", "FICM - Centro - CAM-09", -78.6242145, -1.2668331),
        new("FICM", "Centro", "FICM - Centro - CAM-10", -78.6241954, -1.2669423),
        new("FICM", "Centro", "FICM - Centro - CAM-11", -78.623936, -1.266653),
        new("FICM", "Centro", "FICM - Centro - CAM-12", -78.623977, -1.2665739),
        new("FICM", "Centro", "FICM - Centro - CAM-13", -78.624209, -1.2667703),
        new("FICM", "Centro", "FICM - Centro - CAM-14", -78.6238378, -1.266713),
        new("FICM", "Centro", "FICM - Centro - CAM-15", -78.6237941, -1.2668195),
        new("FICM", "Centro", "FICM - Centro - CAM-16", -78.6237206, -1.26652),
        new("FCA", "Centro-Sur", "FCA - Centro-Sur - CAM-01", -78.6241473, -1.2670721),
        new("FCA", "Centro-Sur", "FCA - Centro-Sur - CAM-02", -78.6241097, -1.2672099),
        new("FCA", "Centro-Sur", "FCA - Centro-Sur - CAM-03", -78.6239819, -1.2669888),
        new("FCA", "Centro-Sur", "FCA - Centro-Sur - CAM-04", -78.6239329, -1.2671552),
        new("FCA", "Centro-Sur", "FCA - Centro-Sur - CAM-05", -78.6238132, -1.2671426),
        new("FCA", "Centro-Sur", "FCA - Centro-Sur - CAM-06", -78.6237928, -1.2672222),
        new("FCA", "Centro-Sur", "FCA - Centro-Sur - CAM-07", -78.6239922, -1.2673465),
        new("FCA", "Centro-Sur", "FCA - Centro-Sur - CAM-08", -78.6238201, -1.2673012),
        new("FCA", "Centro-Sur", "FCA - Centro-Sur - CAM-09", -78.6236166, -1.2673689),
        new("FCA", "Centro-Sur", "FCA - Centro-Sur - CAM-10", -78.6236419, -1.2673014),
        new("FCA", "Centro-Sur", "FCA - Centro-Sur - CAM-11", -78.6237825, -1.267437),
        new("FCA", "Centro-Sur", "FCA - Centro-Sur - CAM-12", -78.6240264, -1.2672752),
        new("FCA", "Centro-Sur", "FCA - Centro-Sur - CAM-13", -78.6242788, -1.2673409),
        new("FCA", "Centro-Sur", "FCA - Centro-Sur - CAM-14", -78.6244257, -1.267417),
        new("FISEI", "Bloque 2 Inf-Este", "FISEI - Bloque 2 Inf-Este - CAM-01", -78.6242069, -1.2675848),
        new("FISEI", "Bloque 2 Inf-Oeste", "FISEI - Bloque 2 Inf-Oeste - CAM-02", -78.6243246, -1.2676261),
        new("FJCS", "Centro-Sur", "FJCS - Centro-Sur - CAM-03", -78.6239677, -1.2676436),
        new("FJCS", "Centro-Sur", "FJCS - Centro-Sur - CAM-04", -78.6240246, -1.2674993),
        new("FISEI", "Bloque 1 Inf-Oeste", "FISEI - Bloque 1 Inf-Oeste - CAM-05", -78.6243005, -1.2680573),
        new("FISEI", "Bloque 1 Sup-Oeste", "FISEI - Bloque 1 Sup-Oeste - CAM-06", -78.6241629, -1.2676936),
        new("FISEI", "Bloque 1 Inf-Este", "FISEI - Bloque 1 Inf-Este - CAM-07", -78.6240582, -1.2679687),
        new("FISEI", "Bloque 1 Sup-Este", "FISEI - Bloque 1 Sup-Este - CAM-08", -78.6244154, -1.2677843),
        new("FJCS", "Centro-Sur", "FJCS - Centro-Sur - CAM-09", -78.624935, -1.2679439),
        new("FJCS", "Centro-Sur", "FJCS - Centro-Sur - CAM-10", -78.6248351, -1.2681132),
        new("FJCS", "Centro-Sur", "FJCS - Centro-Sur - CAM-11", -78.6246409, -1.2679678),
        new("FJCS", "Centro-Sur", "FJCS - Centro-Sur - CAM-12", -78.6245957, -1.2680425),
        new("FISEI", "Bloque 2 Sup-Este", "FISEI - Bloque 2 Sup-Este - CAM-13", -78.624424, -1.2679682),
        new("FISEI", "Bloque 2 Sup-Oeste", "FISEI - Bloque 2 Sup-Oeste - CAM-14", -78.624667, -1.2678029),
        new("FJCS", "Sur-Este", "FJCS - Sur-Este - CAM-15", -78.6249795, -1.2691231),
        new("CANCHA_SINTETICA_NO", "Centro-Oeste", "CANCHA_SINTETICA_NO - Centro-Oeste - CAM-01", -78.62352, -1.2670541),
        new("CANCHA_SINTETICA_NO", "Centro-Oeste", "CANCHA_SINTETICA_NO - Centro-Oeste - CAM-02", -78.6235001, -1.2671368),
        new("CANCHA_SINTETICA_NO", "Centro-Oeste", "CANCHA_SINTETICA_NO - Centro-Oeste - CAM-03", -78.6234588, -1.2671811),
        new("CANCHA_SINTETICA_NO", "Centro-Oeste", "CANCHA_SINTETICA_NO - Centro-Oeste - CAM-04", -78.6234986, -1.267236),
        new("CANCHA_SINTETICA_NO", "Centro-Oeste", "CANCHA_SINTETICA_NO - Centro-Oeste - CAM-05", -78.6234557, -1.2673285),
        new("CANCHA_SINTETICA_NO", "Centro-Oeste", "CANCHA_SINTETICA_NO - Centro-Oeste - CAM-06", -78.6235335, -1.2674292),
        new("CANCHA_SINTETICA_NO", "Oeste", "CANCHA_SINTETICA_NO - Oeste - CAM-07", -78.6237432, -1.2675691),
        new("CANCHA_SINTETICA_NO", "Oeste", "CANCHA_SINTETICA_NO - Oeste - CAM-08", -78.6237282, -1.2679017),
        new("CANCHA_SINTETICA_NO", "Oeste", "CANCHA_SINTETICA_NO - Oeste - CAM-09", -78.6238669, -1.2679206),
        new("CANCHA_SINTETICA_NO", "Oeste", "CANCHA_SINTETICA_NO - Oeste - CAM-10", -78.6236093, -1.2678352),
        new("CANCHA_SINTETICA_NO", "Oeste", "CANCHA_SINTETICA_NO - Oeste - CAM-11", -78.6235869, -1.2679102),
        new("CANCHA_SINTETICA_NO", "Oeste", "CANCHA_SINTETICA_NO - Oeste - CAM-12", -78.6234911, -1.2678578),
        new("CANCHA_SINTETICA_NO", "Oeste", "CANCHA_SINTETICA_NO - Oeste - CAM-13", -78.6235837, -1.2676566),
        new("CANCHA_SINTETICA_NO", "Oeste", "CANCHA_SINTETICA_NO - Oeste - CAM-14", -78.6234617, -1.2677295),
        new("CANCHA_SINTETICA_NO", "Oeste", "CANCHA_SINTETICA_NO - Oeste - CAM-15", -78.62339, -1.2685675),
        new("CANCHA_SINTETICA_NO", "Oeste", "CANCHA_SINTETICA_NO - Oeste - CAM-16", -78.6234052, -1.2680885),
        new("CANCHA_SINTETICA_NO", "Oeste", "CANCHA_SINTETICA_NO - Oeste - CAM-17", -78.6237519, -1.2682556),
        new("CANCHA_SINTETICA_S", "Sur-Centro", "CANCHA_SINTETICA_S - Sur-Centro - CAM-01", -78.6240121, -1.2683916),
        new("CANCHA_SINTETICA_S", "Sur-Centro", "CANCHA_SINTETICA_S - Sur-Centro - CAM-02", -78.6245915, -1.2685335),
        new("CANCHA_SINTETICA_S", "Sur-Centro", "CANCHA_SINTETICA_S - Sur-Centro - CAM-03", -78.6245874, -1.2682986),
        new("CANCHA_SINTETICA_S", "Sur-Centro", "CANCHA_SINTETICA_S - Sur-Centro - CAM-04", -78.6244054, -1.2682955),
        new("CANCHA_SINTETICA_S", "Sur-Centro", "CANCHA_SINTETICA_S - Sur-Centro - CAM-05", -78.6247329, -1.2685621),
        new("CANCHA_SINTETICA_S", "Sur-Centro", "CANCHA_SINTETICA_S - Sur-Centro - CAM-06", -78.6248063, -1.268767),
        new("CANCHA_SINTETICA_S", "Sur-Centro", "CANCHA_SINTETICA_S - Sur-Centro - CAM-07", -78.6244249, -1.2688074),
        new("CANCHA_SINTETICA_S", "Sur-Centro", "CANCHA_SINTETICA_S - Sur-Centro - CAM-08", -78.6241886, -1.268425),
        new("CANCHA_SINTETICA_S", "Sur-Centro", "CANCHA_SINTETICA_S - Sur-Centro - CAM-09", -78.6241456, -1.2687057),
        new("CANCHA_SINTETICA_S", "Sur-Centro", "CANCHA_SINTETICA_S - Sur-Centro - CAM-10", -78.6240611, -1.268664),
        new("CANCHA_SINTETICA_S", "Sur-Centro", "CANCHA_SINTETICA_S - Sur-Centro - CAM-11", -78.6239149, -1.2686361),
        new("CANCHA_SINTETICA_S", "Sur-Centro", "CANCHA_SINTETICA_S - Sur-Centro - CAM-12", -78.624459, -1.2684643),
        new("CANCHA_SINTETICA_S", "Sur-Centro", "CANCHA_SINTETICA_S - Sur-Centro - CAM-23", -78.6240174, -1.2692124),
        new("CANCHA_SINTETICA_S", "Sur-Centro", "CANCHA_SINTETICA_S - Sur-Centro - CAM-24", -78.6242357, -1.2693208),
        new("CANCHA_SINTETICA_S", "Sur-Centro", "CANCHA_SINTETICA_S - Sur-Centro - CAM-27", -78.6241252, -1.2696235),
        new("CANCHA_SINTETICA_S", "Sur-Centro", "CANCHA_SINTETICA_S - Sur-Centro - CAM-28", -78.6239334, -1.2695533),
        new("CANCHA_SINTETICA_S", "Sur-Este", "CANCHA_SINTETICA_S - Sur-Este - CAM-13", -78.6247301, -1.2689543),
        new("CANCHA_SINTETICA_S", "Sur-Este", "CANCHA_SINTETICA_S - Sur-Este - CAM-14", -78.6246615, -1.2690914),
        new("CANCHA_SINTETICA_S", "Sur-Este", "CANCHA_SINTETICA_S - Sur-Este - CAM-15", -78.6246385, -1.2692565),
        new("CANCHA_SINTETICA_S", "Sur-Este", "CANCHA_SINTETICA_S - Sur-Este - CAM-16", -78.6244092, -1.2691705),
        new("CANCHA_SINTETICA_S", "Sur-Este", "CANCHA_SINTETICA_S - Sur-Este - CAM-17", -78.6244708, -1.2689653),
        new("CANCHA_SINTETICA_S", "Sur-Este", "CANCHA_SINTETICA_S - Sur-Este - CAM-25", -78.6245685, -1.2694476),
        new("CANCHA_SINTETICA_S", "Sur-Este", "CANCHA_SINTETICA_S - Sur-Este - CAM-26", -78.6244833, -1.2697325),
        new("CANCHA_SINTETICA_S", "Sur-Este", "CANCHA_SINTETICA_S - Sur-Este - CAM-33", -78.6251925, -1.2697228),
        new("CANCHA_SINTETICA_S", "Sur-Oeste", "CANCHA_SINTETICA_S - Sur-Oeste - CAM-18", -78.6240845, -1.2688107),
        new("CANCHA_SINTETICA_S", "Sur-Oeste", "CANCHA_SINTETICA_S - Sur-Oeste - CAM-19", -78.623851, -1.2687462),
        new("CANCHA_SINTETICA_S", "Sur-Oeste", "CANCHA_SINTETICA_S - Sur-Oeste - CAM-20", -78.6236636, -1.268661),
        new("CANCHA_SINTETICA_S", "Sur-Oeste", "CANCHA_SINTETICA_S - Sur-Oeste - CAM-21", -78.6234002, -1.2689585),
        new("CANCHA_SINTETICA_S", "Sur-Oeste", "CANCHA_SINTETICA_S - Sur-Oeste - CAM-22", -78.6236667, -1.26906),
        new("CANCHA_SINTETICA_S", "Sur-Oeste", "CANCHA_SINTETICA_S - Sur-Oeste - CAM-29", -78.6236121, -1.269264),
        new("CANCHA_SINTETICA_S", "Sur-Oeste", "CANCHA_SINTETICA_S - Sur-Oeste - CAM-30", -78.6236024, -1.2693913),
        new("CANCHA_SINTETICA_S", "Sur-Oeste", "CANCHA_SINTETICA_S - Sur-Oeste - CAM-31", -78.6237973, -1.2694821),
        new("CANCHA_SINTETICA_S", "Sur-Oeste", "CANCHA_SINTETICA_S - Sur-Oeste - CAM-32", -78.6233837, -1.2691074),
        new("FCHE", "Norte-Oeste", "FCHE - Norte-Oeste - CAM-05", -78.6250988, -1.2684745),
        new("FCHE", "Norte-Oeste", "FCHE - Norte-Oeste - CAM-06", -78.6258944, -1.2686116),
        new("FCHE", "Norte-Oeste", "FCHE - Norte-Oeste - CAM-07", -78.6257428, -1.2681783),
        new("FJ", "Norte-Centro", "FJ - Norte-Centro - CAM-09", -78.6248269, -1.2664199),
        new("FAL", "Centro-Oeste", "FAL - Centro-Oeste - CAM-08", -78.6247901, -1.267456),
        new("SUR_PERIFERICO", "Sur-Este extremo", "SUR_PERIFERICO - Sur-Este extremo - CAM-01", -78.6263692, -1.2704236),
        new("SUR_PERIFERICO", "Sur-Este extremo", "SUR_PERIFERICO - Sur-Este extremo - CAM-02", -78.6261659, -1.2695821),
        new("SUR_PERIFERICO", "Sur-Este", "SUR_PERIFERICO - Sur-Este - CAM-03", -78.6259949, -1.2688428),
        new("SUR_PERIFERICO", "Sur-Este", "SUR_PERIFERICO - Sur-Este - CAM-04", -78.6254889, -1.2688861),
        new("SUR_PERIFERICO", "Sur", "SUR_PERIFERICO - Sur - CAM-05", -78.6254746, -1.270406),
        new("SUR_PERIFERICO", "Sur", "SUR_PERIFERICO - Sur - CAM-06", -78.6253033, -1.270564),
        new("SUR_PERIFERICO", "Sur", "SUR_PERIFERICO - Sur - CAM-07", -78.6246844, -1.2706413),
        new("SUR_PERIFERICO", "Sur", "SUR_PERIFERICO - Sur - CAM-08", -78.6258629, -1.2704529),
        new("SUR_PERIFERICO", "Sur", "SUR_PERIFERICO - Sur - CAM-09", -78.6249906, -1.2702351),
        new("SUR_PERIFERICO", "Sur", "SUR_PERIFERICO - Sur - CAM-10", -78.6247898, -1.270016),
        new("SUR_PERIFERICO", "Sur", "SUR_PERIFERICO - Sur - CAM-11", -78.6243695, -1.2705485),
        new("SUR_PERIFERICO", "Sur", "SUR_PERIFERICO - Sur - CAM-12", -78.6242544, -1.2707162),
        new("SUR_PERIFERICO", "Sur", "SUR_PERIFERICO - Sur - CAM-13", -78.6244821, -1.269897),
        new("SUR_PERIFERICO", "Sur", "SUR_PERIFERICO - Sur - CAM-14", -78.6245575, -1.2700859),
        new("SUR_PERIFERICO", "Sur", "SUR_PERIFERICO - Sur - CAM-15", -78.6247109, -1.2703118),
        new("SUR_PERIFERICO", "Sur", "SUR_PERIFERICO - Sur - CAM-16", -78.6249257, -1.2694814),
        new("SUR_PERIFERICO", "Sur", "SUR_PERIFERICO - Sur - CAM-17", -78.6250357, -1.2698715),
        new("SUR_PERIFERICO", "Sur", "SUR_PERIFERICO - Sur - CAM-18", -78.6248371, -1.2704326),
        new("SUR_PERIFERICO", "Sur", "SUR_PERIFERICO - Sur - CAM-19", -78.6246601, -1.2704642),
        new("SUR_PERIFERICO", "Sur-Oeste", "SUR_PERIFERICO - Sur-Oeste - CAM-20", -78.6242941, -1.2704022),
        new("SUR_PERIFERICO", "Sur-Oeste", "SUR_PERIFERICO - Sur-Oeste - CAM-21", -78.6241255, -1.2705354),
        new("SUR_PERIFERICO", "Sur-Oeste", "SUR_PERIFERICO - Sur-Oeste - CAM-22", -78.6243711, -1.270137),
        new("SUR_PERIFERICO", "Sur-Oeste", "SUR_PERIFERICO - Sur-Oeste - CAM-23", -78.6242149, -1.2698084),
        new("SUR_PERIFERICO", "Sur-Oeste", "SUR_PERIFERICO - Sur-Oeste - CAM-24", -78.6239537, -1.2698461),
        new("SUR_PERIFERICO", "Sur-Oeste", "SUR_PERIFERICO - Sur-Oeste - CAM-25", -78.6235374, -1.2694819),
        new("SUR_PERIFERICO", "Sur-Oeste", "SUR_PERIFERICO - Sur-Oeste - CAM-26", -78.6238431, -1.2696257),
        new("SUR_PERIFERICO", "Sur-Oeste", "SUR_PERIFERICO - Sur-Oeste - CAM-27", -78.6236039, -1.2696906),
        new("SUR_PERIFERICO", "Sur-Oeste", "SUR_PERIFERICO - Sur-Oeste - CAM-28", -78.6239676, -1.2701953),
        new("SUR_PERIFERICO", "Sur-Oeste", "SUR_PERIFERICO - Sur-Oeste - CAM-29", -78.6238271, -1.2703548),
        new("SUR_PERIFERICO", "Sur-Oeste", "SUR_PERIFERICO - Sur-Oeste - CAM-30", -78.6237695, -1.2706634),
        new("SUR_PERIFERICO", "Sur-Oeste", "SUR_PERIFERICO - Sur-Oeste - CAM-31", -78.6237128, -1.2708169),
        new("SUR_PERIFERICO", "Sur-Oeste", "SUR_PERIFERICO - Sur-Oeste - CAM-32", -78.6236021, -1.270215),
        new("SUR_PERIFERICO", "Sur-Oeste", "SUR_PERIFERICO - Sur-Oeste - CAM-39", -78.6235091, -1.2706925),
        new("SUR_PERIFERICO", "Sur-Oeste", "SUR_PERIFERICO - Sur-Oeste - CAM-40", -78.6234443, -1.2704954),
        new("SUR_PERIFERICO", "Sur-Oeste extremo", "SUR_PERIFERICO - Sur-Oeste extremo - CAM-33", -78.6233754, -1.2708293),
        new("SUR_PERIFERICO", "Sur-Oeste extremo", "SUR_PERIFERICO - Sur-Oeste extremo - CAM-34", -78.6228185, -1.2708735),
        new("SUR_PERIFERICO", "Sur-Oeste extremo", "SUR_PERIFERICO - Sur-Oeste extremo - CAM-35", -78.623066, -1.2703228),
        new("SUR_PERIFERICO", "Sur-Oeste extremo", "SUR_PERIFERICO - Sur-Oeste extremo - CAM-36", -78.6224907, -1.2703271),
        new("SUR_PERIFERICO", "Sur-Oeste extremo", "SUR_PERIFERICO - Sur-Oeste extremo - CAM-37", -78.622338, -1.2709853),
        new("SUR_PERIFERICO", "Sur-Oeste extremo", "SUR_PERIFERICO - Sur-Oeste extremo - CAM-38", -78.6224014, -1.2705886),
    ];

    private record CameraGeoData(string Facultad, string Posicion, string Nombre, double Longitud, double Latitud);

    public static async Task SeedAsync(ZonaDbContext db)
    {
        try 
        {
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

        // Insertar/verificar zonas
        foreach (var (nombre, color, poligono) in zonasBase)
        {
            if (!await db.Zonas.AnyAsync(z => z.Nombre == nombre))
            {
                db.Zonas.Add(new Zona
                {
                    Nombre      = nombre,
                    Descripcion = $"Zona {nombre} del campus UTA Huachi",
                    Color       = color,
                    Estado      = "Activa",
                    Poligono    = poligono
                });
            }
        }

        await db.SaveChangesAsync();
        Console.WriteLine("[ZonaSeeder] ✓ Zonas base verificadas.");

        // ── Limpiar cámaras obsoletas (nombres que ya no están en seed) ──
        var nombresSeed = CamarasData.Select(c => c.Nombre).ToHashSet();
        var camarasObsoletas = await db.Camaras
            .Where(c => c.Facultad == "FISEI" || c.Facultad == "FJCS")
            .ToListAsync();
        camarasObsoletas = camarasObsoletas.Where(c => !nombresSeed.Contains(c.Nombre)).ToList();
        if (camarasObsoletas.Any())
        {
            db.Camaras.RemoveRange(camarasObsoletas);
            await db.SaveChangesAsync();
            Console.WriteLine($"[ZonaSeeder] ✓ Eliminadas {camarasObsoletas.Count} cámaras obsoletas.");
        }

        // ── Insertar cámaras ───────────────────────────────────────────
        var zonas = await db.Zonas.ToListAsync();
        int camarasInsertadas = 0;

        foreach (var cam in CamarasData)
        {
            if (await db.Camaras.AnyAsync(c => c.Nombre == cam.Nombre))
                continue;

            // Asignar ZonaId por point-in-polygon
            int? zonaId = null;
            foreach (var zona in zonas)
            {
                try
                {
                    var vertices = JsonSerializer.Deserialize<double[][]>(zona.Poligono);
                    if (vertices is null || vertices.Length < 3) continue;
                    if (GeoService.PuntoEnPoligono(cam.Latitud, cam.Longitud, vertices))
                    {
                        zonaId = zona.Id;
                        break;
                    }
                }
                catch { }
            }

            db.Camaras.Add(new Camara
            {
                Nombre    = cam.Nombre,
                Facultad  = cam.Facultad,
                Posicion  = cam.Posicion,
                Latitud   = cam.Latitud,
                Longitud  = cam.Longitud,
                ZonaId    = zonaId
            });
            camarasInsertadas++;
        }

        if (camarasInsertadas > 0)
        {
            await db.SaveChangesAsync();
            Console.WriteLine($"[ZonaSeeder] ✓ Insertadas {camarasInsertadas} cámaras.");
        }
        else
        {
            Console.WriteLine("[ZonaSeeder] ✓ Cámaras ya estaban insertadas.");
        }
    }
}

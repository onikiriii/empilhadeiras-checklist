using Checklist.Api.Models;

namespace Checklist.Api.Support;

public static class AccessModuleCatalog
{
    public const string SupervisaoOperacional = "supervisao-operacional";
    public const string SegurancaTrabalho = "seguranca-trabalho";
    public const string InspecaoMateriais = "inspecao-materiais";

    public static string ToCode(ModuloAcesso modulo)
    {
        return modulo switch
        {
            ModuloAcesso.SupervisaoOperacional => SupervisaoOperacional,
            ModuloAcesso.SegurancaTrabalho => SegurancaTrabalho,
            ModuloAcesso.InspecaoMateriais => InspecaoMateriais,
            _ => throw new ArgumentOutOfRangeException(nameof(modulo), modulo, "Modulo de acesso nao mapeado.")
        };
    }

    public static IReadOnlyList<string> ToCodes(IEnumerable<UsuarioSupervisorModulo> modulos)
    {
        return modulos
            .Select(x => ToCode(x.Modulo))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(x => x)
            .ToList();
    }
}

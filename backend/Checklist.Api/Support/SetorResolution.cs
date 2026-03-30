using Checklist.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Checklist.Api.Support;

public static class SetorResolution
{
    public static async Task<(Guid? SetorId, string? Error)> ResolveSetorIdAsync(
        AppDbContext db,
        Guid? requestedSetorId,
        CancellationToken cancellationToken = default)
    {
        if (requestedSetorId is Guid setorId && setorId != Guid.Empty)
        {
            var exists = await db.Setores
                .AsNoTracking()
                .AnyAsync(x => x.Id == setorId && x.Ativo, cancellationToken);

            return exists
                ? (setorId, null)
                : (null, "Setor inválido ou inativo.");
        }

        var setoresAtivos = await db.Setores
            .AsNoTracking()
            .Where(x => x.Ativo)
            .OrderBy(x => x.CriadoEm)
            .Select(x => x.Id)
            .Take(2)
            .ToListAsync(cancellationToken);

        return setoresAtivos.Count switch
        {
            1 => (setoresAtivos[0], null),
            0 => (null, "Nenhum setor ativo está cadastrado."),
            _ => (null, "SetorId é obrigatório enquanto houver mais de um setor ativo.")
        };
    }
}

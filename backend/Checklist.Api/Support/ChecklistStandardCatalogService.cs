using Checklist.Api.Data;
using Checklist.Api.Models;
using Microsoft.EntityFrameworkCore;
using MySql.Data.MySqlClient;

namespace Checklist.Api.Support;

public class ChecklistStandardCatalogService
{
    private readonly AppDbContext _db;

    public ChecklistStandardCatalogService(AppDbContext db)
    {
        _db = db;
    }

    public async Task EnsureDefaultsForAllSetoresAsync()
    {
        var setorIds = await _db.Setores.AsNoTracking().Select(x => x.Id).ToListAsync();

        foreach (var setorId in setorIds)
            await EnsureDefaultsForSetorAsync(setorId);
    }

    public async Task EnsureDefaultsForSetorAsync(Guid setorId)
    {
        var categorias = await _db.CategoriasEquipamento
            .Include(x => x.ChecklistItensTemplate)
            .Where(x => x.SetorId == setorId)
            .ToListAsync();

        foreach (var definition in Definitions)
        {
            var categoria = categorias.FirstOrDefault(x => x.ModeloFechamentoMensal == definition.Modelo)
                ?? categorias.FirstOrDefault(x => string.Equals(x.Nome, definition.Nome, StringComparison.OrdinalIgnoreCase));

            if (categoria is null)
            {
                categoria = new CategoriaEquipamento
                {
                    SetorId = setorId,
                    Nome = definition.Nome,
                    Ativa = true,
                    ModeloFechamentoMensal = definition.Modelo
                };

                _db.CategoriasEquipamento.Add(categoria);
                categorias.Add(categoria);

                try
                {
                    await _db.SaveChangesAsync();
                }
                catch (DbUpdateException ex) when (ex.InnerException is MySqlException { Number: 1062 })
                {
                    _db.Entry(categoria).State = EntityState.Detached;
                    categorias.Remove(categoria);

                    categoria = await _db.CategoriasEquipamento
                        .Include(x => x.ChecklistItensTemplate)
                        .FirstOrDefaultAsync(x => x.SetorId == setorId && x.Nome == definition.Nome);

                    if (categoria is null)
                        throw;

                    categorias.Add(categoria);
                }
            }
            else if (categoria.ModeloFechamentoMensal == FechamentoMensalModelo.Nenhum)
            {
                categoria.ModeloFechamentoMensal = definition.Modelo;
                await _db.SaveChangesAsync();
            }

            var existingOrders = categoria.ChecklistItensTemplate
                .Select(x => x.Ordem)
                .ToHashSet();

            foreach (var itemDefinition in definition.Itens.Where(x => !existingOrders.Contains(x.Ordem)))
            {
                var item = new ChecklistItemTemplate
                {
                    SetorId = setorId,
                    CategoriaId = categoria.Id,
                    Ordem = itemDefinition.Ordem,
                    Descricao = itemDefinition.Descricao,
                    Ativo = true
                };

                categoria.ChecklistItensTemplate.Add(item);
                _db.ChecklistItensTemplate.Add(item);
            }
        }

        await _db.SaveChangesAsync();
    }

    private static readonly StandardCategoryDefinition[] Definitions =
    [
        new(
            "Empilhadeira a Combustao",
            FechamentoMensalModelo.EmpilhadeiraCombustao,
            [
                new(1, "Pneus (dianteiro e traseiro) estao em bom estado?"),
                new(2, "Equipamento esta sem vazamento?"),
                new(3, "Comandos hidraulicos da maquina estao funcionando?"),
                new(4, "Nivel de oleo do motor esta adequado?"),
                new(5, "Nivel da agua do radiador esta adequado?"),
                new(6, "Nivel de Oleo Hidraulico esta adequado?"),
                new(7, "Direcao encontra-se em condicoes de uso?"),
                new(8, "Freio esta regulado?"),
                new(9, "Extintor encontra-se fixo no equipamento ?"),
                new(10, "Farois estao funcionando?"),
                new(11, "Sistema sonoro de re esta funcionando?"),
                new(12, "Buzina em perfeito estado de funcionamento?"),
                new(13, "Garfos estao em bom estado?")
            ]),
        new(
            "Empilhadeira Eletrica",
            FechamentoMensalModelo.EmpilhadeiraEletrica,
            [
                new(1, "Rodas (dianteira e traseira) estao em bom estado?"),
                new(2, "Bateria esta funcionando normalmente?"),
                new(3, "Existe oxidacao na bateria?"),
                new(4, "Nivel de oleo do motor esta adequado?"),
                new(5, "Nivel da agua do radiador esta adequado?"),
                new(6, "Nivel de Oleo Hidraulico esta adequado?"),
                new(7, "Direcao encontra-se em condicoes de uso?"),
                new(8, "Freio esta regulado?"),
                new(9, "Extintor encontra-se fixo no equipamento ?"),
                new(10, "Farois estao funcionando?"),
                new(11, "Sistema sonoro de re esta funcionando?"),
                new(12, "Buzina em perfeito estado de funcionamento?"),
                new(13, "Garfos estao em bom estado?")
            ])
    ];

    private sealed record StandardCategoryDefinition(
        string Nome,
        FechamentoMensalModelo Modelo,
        IReadOnlyList<StandardChecklistItemDefinition> Itens);

    private sealed record StandardChecklistItemDefinition(
        int Ordem,
        string Descricao);
}

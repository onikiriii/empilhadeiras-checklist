using Checklist.Api.Data;
using Checklist.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Checklist.Api.Support;

public class StpAreaTemplateCatalogService
{
    private readonly AppDbContext _db;

    public StpAreaTemplateCatalogService(AppDbContext db)
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
        var existingTemplate = await _db.StpAreaChecklistTemplates
            .Include(x => x.Itens)
            .FirstOrDefaultAsync(x => x.SetorId == setorId && x.Codigo == DefaultTemplate.Codigo);

        if (existingTemplate is null)
        {
            existingTemplate = new StpAreaChecklistTemplate
            {
                SetorId = setorId,
                Codigo = DefaultTemplate.Codigo,
                Nome = DefaultTemplate.Nome,
                Ativo = true,
            };

            _db.StpAreaChecklistTemplates.Add(existingTemplate);
            await _db.SaveChangesAsync();
        }

        var existingOrders = existingTemplate.Itens.Select(x => x.Ordem).ToHashSet();

        foreach (var itemDefinition in DefaultTemplate.Itens.Where(x => !existingOrders.Contains(x.Ordem)))
        {
            _db.StpAreaChecklistTemplateItens.Add(new StpAreaChecklistTemplateItem
            {
                TemplateId = existingTemplate.Id,
                Ordem = itemDefinition.Ordem,
                Descricao = itemDefinition.Descricao,
                Instrucao = itemDefinition.Instrucao,
                Ativo = true,
            });
        }

        await _db.SaveChangesAsync();
    }

    private static readonly StpAreaTemplateDefinition DefaultTemplate = new(
        "F_PTV_0232",
        "Inspecao de Campo SMS",
        [
            new(1, "Os colaboradores conhecem e entendem sobre o tema do DSS realizado na semana?", "Realizar entrevista amostral com colaboradores do setor sobre o DSS da semana e registrar eventual desvio."),
            new(2, "Os check-lists de segurança estão preenchidos de forma correta", "Verificar os check-lists de segurança da área e analisar criticamente o preenchimento."),
            new(3, "Os dispositivos de emergência foram verificados antes do uso de acordo com seus respectivos registros", "Verificar testes e registros dos dispositivos de emergência antes do uso."),
            new(4, "Os mobiliários disponíveis estão em boas condições", "Verificar se os mobiliários do ambiente estão íntegros e funcionais."),
            new(5, "Os sistemas de prevenção contra incêndio e emergência estão desobstruídos", "Verificar extintores, hidrantes, luzes de emergência, armários corta-fogo, chuveiros e demais recursos."),
            new(6, "As sinalizações de segurança estão adequadas", "Verificar rotas de fuga, ponto de encontro, mapas de risco, uso de EPIs e demais sinalizações."),
            new(7, "Os dispositivos elétricos estão em boas condições de uso, sinalizados e identificados de maneira correta", "Verificar tomadas, cabos, fios e demais dispositivos elétricos quanto à integridade, sinalização e identificação."),
            new(8, "Os painéis e quadros elétricos estão com as portas fechadas, com impedimento de acesso acidental", "Verificar painéis e quadros fechados, identificados e desobstruídos."),
            new(9, "Todas as luminárias instaladas no local estão em funcionamento", "Verificar se há lâmpadas apagadas, queimadas ou danificadas no ambiente."),
            new(10, "A organização e limpeza do local encontram-se em boas condições", "Verificar organização e limpeza do ambiente considerando os princípios de 5S."),
            new(11, "Os produtos químicos estão identificados e acondicionados de forma correta", "Verificar identificação, acondicionamento, fracionamento, contenção e documentação GHS dos produtos."),
            new(12, "As escadas portáteis estão em boas condições para uso", "Verificar condições das escadas, lacres de inspeção e conhecimento de uso pelos colaboradores."),
            new(13, "As máquinas e equipamentos estão com suas proteções íntegras e em conformidade com a NR-12", "Verificar proteções dos equipamentos, maquinários e a consistência dos check-lists da NR-12."),
            new(14, "As ferramentas utilizadas estão em boas condições de uso", "Verificar integridade das ferramentas e uso adequado para a finalidade destinada."),
            new(15, "Os equipamentos e acessórios de movimentação de carga estão disponíveis e em condições de uso, com seus respectivos check-lists antes do uso preenchidos de forma correta", "Verificar equipamentos e acessórios de movimentação de carga, integridade, identificação de inspeções e check-lists antes do uso."),
            new(16, "As áreas de movimentação de materiais e pessoas estão demarcadas", "Verificar se as áreas de movimentação de pessoas e materiais estão devidamente demarcadas e sinalizadas."),
            new(17, "Os colaboradores conhecem e utilizam os EPIs para a finalidade em que é destinada", "Realizar verificação amostral do uso correto de EPIs e do conhecimento de sua aplicação."),
            new(18, "Os colaboradores conhecem o PAE (Plano de Atendimento a Emergência)", "Realizar entrevista amostral sobre telefone de emergência, ponto de encontro, rotas de fuga e cenários de emergência."),
            new(19, "Os colaboradores estão portando seus crachás de autorização e estão válidos", "Verificar crachás e validade dos treinamentos e autorizações associadas."),
            new(20, "Os colaboradores conhecem o formulário Relato de Anomalias de SMS", "Realizar entrevista amostral sobre aplicação, busca e registro do formulário de anomalias."),
            new(21, "Os colaboradores conhecem a LAAIPD", "Realizar entrevista amostral sobre riscos das atividades e localização das informações da LAAIPD."),
            new(22, "Os colaboradores conhecem e sabem como contribuir com a Política de SMS", "Realizar entrevista amostral sobre a política de SMS e como contribuir com ela no dia a dia."),
        ]
    );

    private sealed record StpAreaTemplateDefinition(
        string Codigo,
        string Nome,
        IReadOnlyList<StpAreaTemplateItemDefinition> Itens
    );

    private sealed record StpAreaTemplateItemDefinition(
        int Ordem,
        string Descricao,
        string Instrucao
    );
}

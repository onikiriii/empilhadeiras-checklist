using Checklist.Api.Models;

namespace Checklist.Api.Support;

public class ChecklistMonthlySnapshot
{
    public Guid EquipamentoId { get; set; }
    public Guid CategoriaId { get; set; }
    public string CategoriaNome { get; set; } = string.Empty;
    public FechamentoMensalModelo ModeloFechamentoMensal { get; set; }
    public string EquipamentoCodigo { get; set; } = string.Empty;
    public string EquipamentoDescricao { get; set; } = string.Empty;
    public string SetorNome { get; set; } = string.Empty;
    public int Ano { get; set; }
    public int Mes { get; set; }
    public int DiasNoMes { get; set; }
    public int TotalDiasComChecklist { get; set; }
    public int TotalChecklistsConsiderados { get; set; }
    public List<ChecklistMonthlyRowSnapshot> Linhas { get; set; } = [];
    public List<ChecklistMonthlyDaySnapshot> Dias { get; set; } = [];
    public List<string> Comentarios { get; set; } = [];
    public List<string> OperadoresConsolidados { get; set; } = [];
    public List<string> Avisos { get; set; } = [];
}

public class ChecklistMonthlyRowSnapshot
{
    public int Ordem { get; set; }
    public string Descricao { get; set; } = string.Empty;
    public List<string?> ValoresPorDia { get; set; } = [];
}

public class ChecklistMonthlyDaySnapshot
{
    public int Dia { get; set; }
    public Guid ChecklistId { get; set; }
    public string OperadorNome { get; set; } = string.Empty;
    public string OperadorMatricula { get; set; } = string.Empty;
    public DateTime DataRealizacao { get; set; }
}

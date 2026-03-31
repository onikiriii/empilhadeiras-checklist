using Checklist.Api.Models;
using System.ComponentModel.DataAnnotations;

namespace Checklist.Api.Dtos;

public record CategoriaEquipamentoDto(
    Guid Id,
    Guid SetorId,
    string Nome,
    bool Ativa,
    FechamentoMensalModelo ModeloFechamentoMensal
);

public record CriarCategoriaEquipamentoRequest(
    Guid? SetorId,
    [Required] string Nome,
    bool Ativa = true,
    FechamentoMensalModelo ModeloFechamentoMensal = FechamentoMensalModelo.Nenhum
);

public record AtualizarCategoriaEquipamentoRequest(
    [Required] string Nome,
    bool Ativa,
    FechamentoMensalModelo ModeloFechamentoMensal = FechamentoMensalModelo.Nenhum
);

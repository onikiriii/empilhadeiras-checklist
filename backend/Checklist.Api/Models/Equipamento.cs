namespace Checklist.Api.Models;

public class Equipamento
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string Codigo { get; set; } = "";  // código humano (ex: "E9")
    public string Descricao { get; set; } = "";
    public bool Ativa { get; set; } = true;

    public Guid CategoriaId { get; set; }
    public CategoriaEquipamento Categoria { get; set; } = null!;

    public Guid QrId { get; set; } = Guid.NewGuid();  // único, usado no QR
}

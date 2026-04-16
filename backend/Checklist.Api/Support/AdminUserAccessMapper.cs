using Checklist.Api.Dtos;
using Checklist.Api.Models;

namespace Checklist.Api.Support;

public static class AdminUserAccessMapper
{
    public static UsuarioSupervisorDto ToDto(UsuarioSupervisor usuario)
    {
        return new UsuarioSupervisorDto(
            usuario.Id,
            usuario.Nome,
            usuario.Sobrenome,
            $"{usuario.Nome} {usuario.Sobrenome}",
            usuario.Login,
            usuario.Ramal,
            usuario.Email,
            usuario.ForceChangePassword,
            usuario.IsMaster,
            usuario.Ativo,
            usuario.SetorId,
            usuario.Setor.Nome,
            usuario.TipoUsuario,
            AccessModuleCatalog.ToCodes(usuario.Modulos)
        );
    }

    public static List<UsuarioSupervisorModulo> BuildModules(Guid usuarioId, IEnumerable<ModuloAcesso> modulos)
    {
        return modulos
            .Distinct()
            .Select(modulo => new UsuarioSupervisorModulo
            {
                UsuarioSupervisorId = usuarioId,
                Modulo = modulo
            })
            .ToList();
    }
}

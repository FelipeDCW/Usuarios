using Business.Entities;
using System.Collections.Generic;

namespace Business.IDataAccess
{
    public interface IUsuariosRepository
    {
        List<Usuario> ObtenerTodosLosUsuarios();
        Usuario ObtenerUsuarioPorId(int id);
        void CrearUsuario(Usuario usuario);
        void ActualizarUsuario(Usuario usuario);
        void EliminarUsuario(int id);
    }
}

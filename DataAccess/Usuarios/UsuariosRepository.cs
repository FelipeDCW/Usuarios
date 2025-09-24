using Business.Entities;
using Business.IDataAccess;
using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Data.Entity.Validation;
using System.Linq;
using System.Text;

namespace DataAccess.Usuarios
{
    public class UsuariosRepository : IUsuariosRepository
    {
        private readonly UsuariosConnection _contexto;

        public UsuariosRepository()
        {
            _contexto = new UsuariosConnection();
        }

        public List<Usuario> ObtenerTodosLosUsuarios()
        {
            return _contexto.Usuarios.ToList();
        }

        public Usuario ObtenerUsuarioPorId(int id)
        {
            return _contexto.Usuarios.Find(id);
        }

        public void CrearUsuario(Usuario usuario)
        {
            try
            {
                _contexto.Usuarios.Add(usuario);
                _contexto.SaveChanges();
            }
            catch (DbEntityValidationException ex)
            {
                // Manejar la excepción para obtener un mensaje de error detallado
                throw new Exception(GetEntityValidationErrors(ex), ex);
            }
        }

        public void ActualizarUsuario(Usuario usuario)
        {
            _contexto.Entry(usuario).State = EntityState.Modified;
            _contexto.SaveChanges();
        }

        public void EliminarUsuario(int id)
        {
            var usuario = _contexto.Usuarios.Find(id);
            if (usuario != null)
            {
                _contexto.Usuarios.Remove(usuario);
                _contexto.SaveChanges();
            }
        }

        // Método auxiliar para formatear los errores de validación
        private string GetEntityValidationErrors(DbEntityValidationException ex)
        {
            var sb = new StringBuilder();
            foreach (var validationErrors in ex.EntityValidationErrors)
            {
                foreach (var validationError in validationErrors.ValidationErrors)
                {
                    sb.AppendFormat("Propiedad: {0}, Error: {1}\n", validationError.PropertyName, validationError.ErrorMessage);
                }
            }
            return sb.ToString();
        }
    }
}
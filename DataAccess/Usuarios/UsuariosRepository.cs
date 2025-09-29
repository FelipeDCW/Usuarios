using Business.Entities;
using Business.IDataAccess;
using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Data.Entity.Validation;
using System.Linq;
using System.Runtime.Remoting.Contexts;
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
                //// 1. Verificar unicidad del RUT
                var rutExists = _contexto.Usuarios.Any(u => u.Rut == usuario.Rut);

                if (!rutExists)
                {
                    _contexto.Usuarios.Add(usuario);
                    _contexto.SaveChanges();
                }
                else
                {
                    throw new InvalidOperationException($"El RUT '{usuario.Rut}' ya está registrado.");
                }
               
            }
            catch (DbEntityValidationException ex)
            {
                // Manejar la excepción para obtener un mensaje de error detallado
                throw new Exception(GetEntityValidationErrors(ex), ex);
            }
        }

        public void ActualizarUsuario(Usuario usuario)
        {
            var rutExists = _contexto.Usuarios.Any(u => u.Rut == usuario.Rut);

            if (rutExists)
            {
                throw new InvalidOperationException($"El RUT '{usuario.Rut}' ya está registrado.");
            }
            else
            {
                _contexto.Entry(usuario).State = EntityState.Modified;
                _contexto.SaveChanges();
            }
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
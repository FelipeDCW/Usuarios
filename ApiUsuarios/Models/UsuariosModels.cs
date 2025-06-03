using System;
using System.ComponentModel.DataAnnotations.Schema;
using System.Data.Entity;
using System.Linq;

namespace ApiUsuarios.Models
{
    public class UsuariosModels : DbContext
    {
        public UsuariosModels()
            : base("name=UsuariosModels")
        {
        }

        public virtual DbSet<Usuarios> Usuarios { get; set; }

        protected override void OnModelCreating(DbModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Usuarios>()
                .HasIndex(u => u.Rut)
                .IsUnique(true );
        }
    }
}

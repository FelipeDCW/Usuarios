namespace ApiUsuarios.Models
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    public partial class Usuarios
    {
        public int Id { get; set; }

        [Required]
        [StringLength(50)]
        public string Nombre { get; set; }

        [Required]
        [StringLength(50)]
        [Index(IsUnique = true)]
        public string Rut { get; set; }

        [StringLength(255)]
        public string Correo { get; set; }

        [Required]
        [Column(TypeName = "date")]
        public DateTime FechaNacimiento { get; set; }
    }
}

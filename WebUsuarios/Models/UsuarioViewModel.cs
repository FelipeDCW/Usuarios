using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;
using System.Web.Mvc;

namespace WebUsuarios.Models
{
    public class UsuarioViewModel 
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "El nombre es obligatorio.")]
        [StringLength(50, ErrorMessage = "El nombre no puede exceder los 50 caracteres.")]
        [Display(Name = "Nombre")]
        public string Nombre { get; set; }

        [Required(ErrorMessage = "El Rut es obligatorio.")]
        [StringLength(50, ErrorMessage = "El Rut no puede exceder los 50 caracteres.")]
        [RutChileno(ErrorMessage = "El Rut ingresado no es válido.")]
        [Display(Name = "Rut")]
        public string Rut { get; set; }

        [EmailAddress(ErrorMessage = "Formato de correo inválido.")]
        [StringLength(255, ErrorMessage = "El correo no puede exceder los 255 caracteres.")]
        [Display(Name = "Correo")]
        public string Correo { get; set; }

        [Required(ErrorMessage = "La fecha de nacimiento es obligatoria.")]
        [DataType(DataType.Date)]
        [DisplayFormat(DataFormatString = "{0:yyyy-MM-dd}", ApplyFormatInEditMode = true)]
        [Display(Name = "Fecha de Nacimiento")]
        public DateTime FechaNacimiento { get; set; } 

        public string SearchTerm { get; set; }

       
    }

}
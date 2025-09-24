// Archivo: Business/Entities/Usuario.cs
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text.RegularExpressions;

namespace Business.Entities
{
    public class Usuario : IValidatableObject
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "El nombre es obligatorio.")]
        public string Nombre { get; set; }

        [Required(ErrorMessage = "El RUT es obligatorio.")]
        public string Rut { get; set; }

        [Required(ErrorMessage = "El correo es obligatorio.")]
        [EmailAddress(ErrorMessage = "El formato del correo electrónico no es válido.")]
        public string Correo { get; set; }

        [Required(ErrorMessage = "La fecha de nacimiento es obligatoria.")]
        public DateTime FechaNacimiento { get; set; }

        // Método de validación personalizado
        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            // 1. Validar el formato con una expresión regular
            // Formato: 12345678-9 o 1.234.567-K
            var regex = new Regex(@"^(\d{1,3}(\.\d{3})*-)?\d{1,3}\.?[kK\d]$");
            if (!regex.IsMatch(Rut))
            {
                yield return new ValidationResult("El formato del RUT no es válido.", new[] { nameof(Rut) });
            }

            // 2. Validar el dígito verificador
            if (!ValidarRut(Rut))
            {
                yield return new ValidationResult("El RUT ingresado no es válido.", new[] { nameof(Rut) });
            }
        }

        // Método estático para la validación del dígito verificador
        public static bool ValidarRut(string rut)
        {
            rut = rut.ToUpper().Replace(".", "").Replace("-", "");
            if (rut.Length < 2) return false;

            string dv = rut.Substring(rut.Length - 1, 1);
            string numero = rut.Substring(0, rut.Length - 1);

            long suma = 0;
            long multiplo = 2;

            for (int i = numero.Length - 1; i >= 0; i--)
            {
                suma += long.Parse(numero[i].ToString()) * multiplo;
                multiplo = (multiplo == 7) ? 2 : multiplo + 1;
            }

            long resto = suma % 11;
            string dvCalculado = (11 - resto).ToString();

            if (dvCalculado == "10") dvCalculado = "K";
            if (dvCalculado == "11") dvCalculado = "0";

            return dvCalculado == dv;
        }
    }
}

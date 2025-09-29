using System;
using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;

public class RutChilenoAttribute : ValidationAttribute
{
    protected override ValidationResult IsValid(object value, ValidationContext validationContext)
    {
        // Si el valor es nulo o vacío, la validación pasa.
        // Se utiliza la validación [Required] para manejar la obligatoriedad.
        if (value == null || string.IsNullOrWhiteSpace(value.ToString()))
        {
            return ValidationResult.Success;
        }

        string rut = value.ToString();

        // 1. Limpiar el Rut: Eliminar puntos y guiones.
        rut = Regex.Replace(rut, @"[.-]", "").ToUpper();

        // 2. Separar el número del dígito verificador (DV).
        if (rut.Length < 2)
        {
            return new ValidationResult("El Rut debe tener al menos un número y un dígito verificador.");
        }

        string cuerpo = rut.Substring(0, rut.Length - 1);
        char dv = rut[rut.Length - 1];

        // 3. Validar el formato: El cuerpo debe ser numérico y el DV un dígito o 'K'.
        if (!long.TryParse(cuerpo, out long rutSinDv) || (!char.IsDigit(dv) && dv != 'K'))
        {
            return new ValidationResult("Formato de Rut inválido. Debe ser un número seguido de un dígito o 'K'.");
        }

        // 4. Calcular el DV.
        int suma = 0;
        int multiplicador = 2;

        for (int i = cuerpo.Length - 1; i >= 0; i--)
        {
            suma += (int)char.GetNumericValue(cuerpo[i]) * multiplicador;
            multiplicador++;
            if (multiplicador == 8)
            {
                multiplicador = 2;
            }
        }

        int resto = suma % 11;
        int dvCalculadoNum = 11 - resto;
        char dvCalculado;

        if (dvCalculadoNum == 11)
        {
            dvCalculado = '0';
        }
        else if (dvCalculadoNum == 10)
        {
            dvCalculado = 'K';
        }
        else
        {
            dvCalculado = (char)('0' + dvCalculadoNum);
        }

        // 5. Comparar el DV ingresado con el calculado.
        if (dv == dvCalculado)
        {
            return ValidationResult.Success;
        }
        else
        {
            return new ValidationResult("El Rut ingresado no es válido.");
        }
    }
}
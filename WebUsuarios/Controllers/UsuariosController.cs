using ClosedXML.Excel;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Web.Mvc;
using WebUsuarios.Models;
using WebUsuarios.Services;

namespace WebUsuarios.Controllers
{
    public class UsuariosController : Controller
    {
        private readonly ApiConsumerService _apiService = new ApiConsumerService();
        private const int PageSize = 100;  

        // GET: Usuarios
        public async Task<ActionResult> Index(string searchTerm, int page = 1)
        {
            List<UsuarioViewModel> usuarios = new List<UsuarioViewModel>();

            // Inicializar valores de ViewBag para evitar errores de null, especialmente en caso de error
            ViewBag.CurrentPage = page;
            ViewBag.TotalPages = 1; // Por defecto 1 página si no hay datos
            ViewBag.SearchTerm = searchTerm;
            ViewBag.HasPreviousPage = false;
            ViewBag.HasNextPage = false;
            ViewBag.ErrorMessage = null; // Reiniciar mensaje de error

            try
            {
                usuarios = await _apiService.GetUsuarios();

                // Filtrar si hay un término de búsqueda
                if (!string.IsNullOrEmpty(searchTerm))
                {
                    searchTerm = searchTerm.ToLower();
                    usuarios = usuarios.Where(u =>
                        u.Nombre.ToLower().Contains(searchTerm) ||
                        u.Rut.ToLower().Contains(searchTerm) ||
                        u.Correo.ToLower().Contains(searchTerm) ||
                        (u.FechaNacimiento.ToString("yyyy-MM-dd").Contains(searchTerm))
                    ).ToList();
                }

                // Paginación
                var totalItems = usuarios.Count;
                var totalPages = (int)Math.Ceiling((double)totalItems / PageSize);

                // Asegurarse de que totalPages sea al menos 1 para evitar divisiones por cero o lógicas incorrectas si no hay items
                if (totalPages == 0 && totalItems > 0) // Si hay items pero el tamaño de página es muy grande, esto evita 0
                    totalPages = 1;
                else if (totalItems == 0) // Si no hay items, solo hay 1 página (vacía)
                    totalPages = 1;

                // Asegurarse de que la página actual no exceda el número total de páginas
                if (page > totalPages)
                {
                    page = totalPages;
                }
                if (page < 1) // Asegurar que la página no sea menor que 1
                {
                    page = 1;
                }

                var paginatedUsers = usuarios.Skip((page - 1) * PageSize).Take(PageSize).ToList();

                // Asignar valores actualizados de ViewBag
                ViewBag.CurrentPage = page;
                ViewBag.TotalPages = totalPages;
                ViewBag.SearchTerm = searchTerm;
                ViewBag.HasPreviousPage = (page > 1);
                ViewBag.HasNextPage = (page < totalPages);

                return View(paginatedUsers);
            }
            catch (Exception ex)
            {
                ViewBag.ErrorMessage = $"Error al cargar usuarios: {ex.Message}";
                return View(new List<UsuarioViewModel>());
            }
        }

        
        // GET: Usuarios/Create
        public ActionResult Create()
        {
            return View();
        }

        // POST: Usuarios/Create
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<ActionResult> Create([Bind(Include = "Id,Nombre,Rut,Correo,FechaNacimiento")] UsuarioViewModel usuario)
        {
            if (ModelState.IsValid)
            {
                var response = await _apiService.CreateUsuario(usuario);
                if (response.IsSuccessStatusCode)
                {
                    TempData["SuccessMessage"] = "Usuario creado exitosamente.";
                    return RedirectToAction("Index");
                }
                else
                {
                    string errorContent = await response.Content.ReadAsStringAsync();
                    // Intentar deserializar los errores de validación de la API
                    try
                    {
                        var errors = Newtonsoft.Json.JsonConvert.DeserializeObject<Newtonsoft.Json.Linq.JObject>(errorContent);
                        if (errors["ModelState"] != null)
                        {
                            foreach (var item in errors["ModelState"])
                            {
                                var key = ((Newtonsoft.Json.Linq.JProperty)item).Name;
                                foreach (var error in item.First)
                                {
                                    ModelState.AddModelError(key.Replace("usuario.", ""), error.ToString());
                                }
                            }
                        }
                        else
                        {
                            ModelState.AddModelError("", $"Error al crear usuario: {response.ReasonPhrase}. {errorContent}");
                        }
                    }
                    catch
                    {
                        ModelState.AddModelError("", $"Error al crear usuario: {response.ReasonPhrase}. {errorContent}");
                    }
                }
            }
            return View(usuario);
        }

        // GET: Usuarios/Edit/5
        public async Task<ActionResult> Edit(int? id)
        {
            if (id == null)
            {
                return new HttpStatusCodeResult(System.Net.HttpStatusCode.BadRequest);
            }
            var usuario = await _apiService.GetUsuario(id.Value);
            if (usuario == null)
            {
                return HttpNotFound();
            }
            return View(usuario);
        }

        // POST: Usuarios/Edit/5
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<ActionResult> Edit([Bind(Include = "Id,Nombre,Rut,Correo,FechaNacimiento")] UsuarioViewModel usuario)
        {
            if (ModelState.IsValid)
            {
                var response = await _apiService.UpdateUsuario(usuario);
                if (response.IsSuccessStatusCode)
                {
                    TempData["SuccessMessage"] = "Usuario actualizado exitosamente.";
                    return RedirectToAction("Index");
                }
                else
                {
                    string errorContent = await response.Content.ReadAsStringAsync();
                    try
                    {
                        var errors = Newtonsoft.Json.JsonConvert.DeserializeObject<Newtonsoft.Json.Linq.JObject>(errorContent);
                        if (errors["ModelState"] != null)
                        {
                            foreach (var item in errors["ModelState"])
                            {
                                var key = ((Newtonsoft.Json.Linq.JProperty)item).Name;
                                foreach (var error in item.First)
                                {
                                    ModelState.AddModelError(key.Replace("usuario.", ""), error.ToString());
                                }
                            }
                        }
                        else
                        {
                            ModelState.AddModelError("", $"Error al actualizar usuario: {response.ReasonPhrase}. {errorContent}");
                        }
                    }
                    catch
                    {
                        ModelState.AddModelError("", $"Error al actualizar usuario: {response.ReasonPhrase}. {errorContent}");
                    }
                }
            }
            return View(usuario);
        }

        // GET: Usuarios/Delete/5
        public async Task<ActionResult> Delete(int? id)
        {
            if (id == null)
            {
                return new HttpStatusCodeResult(System.Net.HttpStatusCode.BadRequest);
            }
            var usuario = await _apiService.GetUsuario(id.Value);
            if (usuario == null)
            {
                return HttpNotFound();
            }
            return View(usuario);
        }

        // POST: Usuarios/Delete/5
        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        public async Task<ActionResult> DeleteConfirmed(int id)
        {
            var response = await _apiService.DeleteUsuario(id);
            if (response.IsSuccessStatusCode)
            {
                TempData["SuccessMessage"] = "Usuario eliminado exitosamente.";
                return RedirectToAction("Index");
            }
            else
            {
                TempData["ErrorMessage"] = "Error al eliminar el usuario.";
                return RedirectToAction("Index");
            }
        }

        // GET: Usuarios/ExportToExcel
        public async Task<FileResult> ExportToExcel(string searchTerm)
        {
            var usuarios = await _apiService.GetUsuarios();

            // Aplicar el mismo filtro que en el Index
            if (!string.IsNullOrEmpty(searchTerm))
            {
                searchTerm = searchTerm.ToLower();
                usuarios = usuarios.Where(u =>
                    u.Nombre.ToLower().Contains(searchTerm) ||
                    u.Rut.ToLower().Contains(searchTerm) ||
                    u.Correo.ToLower().Contains(searchTerm) ||
                    (u.FechaNacimiento.ToString("yyyy-MM-dd").Contains(searchTerm))
                ).ToList();
            }

            using (var workbook = new XLWorkbook())
            {
                var worksheet = workbook.Worksheets.Add("Usuarios");

                // Encabezados
                worksheet.Cell(1, 1).Value = "Id";
                worksheet.Cell(1, 2).Value = "Nombre";
                worksheet.Cell(1, 3).Value = "Rut";
                worksheet.Cell(1, 4).Value = "Correo";
                worksheet.Cell(1, 5).Value = "Fecha de Nacimiento";

                // Datos
                for (int i = 0; i < usuarios.Count; i++)
                {
                    var usuario = usuarios[i];
                    worksheet.Cell(i + 2, 1).Value = usuario.Id;
                    worksheet.Cell(i + 2, 2).Value = usuario.Nombre;
                    worksheet.Cell(i + 2, 3).Value = usuario.Rut;
                    worksheet.Cell(i + 2, 4).Value = usuario.Correo;
                    worksheet.Cell(i + 2, 5).Value = usuario.FechaNacimiento.ToString("yyyy-MM-dd");
                }

                worksheet.Columns().AdjustToContents(); // Ajustar ancho de columnas

                using (var stream = new MemoryStream())
                {
                    workbook.SaveAs(stream);
                    var content = stream.ToArray();
                    return File(content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Usuarios.xlsx");
                }
            }
        }
    }
    
}
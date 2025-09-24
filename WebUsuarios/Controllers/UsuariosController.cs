using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;
using Business.IDataAccess; 
using Business.Entities;   
using DataAccess.Usuarios; 
using WebUsuarios.Models;  

namespace WebUsuarios.Controllers
{
    public class UsuariosController : Controller
    {
        private readonly IUsuariosRepository _repositorio;
        private const int PageSize = 100;

        public UsuariosController()
        {
            _repositorio = new UsuariosRepository();
        }

        // GET: Usuarios
        public ActionResult Index(string searchTerm, int page = 1)
        {
            List<Usuario> usuarios;
            List<UsuarioViewModel> usuariosViewModel;

            try
            {
                usuarios = _repositorio.ObtenerTodosLosUsuarios();

                usuariosViewModel = usuarios.Select(u => new UsuarioViewModel
                {
                    Id = u.Id,
                    Nombre = u.Nombre,
                    Rut = u.Rut,
                    Correo = u.Correo,
                    FechaNacimiento = u.FechaNacimiento
                }).ToList();

        
                var totalItems = usuariosViewModel.Count;
                var totalPages = (int)Math.Ceiling((double)totalItems / PageSize);
                if (totalPages == 0) totalPages = 1;
                if (page > totalPages) page = totalPages;
                if (page < 1) page = 1;

                var paginatedUsers = usuariosViewModel.Skip((page - 1) * PageSize).Take(PageSize).ToList();

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
        public ActionResult Create(UsuarioViewModel usuarioViewModel)
        {
            if (ModelState.IsValid)
            {
                var usuario = new Usuario
                {
                    Nombre = usuarioViewModel.Nombre,
                    Rut = usuarioViewModel.Rut,
                    Correo = usuarioViewModel.Correo,
                    FechaNacimiento = usuarioViewModel.FechaNacimiento
                };

                _repositorio.CrearUsuario(usuario);
                TempData["SuccessMessage"] = "Usuario creado exitosamente.";
                return RedirectToAction("Index");
            }
            return View(usuarioViewModel);
        }

        // GET: Usuarios/Edit/5
        public ActionResult Edit(int? id)
        {
            if (id == null) return new HttpStatusCodeResult(System.Net.HttpStatusCode.BadRequest);

            var usuario = _repositorio.ObtenerUsuarioPorId(id.Value);

            if (usuario == null) return HttpNotFound();

            var usuarioViewModel = new UsuarioViewModel
            {
                Id = usuario.Id,
                Nombre = usuario.Nombre,
                Rut = usuario.Rut,
                Correo = usuario.Correo,
                FechaNacimiento = usuario.FechaNacimiento
            };

            return View(usuarioViewModel);
        }

        // POST: Usuarios/Edit/5
        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult Edit(UsuarioViewModel usuarioViewModel)
        {
            // Verificar si el modelo es válido
            if (ModelState.IsValid)
            {
                var usuario = new Usuario
                {
                    Id = usuarioViewModel.Id,
                    Nombre = usuarioViewModel.Nombre,
                    Rut = usuarioViewModel.Rut,
                    Correo = usuarioViewModel.Correo,
                    FechaNacimiento = usuarioViewModel.FechaNacimiento
                };

                try
                {
                    _repositorio.ActualizarUsuario(usuario);
                    TempData["SuccessMessage"] = "Usuario actualizado exitosamente.";
                    return RedirectToAction("Index");
                }
                catch (Exception ex)
                {
                    ModelState.AddModelError("", $"Error al actualizar el usuario: {ex.Message}");
                }
            }
            return View(usuarioViewModel);
        }

        // GET: Usuarios/Delete/5
        public ActionResult Delete(int? id)
        {
            if (id == null) return new HttpStatusCodeResult(System.Net.HttpStatusCode.BadRequest);

            var usuario = _repositorio.ObtenerUsuarioPorId(id.Value);

            if (usuario == null) return HttpNotFound();

            var usuarioViewModel = new UsuarioViewModel
            {
                Id = usuario.Id,
                Nombre = usuario.Nombre,
                Rut = usuario.Rut,
                Correo = usuario.Correo,
                FechaNacimiento = usuario.FechaNacimiento
            };

            return View(usuarioViewModel);
        }

        // POST: Usuarios/Delete/5
        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        public ActionResult DeleteConfirmed(int id)
        {
            _repositorio.EliminarUsuario(id);
            TempData["SuccessMessage"] = "Usuario eliminado exitosamente.";
            return RedirectToAction("Index");
        }

        // GET: Usuarios/ExportToExcel
        public ActionResult ExportToExcel(string searchTerm)
        {
            var usuarios = _repositorio.ObtenerTodosLosUsuarios();

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

            using (var workbook = new ClosedXML.Excel.XLWorkbook())
            {
                var worksheet = workbook.Worksheets.Add("Usuarios");

                worksheet.Cell(1, 1).Value = "Id";
                worksheet.Cell(1, 2).Value = "Nombre";
                worksheet.Cell(1, 3).Value = "Rut";
                worksheet.Cell(1, 4).Value = "Correo";
                worksheet.Cell(1, 5).Value = "Fecha de Nacimiento";

                for (int i = 0; i < usuarios.Count; i++)
                {
                    var usuario = usuarios[i];
                    worksheet.Cell(i + 2, 1).Value = usuario.Id;
                    worksheet.Cell(i + 2, 2).Value = usuario.Nombre;
                    worksheet.Cell(i + 2, 3).Value = usuario.Rut;
                    worksheet.Cell(i + 2, 4).Value = usuario.Correo;
                    worksheet.Cell(i + 2, 5).Value = usuario.FechaNacimiento.ToString("yyyy-MM-dd");
                }

                worksheet.Columns().AdjustToContents();

                using (var stream = new System.IO.MemoryStream())
                {
                    workbook.SaveAs(stream);
                    var content = stream.ToArray();
                    return File(content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Usuarios.xlsx");
                }
            }
        }
    }
}
using ApiUsuarios.Models;
using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;
using System.Web.Http.Description;


namespace ApiUsuarios.Controllers
{
    public class ApiUsuariosController : ApiController
    {
        [RoutePrefix("api/Usuarios")]
        public class UsuariosController : ApiController
        {
            private readonly UsuariosModels _context = new UsuariosModels();

            // GET: api/usuarios
            [HttpGet]
            [Route("")]
            public IQueryable<Usuarios> GetUsuarios()
            {
                return _context.Usuarios;
            }

            [HttpGet]
            [Route("{id:int}")]

            [ResponseType(typeof(Usuarios))]
            public async Task<IHttpActionResult> GetUsuario(int id)
            {
                var usuario = await _context.Usuarios.FindAsync(id);
                if (usuario == null)
                {
                    return NotFound();
                }
                return Ok(usuario);
            }

            [HttpPut]
            [Route("{id:int}")]
            [ResponseType(typeof(void))]
            public async Task<IHttpActionResult> PutUsuario(int id, Usuarios usuario)
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }
                if (id != usuario.Id)
                {
                    return BadRequest();
                }

                var existeRut = await _context.Usuarios.FirstOrDefaultAsync(u => u.Rut == usuario.Rut && u.Id != id);
                if (existeRut != null)
                {
                    ModelState.AddModelError("Rut", "El Rut ya existe para otro usuario.");
                    return BadRequest(ModelState);
                }
                


                try
                {
                    await _context.SaveChangesAsync();
                }
                catch (Exception ex)
                {
                    if (!_context.Usuarios.Any(u => u.Id == id))
                    {
                        return NotFound();
                    }
                    else
                    {
                        throw ex;
                    }
                }
                return StatusCode(HttpStatusCode.NoContent);
            }

            [HttpPost]
            [Route("")]
            [ResponseType(typeof(Usuarios))]
            public async Task<IHttpActionResult> PostUsuario(Usuarios usuario)
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }
                var existeRut = await _context.Usuarios.FirstOrDefaultAsync(u => u.Rut == usuario.Rut);
                if (existeRut != null)
                {
                    ModelState.AddModelError("Rut", "El Rut ya existe.");
                    return BadRequest(ModelState);
                }
                _context.Usuarios.Add(usuario);
                await _context.SaveChangesAsync();
                //return CreatedAtRoute("DefaultApi", new { id = usuario.Id }, usuario);
                return CreatedAtRoute("DefaultApi", new { controller = "Usuarios", id = usuario.Id }, usuario);
            }

            [HttpDelete]
            [Route("{id:int}")]
            [ResponseType(typeof(Usuarios))]
            public async Task<IHttpActionResult> DeleteUsuario(int id)
            {
                var usuario = await _context.Usuarios.FindAsync(id);
                if (usuario == null)
                {
                    return NotFound();
                }
                _context.Usuarios.Remove(usuario);
                await _context.SaveChangesAsync();
                return Ok(usuario);
            }


        }
    }
}

using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;
using WebUsuarios.Models;

namespace WebUsuarios.Services
{
    public class ApiConsumerService
    {
        private readonly HttpClient _httpClient;
        private readonly string _baseApiUrl;

        public ApiConsumerService()
        {
            // Obtener la URL base de la API desde Web.config
            _baseApiUrl = ConfigurationManager.AppSettings["ApiUsuariosBaseUrl"];
            if (string.IsNullOrEmpty(_baseApiUrl))
            {
                throw new ArgumentNullException("ApiUsuariosBaseUrl", "La URL base de la API no está configurada en Web.config.");
            }

            _httpClient = new HttpClient { BaseAddress = new Uri(_baseApiUrl) };
            _httpClient.DefaultRequestHeaders.Accept.Clear();
            _httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        }

        public async Task<List<UsuarioViewModel>> GetUsuarios()
        {
            HttpResponseMessage response = await _httpClient.GetAsync("api/Usuarios");
            response.EnsureSuccessStatusCode(); // Lanza una excepción si el código de estado no es de éxito (2xx)
            string jsonResponse = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<List<UsuarioViewModel>>(jsonResponse);
        }

        public async Task<UsuarioViewModel> GetUsuario(int id)
        {
            HttpResponseMessage response = await _httpClient.GetAsync($"api/Usuarios/{id}");
            if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                return null;
            }
            response.EnsureSuccessStatusCode();
            string jsonResponse = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<UsuarioViewModel>(jsonResponse);
        }

        public async Task<HttpResponseMessage> CreateUsuario(UsuarioViewModel usuario)
        {
            var jsonContent = JsonConvert.SerializeObject(usuario);
            var content = new StringContent(jsonContent, System.Text.Encoding.UTF8, "application/json");
            return await _httpClient.PostAsync("api/Usuarios", content);
        }

        public async Task<HttpResponseMessage> UpdateUsuario(UsuarioViewModel usuario)
        {
            var jsonContent = JsonConvert.SerializeObject(usuario);
            var content = new StringContent(jsonContent, System.Text.Encoding.UTF8, "application/json");
            return await _httpClient.PutAsync($"api/Usuarios/{usuario.Id}", content);
        }

        public async Task<HttpResponseMessage> DeleteUsuario(int id)
        {
            return await _httpClient.DeleteAsync($"api/Usuarios/{id}");
        }
    }
}
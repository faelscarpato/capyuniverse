using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using CapyOS.Models;

namespace CapyOS.Services
{
    public class CapyMateService : ICapyMateService
    {
        private readonly LoggingService _logger;
        private readonly CapyMateSettingsService _settingsService;
        private readonly HttpClient _http = new HttpClient();

        public CapyMateService(LoggingService logger, CapyMateSettingsService settingsService)
        {
            _logger = logger;
            _settingsService = settingsService;
        }

        public async Task<CapyMateMessage> SendAsync(string userMessage, IEnumerable<CapyMateMessage> history = null, CancellationToken ct = default)
        {
            _logger.Log("capymate", "user", userMessage, Guid.NewGuid());
            var s = _settingsService.Load();
            var provider = s.Provider ?? "Gemini";
            var apiKey = s.ApiKey ?? string.Empty;
            var endpoint = s.EndpointUrl ?? string.Empty;

            if (string.IsNullOrWhiteSpace(apiKey))
            {
                return new CapyMateMessage
                {
                    Role = "assistant",
                    Text = "Configure a API Key do CapyMate nas Configurações para usar a IA real.",
                    Timestamp = DateTime.Now
                };
            }

            try
            {
                if (string.Equals(provider, "Gemini", StringComparison.OrdinalIgnoreCase))
                {
                    var url = endpoint;
                    url += (url.Contains("?") ? "&" : "?") + "key=" + Uri.EscapeDataString(apiKey);

                    var contentsList = new List<object>();

                    // Gemini format: { "role": "user"|"model", "parts": [{ "text": "..." }] }
                    if (history != null)
                    {
                        foreach (var msg in history)
                        {
                            var role = msg.Role == "user" ? "user" : "model";
                            contentsList.Add(new { role = role, parts = new[] { new { text = msg.Text } } });
                        }
                    }

                    // Add current message
                    contentsList.Add(new { role = "user", parts = new[] { new { text = userMessage } } });

                    var payload = new { contents = contentsList };
                    var json = JsonSerializer.Serialize(payload);
                    using var req = new HttpRequestMessage(HttpMethod.Post, url)
                    {
                        Content = new StringContent(json, Encoding.UTF8, "application/json")
                    };
                    var res = await _http.SendAsync(req, ct);
                    if (!res.IsSuccessStatusCode)
                    {
                        _logger.Log("capymate-http-error", provider + " " + endpoint, ((int)res.StatusCode).ToString(), Guid.NewGuid());
                        if ((int)res.StatusCode == 401 || (int)res.StatusCode == 403)
                        {
                            return new CapyMateMessage { Role = "assistant", Text = "Verifique sua chave de API do CapyMate. O servidor retornou erro de autenticação.", Timestamp = DateTime.Now };
                        }
                        return new CapyMateMessage { Role = "assistant", Text = "CapyMate: não consegui uma resposta agora, tente novamente em alguns instantes.", Timestamp = DateTime.Now };
                    }
                    var body = await res.Content.ReadAsStringAsync(ct);
                    using var doc = JsonDocument.Parse(body);
                    string text = string.Empty;
                    if (doc.RootElement.TryGetProperty("candidates", out var cands) && cands.ValueKind == JsonValueKind.Array && cands.GetArrayLength() > 0)
                    {
                        var cand0 = cands[0];
                        if (cand0.TryGetProperty("content", out var content) && content.TryGetProperty("parts", out var parts) && parts.ValueKind == JsonValueKind.Array && parts.GetArrayLength() > 0)
                        {
                            var part0 = parts[0];
                            if (part0.TryGetProperty("text", out var t)) text = t.GetString() ?? string.Empty;
                        }
                    }
                    if (string.IsNullOrWhiteSpace(text)) text = "CapyMate: não consegui uma resposta agora, tente novamente em alguns instantes.";
                    var reply = new CapyMateMessage { Role = "assistant", Text = text, Timestamp = DateTime.Now };
                    _logger.Log("capymate", provider, "ok", Guid.NewGuid());
                    return reply;
                }
                else
                {
                    // OpenAI / Compatible format
                    using var req = new HttpRequestMessage(HttpMethod.Post, endpoint);
                    req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

                    var messagesList = new List<object>();
                    if (history != null)
                    {
                        foreach (var msg in history)
                        {
                            messagesList.Add(new { role = msg.Role, content = msg.Text });
                        }
                    }
                    messagesList.Add(new { role = "user", content = userMessage });

                    var payload = new
                    {
                        messages = messagesList,
                        model = "gpt-4o-mini"
                    };
                    var json = JsonSerializer.Serialize(payload);
                    req.Content = new StringContent(json, Encoding.UTF8, "application/json");
                    var res = await _http.SendAsync(req, ct);
                    if (!res.IsSuccessStatusCode)
                    {
                        _logger.Log("capymate-http-error", provider + " " + endpoint, ((int)res.StatusCode).ToString(), Guid.NewGuid());
                        if ((int)res.StatusCode == 401 || (int)res.StatusCode == 403)
                        {
                            return new CapyMateMessage { Role = "assistant", Text = "Verifique sua chave de API do CapyMate. O servidor retornou erro de autenticação.", Timestamp = DateTime.Now };
                        }
                        return new CapyMateMessage { Role = "assistant", Text = "CapyMate: não consegui uma resposta agora, tente novamente em alguns instantes.", Timestamp = DateTime.Now };
                    }
                    var body = await res.Content.ReadAsStringAsync(ct);
                    using var doc = JsonDocument.Parse(body);
                    string text = string.Empty;
                    if (doc.RootElement.TryGetProperty("choices", out var choices) && choices.ValueKind == JsonValueKind.Array && choices.GetArrayLength() > 0)
                    {
                        var c0 = choices[0];
                        if (c0.TryGetProperty("message", out var msg) && msg.TryGetProperty("content", out var cont))
                        {
                            text = cont.GetString() ?? string.Empty;
                        }
                    }
                    if (string.IsNullOrWhiteSpace(text)) text = "CapyMate: não consegui uma resposta agora, tente novamente em alguns instantes.";
                    var reply = new CapyMateMessage { Role = "assistant", Text = text, Timestamp = DateTime.Now };
                    _logger.Log("capymate", provider, "ok", Guid.NewGuid());
                    return reply;
                }
            }
            catch (OperationCanceledException)
            {
                return new CapyMateMessage { Role = "assistant", Text = "CapyMate: requisição cancelada.", Timestamp = DateTime.Now };
            }
            catch (Exception ex)
            {
                _logger.Log("capymate-http-exception", provider + " " + endpoint, ex.GetType().Name, Guid.NewGuid());
                return new CapyMateMessage { Role = "assistant", Text = "Ocorreu um erro ao consultar a IA.", Timestamp = DateTime.Now };
            }
        }
    }
}

namespace CapyOS.Models
{
    public class CapyMateSettings
    {
        public string Provider { get; set; } = "Gemini";
        public string ApiKey { get; set; } = string.Empty; // FUTURO: criptografar com DPAPI
        public string EndpointUrl { get; set; } = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
    }
}

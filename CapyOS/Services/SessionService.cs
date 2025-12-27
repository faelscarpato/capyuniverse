using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace CapyOS.Services
{
    public class SessionService
    {
        private class SessionData
        {
            public string Username { get; set; } = "admin";
            public string PasswordHash { get; set; } = string.Empty;
        }

        private readonly string _folder;
        private readonly string _file;
        private SessionData _data = new();
        public string? CurrentUser { get; private set; }

        public SessionService()
        {
            var appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
            _folder = Path.Combine(appData, "CapyOS");
            _file = Path.Combine(_folder, "session.json");
            Load();
            if (string.IsNullOrWhiteSpace(_data.PasswordHash))
            {
                try
                {
                    SetCredentials("admin", "admin");
                }
                catch (UnauthorizedAccessException) { }
                catch (IOException) { }
            }
        }

        private void Load()
        {
            try
            {
                Directory.CreateDirectory(_folder);
                if (File.Exists(_file))
                {
                    var json = File.ReadAllText(_file);
                    var s = JsonSerializer.Deserialize<SessionData>(json);
                    if (s != null) _data = s;
                }
            }
            catch (UnauthorizedAccessException)
            {
                _data = new SessionData();
            }
            catch (JsonException)
            {
                _data = new SessionData();
            }
            catch (IOException)
            {
                _data = new SessionData();
            }
        }

        private void Save()
        {
            try
            {
                Directory.CreateDirectory(_folder);
                var json = JsonSerializer.Serialize(_data, new JsonSerializerOptions { WriteIndented = true });
                File.WriteAllText(_file, json);
            }
            catch (UnauthorizedAccessException) { }
            catch (IOException) { }
        }

        public void SetCredentials(string username, string password)
        {
            _data.Username = username;
            _data.PasswordHash = Hash(password);
            Save();
        }

        public bool Authenticate(string username, string password)
        {
            try
            {
                var ok = string.Equals(_data.Username, username, StringComparison.OrdinalIgnoreCase) && _data.PasswordHash == Hash(password);
                CurrentUser = ok ? username : null;
                return ok;
            }
            catch
            {
                CurrentUser = null;
                return false;
            }
        }

        private static string Hash(string s)
        {
            try
            {
                using var sha = SHA256.Create();
                var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(s));
                return Convert.ToHexString(bytes);
            }
            catch (CryptographicException)
            {
                return string.Empty;
            }
            catch (ArgumentException)
            {
                return string.Empty;
            }
        }
    }
}

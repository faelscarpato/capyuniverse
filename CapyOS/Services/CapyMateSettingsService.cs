using System;
using System.IO;
using System.Text.Json;
using System.Threading;
using CapyOS.Models;

namespace CapyOS.Services
{
    public class CapyMateSettingsService
    {
        private readonly string _folder;
        private readonly string _file;
        private readonly SemaphoreSlim _lock = new(1, 1);
        private CapyMateSettings _settings = new();

        public CapyMateSettingsService()
        {
            var appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
            _folder = Path.Combine(appData, "CapyOS");
            _file = Path.Combine(_folder, "capymate-settings.json");
        }

        public CapyMateSettings Load()
        {
            try
            {
                Directory.CreateDirectory(_folder);
                if (File.Exists(_file))
                {
                    var json = File.ReadAllText(_file);
                    var s = JsonSerializer.Deserialize<CapyMateSettings>(json);
                    if (s != null) _settings = s;
                }
            }
            catch { }
            return _settings;
        }

        public void Save(CapyMateSettings s)
        {
            _lock.Wait();
            try
            {
                _settings = s;
                Directory.CreateDirectory(_folder);
                var json = JsonSerializer.Serialize(_settings, new JsonSerializerOptions { WriteIndented = true });
                File.WriteAllText(_file, json);
            }
            finally
            {
                _lock.Release();
            }
        }

        public CapyMateSettings Current => _settings;
    }
}

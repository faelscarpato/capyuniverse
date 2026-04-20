using System;
using System.IO;
using System.Text.Json;
using System.Threading;
using CapyOS.Models;

namespace CapyOS.Services
{
    public class SettingsService
    {
        private readonly string _folder;
        private readonly string _file;
        private readonly SemaphoreSlim _lock = new(1, 1);
        private AppSettings _settings = new AppSettings();

        public SettingsService()
        {
            var appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
            _folder = Path.Combine(appData, "CapyOS");
            _file = Path.Combine(_folder, "settings.json");
        }

        public AppSettings Load()
        {
            Directory.CreateDirectory(_folder);
            if (File.Exists(_file))
            {
                try
                {
                    var json = File.ReadAllText(_file);
                    var s = JsonSerializer.Deserialize<AppSettings>(json);
                    if (s != null) _settings = s;
                }
                catch {}
            }
            if ((_settings.Workspaces == null || _settings.Workspaces.Count == 0) && _settings.Windows.Count > 0)
            {
                var ws = new WorkspaceState { Id = Guid.NewGuid(), Name = "Work 1", Index = 0, Windows = _settings.Windows };
                _settings.Workspaces = new System.Collections.Generic.List<WorkspaceState> { ws };
            }
            return _settings;
        }

        public void Save(AppSettings settings)
        {
            _lock.Wait();
            try
            {
                _settings = settings;
                Directory.CreateDirectory(_folder);
                var json = JsonSerializer.Serialize(_settings, new JsonSerializerOptions { WriteIndented = true });
                File.WriteAllText(_file, json);
            }
            finally
            {
                _lock.Release();
            }
        }

        public AppSettings Current => _settings;
    }
}

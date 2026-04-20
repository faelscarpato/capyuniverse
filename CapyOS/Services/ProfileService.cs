using System;
using System.IO;
using System.Text.Json;
using System.Threading;
using CapyOS.Models;

namespace CapyOS.Services
{
    public class ProfileService
    {
        private readonly string _folder;
        private readonly string _file;
        private readonly SemaphoreSlim _lock = new(1, 1);
        private ProfileModel _profile = new();

        public ProfileService()
        {
            var appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
            _folder = Path.Combine(appData, "CapyOS");
            _file = Path.Combine(_folder, "profile.json");
        }

        public ProfileModel Load()
        {
            Directory.CreateDirectory(_folder);
            if (File.Exists(_file))
            {
                try
                {
                    var json = File.ReadAllText(_file);
                    var p = JsonSerializer.Deserialize<ProfileModel>(json);
                    if (p != null) _profile = p;
                }
                catch { }
            }
            return _profile;
        }

        public void Save(ProfileModel p)
        {
            _lock.Wait();
            try
            {
                _profile = p;
                Directory.CreateDirectory(_folder);
                var json = JsonSerializer.Serialize(_profile, new JsonSerializerOptions { WriteIndented = true });
                File.WriteAllText(_file, json);
            }
            finally
            {
                _lock.Release();
            }
        }

        public ProfileModel Current => _profile;
    }
}

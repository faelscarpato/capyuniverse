using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using CapyOS.Models;

namespace CapyOS.Services
{
    public class CapyAppCatalogService : ICapyAppCatalogService
    {
        private readonly string _folder;
        private readonly string _file;

        public CapyAppCatalogService()
        {
            var appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
            _folder = Path.Combine(appData, "CapyOS");
            _file = Path.Combine(_folder, "apps.json");
        }

        public async Task<IList<CapyAppModel>> LoadAppsAsync()
        {
            Directory.CreateDirectory(_folder);
            if (!File.Exists(_file))
            {
                var defaults = GetDefaultApps();
                var manifest = new CapyAppManifest { Apps = defaults.ToList() };
                var json = JsonSerializer.Serialize(manifest, new JsonSerializerOptions { WriteIndented = true });
                await File.WriteAllTextAsync(_file, json);
                return defaults.ToList();
            }
            try
            {
                var json = await File.ReadAllTextAsync(_file);
                var manifest = JsonSerializer.Deserialize<CapyAppManifest>(json) ?? new CapyAppManifest();
                return manifest.Apps;
            }
            catch
            {
                return GetDefaultApps().ToList();
            }
        }

        public async Task SaveAppsAsync(IEnumerable<CapyAppModel> apps)
        {
            Directory.CreateDirectory(_folder);
            var manifest = new CapyAppManifest { Apps = apps.ToList() };
            var json = JsonSerializer.Serialize(manifest, new JsonSerializerOptions { WriteIndented = true });
            await File.WriteAllTextAsync(_file, json);
        }

        private IEnumerable<CapyAppModel> GetDefaultApps()
        {
            return new List<CapyAppModel>
            {
                new CapyAppModel { Id = "capy.ide", Name = "Capy IDE", Description = "Editor interno", Category = "Dev", AppType = "Internal", IconPath = "🧩", IsEnabled = true, IsPinnedDock = true },
                new CapyAppModel { Id = "capy.doc", Name = "Capy Doc", Description = "Documentos internos", Category = "Produtividade", AppType = "Internal", IconPath = "📄", IsEnabled = true, IsPinnedDock = true },
                new CapyAppModel { Id = "capy.settings", Name = "Configurações", Description = "Preferências do sistema", Category = "Sistema", AppType = "Internal", IconPath = "⚙", IsEnabled = true, IsPinnedDock = true },
                new CapyAppModel { Id = "capy.store", Name = "CapyStore", Description = "Loja de apps", Category = "Sistema", AppType = "Internal", IconPath = "🛍", IsEnabled = true, IsPinnedDock = true },
                new CapyAppModel { Id = "capy.love", Name = "CapyLove", Description = "Sua companheira IA", Category = "Social", AppType = "Internal", IconPath = "❤️", IsEnabled = true, IsPinnedDock = true },
                new CapyAppModel { Id = "plugin.notepad", Name = "Notepad", Description = "Bloco de notas", Category = "Produtividade", AppType = "ExternalExe", IconPath = "📝", Command = "notepad.exe", Arguments = "", IsEnabled = true, IsPinnedDock = false },
                new CapyAppModel { Id = "plugin.calc", Name = "Calculator", Description = "Calculadora do Windows", Category = "Produtividade", AppType = "ExternalExe", IconPath = "🧮", Command = "calc.exe", Arguments = "", IsEnabled = true, IsPinnedDock = false },
                new CapyAppModel { Id = "capy.universe", Name = "Capy Universe", Description = "Portal web", Category = "Navegação", AppType = "ExternalUrl", IconPath = "🌐", Url = "https://capyuniverse.insano.fake", IsEnabled = true, IsPinnedDock = false },
            };
        }
    }
}

using System.Windows;
using System;
using System.Threading.Tasks;
using CapyOS.Services;
using CapyOS.ViewModels;
using CapyOS.Models;

namespace CapyOS
{
    public partial class App : Application
    {
        private SettingsService _settingsService = null!;
        private ThemeService _themeService = null!;
        private LoggingService _loggingService = null!;
        private IWindowManager _windowManager = null!;
        private IWorkspaceManager _workspaceManager = null!;
        private ICapyAppCatalogService _catalogService = null!;
        private ProfileService _profileService = null!;
        private CapyMateSettingsService _capyMateSettingsService = null!;
        private ICapyMateService _capyMateService = null!;

        protected override async void OnStartup(StartupEventArgs e)
        {
            base.OnStartup(e);
            var splash = new Views.SplashWindow();
            splash.Show();

            _loggingService = new LoggingService();
            _loggingService.Log("startup", "App", "begin", System.Guid.Empty);

            var settings = LoadAndApplySettings();
            WireGlobalErrorLogging();
            InitializeCoreServices(settings);

            var vm = await BuildMainViewModel(settings);
            ShowMainWindow(vm, splash);
        }

        private AppSettings LoadAndApplySettings()
        {
            _settingsService = new SettingsService();
            var s = _settingsService.Load();
            _themeService = new ThemeService();
            _themeService.ApplyTheme(s.Theme);
            return s;
        }

        private void WireGlobalErrorLogging()
        {
            DispatcherUnhandledException += (s, ex) =>
            {
                _loggingService.Log("error", "App", ex.Exception.Message, Guid.Empty);
                _loggingService.Log("error", "AppStack", ex.Exception.ToString(), Guid.Empty);
            };
            AppDomain.CurrentDomain.UnhandledException += (s, ex) =>
            {
                var msg = (ex.ExceptionObject as Exception)?.ToString() ?? ex.ExceptionObject?.ToString() ?? "Unknown";
                _loggingService.Log("fatal", "App", msg, Guid.Empty);
            };
            TaskScheduler.UnobservedTaskException += (s, ex) =>
            {
                _loggingService.Log("error", "Task", ex.Exception.ToString(), Guid.Empty);
            };
        }

        private void InitializeCoreServices(AppSettings settings)
        {
            _workspaceManager = new WorkspaceManagerService(_settingsService, _loggingService);
            _workspaceManager.RestoreFromSettings(settings);
            _windowManager = new WindowManagerService(_settingsService, _loggingService, _workspaceManager);
            _catalogService = new CapyOS.Services.CapyAppCatalogService();
            _profileService = new ProfileService();
            _capyMateSettingsService = new CapyOS.Services.CapyMateSettingsService();
            _capyMateService = new CapyOS.Services.CapyMateService(_loggingService, _capyMateSettingsService);
        }

        private async Task<MainViewModel> BuildMainViewModel(AppSettings settings)
        {
            var profile = _profileService.Load();
            if (string.IsNullOrWhiteSpace(profile.Username)) profile.Username = System.Environment.UserName;
            settings.Theme = profile.Theme;
            _settingsService.Save(settings);
            _themeService.ApplyTheme(settings.Theme);

            var vm = new MainViewModel(_settingsService, _themeService, _windowManager, _workspaceManager, _loggingService, _catalogService, _capyMateService, _capyMateSettingsService);
            var apps = await _catalogService.LoadAppsAsync();
            vm.InitializeCatalog(apps);
            foreach (var id in profile.FavoriteAppIds)
            {
                var a = vm.CatalogApps.FirstOrDefault(x => x.Id == id);
                if (a != null) a.IsFavorite = true;
            }
            vm.ProfileName = profile.DisplayName;
            vm.ProfileAvatarPath = profile.AvatarPath;
            vm.Theme = profile.Theme;
            _workspaceManager.SwitchWorkspace(profile.LastWorkspaceIndex);
            return vm;
        }

        private void ShowMainWindow(MainViewModel vm, Views.SplashWindow splash)
        {
            var window = new Views.MainWindow { DataContext = vm };
            MainWindow = window;
            window.Show();
            _loggingService.Log("startup", "MainWindow", "shown", System.Guid.Empty);
            splash.Close();
            _loggingService.Log("startup", "App", "ready", System.Guid.Empty);
        }

        protected override void OnExit(ExitEventArgs e)
        {
            base.OnExit(e);
        }
    }
}

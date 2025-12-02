using System;
using System.Collections.ObjectModel;
using System.Linq;
using System.Diagnostics;
using System.Threading.Tasks;
using CapyOS.Commands;
using CapyOS.Models;
using CapyOS.Services;

namespace CapyOS.ViewModels
{
    public class MainViewModel : BaseViewModel
    {
        private readonly SettingsService _settings;
        private readonly ThemeService _themes;
        private readonly IWindowManager _windows;
        private readonly IWorkspaceManager _workspaces;
        private readonly LoggingService _logger;
        private readonly ICapyAppCatalogService _catalog;
        private readonly ICapyMateService _mate;
        private readonly CapyMateSettingsService _mateSettingsService;

        public MainViewModel(SettingsService settings, ThemeService themes, IWindowManager windows, IWorkspaceManager workspaces, LoggingService logger, ICapyAppCatalogService catalog, ICapyMateService mate, CapyMateSettingsService mateSettingsService)
        {
            _settings = settings;
            _themes = themes;
            _windows = windows;
            _workspaces = workspaces;
            _logger = logger;
            _catalog = catalog;
            _mate = mate;
            _mateSettingsService = mateSettingsService;
            _theme = _settings.Current.Theme;
            ToggleThemeCommand = new RelayCommand(_ => ToggleTheme());
            OpenAppCommand = new RelayCommand(k => { if (k is string s) _windows.OpenWindow(s); });
            OpenAppByIdCommand = new RelayCommand(id => { if (id is string s) OpenAppById(s); });
            MinimizeWindowCommand = new RelayCommand(w => { if (w is AppWindowModel m) _windows.MinimizeWindow(m.Id); });
            CloseWindowCommand = new RelayCommand(w => { if (w is AppWindowModel m) _windows.CloseWindow(m.Id); });
            RestoreWindowCommand = new RelayCommand(w => { if (w is AppWindowModel m) _windows.RestoreWindow(m.Id); });
            ActivateWindowCommand = new RelayCommand(w => { if (w is AppWindowModel m) _windows.ActivateWindow(m.Id); });
            CycleWindowsCommand = new RelayCommand(_ => Cycle());
            CloseActiveCommand = new RelayCommand(_ => CloseActive());
            NotifyWindowPositionChangedCommand = new RelayCommand(w => _workspaces.Persist());
            CreateWorkspaceCommand = new RelayCommand(n => CreateWorkspace(n as string));
            SwitchWorkspaceCommand = new RelayCommand(i => SwitchWorkspace(i));
            NextWorkspaceCommand = new RelayCommand(_ => SwitchRelative(+1));
            PrevWorkspaceCommand = new RelayCommand(_ => SwitchRelative(-1));
            MoveWindowToWorkspaceCommand = new RelayCommand(p => MoveWindowToWorkspace(p));
            ToggleMissionControlCommand = new RelayCommand(_ => IsMissionControlVisible = !IsMissionControlVisible);
            ActivateFromMissionControlCommand = new RelayCommand(w => { if (w is AppWindowModel m) { _windows.ActivateWindow(m.Id); IsMissionControlVisible = false; } });
            Title = "CapyOS";

            CatalogApps = new ObservableCollection<CapyAppModel>();
            DockApps = new ObservableCollection<CapyAppModel>();
            SubscribeWindows();
            ToggleSettingsScreenCommand = new RelayCommand(_ => IsSettingsScreenVisible = !IsSettingsScreenVisible);
            SaveProfileCommand = new RelayCommand(async _ => await SaveProfileAsync());
            ToggleStartMenuCommand = new RelayCommand(_ => IsStartMenuOpen = !IsStartMenuOpen);
            FocusCapyMateCommand = new RelayCommand(_ => FocusCapyMate());
            SaveCapyMateSettingsCommand = new RelayCommand(_ => SaveCapyMateSettings());

            CapyMate = new CapyMateViewModel(_mate, _logger);
            CapyLove = new CapyLoveViewModel(_mate, _logger);

            var ms = _mateSettingsService.Load();
            CapyMateApiKey = ms.ApiKey ?? string.Empty;
            CapyMateEndpointUrl = ms.EndpointUrl ?? string.Empty;
        }

        private AppTheme _theme;
        public AppTheme Theme
        {
            get => _theme;
            set
            {
                if (SetProperty(ref _theme, value))
                {
                    _themes.ApplyTheme(value);
                    var s = _settings.Current;
                    s.Theme = value;
                    _settings.Save(s);
                }
            }
        }

        public string Title { get; }

        public ObservableCollection<AppWindowModel> Windows => _windows.Windows;
        public ObservableCollection<WorkspaceModel> Workspaces => _workspaces.Workspaces;
        public WorkspaceModel ActiveWorkspace => _workspaces.ActiveWorkspace;
        public ObservableCollection<CapyAppModel> CatalogApps { get; }
        public ObservableCollection<CapyAppModel> DockApps { get; }

        public RelayCommand ToggleThemeCommand { get; }
        public RelayCommand OpenAppCommand { get; }
        public RelayCommand OpenAppByIdCommand { get; }
        public RelayCommand MinimizeWindowCommand { get; }
        public RelayCommand CloseWindowCommand { get; }
        public RelayCommand RestoreWindowCommand { get; }
        public RelayCommand ActivateWindowCommand { get; }
        public RelayCommand CycleWindowsCommand { get; }
        public RelayCommand CloseActiveCommand { get; }
        public RelayCommand NotifyWindowPositionChangedCommand { get; }
        public RelayCommand CreateWorkspaceCommand { get; }
        public RelayCommand SwitchWorkspaceCommand { get; }
        public RelayCommand NextWorkspaceCommand { get; }
        public RelayCommand PrevWorkspaceCommand { get; }
        public RelayCommand MoveWindowToWorkspaceCommand { get; }
        public RelayCommand ToggleMissionControlCommand { get; }
        public RelayCommand ActivateFromMissionControlCommand { get; }
        public RelayCommand ToggleSettingsScreenCommand { get; }
        public RelayCommand SaveProfileCommand { get; }
        public RelayCommand ToggleStartMenuCommand { get; }
        public RelayCommand FocusCapyMateCommand { get; }
        public RelayCommand SaveCapyMateSettingsCommand { get; }

        private bool _missionVisible;
        public bool IsMissionControlVisible { get => _missionVisible; set => SetProperty(ref _missionVisible, value); }

        private bool _settingsVisible;
        public bool IsSettingsScreenVisible { get => _settingsVisible; set => SetProperty(ref _settingsVisible, value); }

        private bool _homeVisible;
        public bool IsHomeVisible { get => _homeVisible; set => SetProperty(ref _homeVisible, value); }

        private bool _startMenuOpen;
        public bool IsStartMenuOpen { get => _startMenuOpen; set => SetProperty(ref _startMenuOpen, value); }

        private string _profileName = string.Empty;
        public string ProfileName { get => _profileName; set => SetProperty(ref _profileName, value); }

        private string _profileAvatarPath = string.Empty;
        public string ProfileAvatarPath { get => _profileAvatarPath; set => SetProperty(ref _profileAvatarPath, value); }

        private string _capyMateApiKey = string.Empty;
        public string CapyMateApiKey { get => _capyMateApiKey; set => SetProperty(ref _capyMateApiKey, value); }

        private string _capyMateEndpointUrl = string.Empty;
        public string CapyMateEndpointUrl { get => _capyMateEndpointUrl; set => SetProperty(ref _capyMateEndpointUrl, value); }

        private void ToggleTheme()
        {
            Theme = Theme == AppTheme.Light ? AppTheme.Dark : AppTheme.Light;
        }

        private void SaveCapyMateSettings()
        {
            var s = new CapyMateSettings
            {
                Provider = "Gemini",
                ApiKey = CapyMateApiKey ?? string.Empty,
                EndpointUrl = string.IsNullOrWhiteSpace(CapyMateEndpointUrl) ? "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent" : CapyMateEndpointUrl
            };
            _mateSettingsService.Save(s);
            var mask = s.ApiKey.Length > 4 ? new string('*', Math.Max(0, s.ApiKey.Length - 4)) + s.ApiKey[^4..] : "****";
            _logger.Log("capymate-settings", s.Provider, s.EndpointUrl + " | key:" + mask, Guid.NewGuid());
        }

        private async Task SaveProfileAsync()
        {
            var p = new ProfileModel
            {
                Username = string.Empty,
                DisplayName = ProfileName,
                AvatarPath = ProfileAvatarPath,
                Theme = Theme,
                FavoriteAppIds = CatalogApps.Where(a => a.IsFavorite).Select(a => a.Id).ToList(),
                LastWorkspaceIndex = ActiveWorkspace?.Index ?? 0
            };
            await Task.Run(() => new ProfileService().Save(p));
            IsSettingsScreenVisible = false;
        }

        private void Cycle()
        {
            var order = Windows.Where(x => !x.IsMinimized).OrderByDescending(x => x.ZIndex).ToList();
            if (order.Count < 2) return;
            var current = order.First();
            var next = order.Skip(1).First();
            _windows.ActivateWindow(next.Id);
        }

        private void CloseActive()
        {
            var active = Windows.FirstOrDefault(x => x.IsActive);
            if (active != null) _windows.CloseWindow(active.Id);
        }

        private void CreateWorkspace(string? name)
        {
            var n = string.IsNullOrWhiteSpace(name) ? $"Work {Workspaces.Count + 1}" : name!;
            _workspaces.CreateWorkspace(n);
        }

        private void SwitchWorkspace(object? indexOrModel)
        {
            int index = indexOrModel switch
            {
                int i => i,
                WorkspaceModel m => m.Index,
                _ => ActiveWorkspace.Index
            };
            _workspaces.SwitchWorkspace(index);
            OnPropertyChanged(nameof(ActiveWorkspace));
            OnPropertyChanged(nameof(Windows));
            SubscribeWindows();
            UpdateHomeVisibility();
        }

        private void SwitchRelative(int delta)
        {
            var count = Workspaces.Count;
            if (count == 0) return;
            var next = (ActiveWorkspace.Index + delta + count) % count;
            _workspaces.SwitchWorkspace(next);
            OnPropertyChanged(nameof(ActiveWorkspace));
            OnPropertyChanged(nameof(Windows));
        }

        private void MoveWindowToWorkspace(object? param)
        {
            if (param is string s)
            {
                var parts = s.Split('|');
                if (parts.Length == 2 && Guid.TryParse(parts[0], out var id) && int.TryParse(parts[1], out var idx))
                {
                    _workspaces.MoveWindowToWorkspace(id, idx);
                    OnPropertyChanged(nameof(Windows));
                }
            }
        }

        public LoggingService Logger => _logger;
        public ICapyAppCatalogService CatalogService => _catalog;

        public void InitializeCatalog(System.Collections.Generic.IList<CapyAppModel> apps)
        {
            CatalogApps.Clear();
            foreach (var a in apps) CatalogApps.Add(a);
            RefreshDockFromCatalog();
        }

        public void RefreshDockFromCatalog()
        {
            DockApps.Clear();
            var baseInternal = new[] { "capy.ide", "capy.doc", "capy.settings", "capy.store", "capy.love" };
            foreach (var id in baseInternal)
            {
                var found = CatalogApps.FirstOrDefault(a => a.Id == id);
                if (found != null) DockApps.Add(found);
            }
            foreach (var a in CatalogApps.Where(x => x.IsPinnedDock && !baseInternal.Contains(x.Id))) DockApps.Add(a);
            UpdateDockOpenState();
        }

        private ObservableCollection<AppWindowModel>? _subscribedWindows;
        private void SubscribeWindows()
        {
            if (_subscribedWindows != null)
            {
                _subscribedWindows.CollectionChanged -= OnWindowsCollectionChanged;
                foreach (var w in _subscribedWindows) w.PropertyChanged -= OnWindowPropertyChanged;
            }
            _subscribedWindows = _windows.Windows;
            if (_subscribedWindows != null)
            {
                _subscribedWindows.CollectionChanged += OnWindowsCollectionChanged;
                foreach (var w in _subscribedWindows) w.PropertyChanged += OnWindowPropertyChanged;
            }
            UpdateDockOpenState();
            UpdateHomeVisibility();
        }
        private void OnWindowsCollectionChanged(object? sender, System.Collections.Specialized.NotifyCollectionChangedEventArgs e)
        {
            if (e.NewItems != null)
            {
                foreach (var obj in e.NewItems)
                {
                    if (obj is AppWindowModel w) w.PropertyChanged += OnWindowPropertyChanged;
                }
            }
            if (e.OldItems != null)
            {
                foreach (var obj in e.OldItems)
                {
                    if (obj is AppWindowModel w) w.PropertyChanged -= OnWindowPropertyChanged;
                }
            }
            UpdateDockOpenState();
            UpdateHomeVisibility();
        }
        private void OnWindowPropertyChanged(object? sender, System.ComponentModel.PropertyChangedEventArgs e)
        {
            if (e.PropertyName == nameof(AppWindowModel.IsMinimized) || e.PropertyName == nameof(AppWindowModel.AppKey))
            {
                UpdateDockOpenState();
                UpdateHomeVisibility();
            }
        }

        private void UpdateDockOpenState()
        {
            foreach (var a in DockApps)
            {
                var key = MapInternalKey(a.Id);
                a.IsOpenInternal = !string.IsNullOrEmpty(key) && Windows.Any(w => w.AppKey == key && !w.IsMinimized);
            }
        }

        private void UpdateHomeVisibility()
        {
            IsHomeVisible = Windows == null || Windows.Count == 0 || Windows.All(w => w.IsMinimized);
        }

        public void OpenAppById(string appId)
        {
            var app = CatalogApps.FirstOrDefault(a => a.Id == appId);
            if (app == null || !app.IsEnabled) return;
            if (string.Equals(app.AppType, "Internal", StringComparison.OrdinalIgnoreCase))
            {
                var key = MapInternalKey(app.Id);
                if (!string.IsNullOrEmpty(key)) _windows.OpenWindow(key);
                return;
            }
            if (string.Equals(app.AppType, "ExternalExe", StringComparison.OrdinalIgnoreCase))
            {
                try
                {
                    var psi = new ProcessStartInfo
                    {
                        FileName = app.Command,
                        Arguments = app.Arguments ?? string.Empty,
                        UseShellExecute = true
                    };
                    Process.Start(psi);
                    _logger.Log("external-exe", app.Id, app.Name, Guid.NewGuid());
                }
                catch (Exception ex)
                {
                    _logger.Log("external-exe-error", app.Command + " " + app.Arguments, ex.Message, Guid.NewGuid());
                }
                return;
            }
            if (string.Equals(app.AppType, "ExternalUrl", StringComparison.OrdinalIgnoreCase))
            {
                try
                {
                    var psi = new ProcessStartInfo(app.Url) { UseShellExecute = true };
                    Process.Start(psi);
                    _logger.Log("external-url", app.Id, app.Url, Guid.NewGuid());
                }
                catch (Exception ex)
                {
                    _logger.Log("external-url-error", app.Url, ex.Message, Guid.NewGuid());
                }
                return;
            }
        }

        private string MapInternalKey(string id)
        {
            return id switch
            {
                "capy.ide" => "CapyIDE",
                "capy.doc" => "CapyDoc",
                "capy.settings" => "Settings",
                "capy.store" => "CapyStore",
                "capy.love" => "CapyLove",
                _ => string.Empty
            };
        }

        public CapyMateViewModel CapyMate { get; }
        public CapyLoveViewModel CapyLove { get; }

        private void FocusCapyMate()
        {
            IsHomeVisible = true;
            IsStartMenuOpen = false;
            OnPropertyChanged(nameof(IsHomeVisible));
        }


    }
}

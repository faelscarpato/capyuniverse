using System;
using System.Collections.ObjectModel;
using System.Linq;
using CapyOS.Models;

namespace CapyOS.Services
{
    public class WorkspaceManagerService : IWorkspaceManager
    {
        private readonly SettingsService _settings;
        private readonly LoggingService _log;
        private WorkspaceModel _active = null!;

        public WorkspaceManagerService(SettingsService settings, LoggingService log)
        {
            _settings = settings;
            _log = log;
            Workspaces = new ObservableCollection<WorkspaceModel>();
        }

        public ObservableCollection<WorkspaceModel> Workspaces { get; }
        public WorkspaceModel ActiveWorkspace => _active;

        public WorkspaceModel CreateWorkspace(string name)
        {
            var ws = new WorkspaceModel { Name = name, Index = Workspaces.Count };
            Workspaces.Add(ws);
            if (_active == null) _active = ws;
            Persist();
            return ws;
        }

        public void SwitchWorkspace(int index)
        {
            var ws = Workspaces.FirstOrDefault(w => w.Index == index);
            if (ws != null) _active = ws;
        }

        public void MoveWindowToWorkspace(Guid windowId, int targetWorkspaceIndex)
        {
            try
            {
                var source = Workspaces.FirstOrDefault(w => w.Windows.Any(x => x.Id == windowId));
                var target = Workspaces.FirstOrDefault(w => w.Index == targetWorkspaceIndex);
                if (source == null || target == null) return;
                var win = source.Windows.First(x => x.Id == windowId);
                source.Windows.Remove(win);
                win.IsMinimized = false;
                win.IsActive = false;
                win.X = 40 + target.Windows.Count * 24;
                win.Y = 40 + target.Windows.Count * 24;
                target.Windows.Add(win);
                Persist();
                _log.Log("move", win.AppKey, win.Title, win.Id);
            }
            catch
            {
                _log.Log("move-error", "Workspace", "Failed to move window", windowId);
            }
        }

        public void Persist()
        {
            try
            {
                var s = _settings.Current;
                s.Workspaces = Workspaces.Select(ws => new WorkspaceState
                {
                    Id = ws.Id,
                    Name = ws.Name,
                    Index = ws.Index,
                    Windows = ws.Windows.Select(w => new AppWindowState
                    {
                        Id = w.Id,
                        AppKey = w.AppKey,
                        Title = w.Title,
                        Icon = w.Icon,
                        X = w.X,
                        Y = w.Y,
                        Width = w.Width,
                        Height = w.Height,
                        IsMinimized = w.IsMinimized
                    }).ToList()
                }).ToList();
                _settings.Save(s);
            }
            catch
            {
                _log.Log("persist-error", "Workspace", "Failed to save", Guid.Empty);
            }
        }

        public void RestoreFromSettings(AppSettings settings)
        {
            Workspaces.Clear();
            try
            {
                if (settings.Workspaces == null || settings.Workspaces.Count == 0)
                {
                    var ws = new WorkspaceModel { Name = "Work 1", Index = 0 };
                    var legacy = settings.Windows ?? new System.Collections.Generic.List<AppWindowState>();
                    foreach (var st in legacy)
                    {
                        var w = new AppWindowModel
                        {
                            Id = st.Id == Guid.Empty ? Guid.NewGuid() : st.Id,
                            AppKey = st.AppKey,
                            Title = st.Title,
                            Icon = st.Icon,
                            X = st.X,
                            Y = st.Y,
                            Width = st.Width,
                            Height = st.Height,
                            IsMinimized = st.IsMinimized,
                            ZIndex = ws.Windows.Count + 1
                        };
                        Clamp(w, settings);
                        ws.Windows.Add(w);
                    }
                    Workspaces.Add(ws);
                    _active = ws;
                    Persist();
                    return;
                }

                foreach (var wss in settings.Workspaces.OrderBy(x => x.Index))
                {
                    var ws = new WorkspaceModel { Id = wss.Id, Name = wss.Name, Index = wss.Index };
                    var wins = wss.Windows ?? new System.Collections.Generic.List<AppWindowState>();
                    foreach (var st in wins)
                    {
                        var w = new AppWindowModel
                        {
                            Id = st.Id == Guid.Empty ? Guid.NewGuid() : st.Id,
                            AppKey = st.AppKey,
                            Title = st.Title,
                            Icon = st.Icon,
                            X = st.X,
                            Y = st.Y,
                            Width = st.Width,
                            Height = st.Height,
                            IsMinimized = st.IsMinimized,
                            ZIndex = ws.Windows.Count + 1
                        };
                        Clamp(w, settings);
                        ws.Windows.Add(w);
                    }
                    Workspaces.Add(ws);
                }
                _active = Workspaces.FirstOrDefault() ?? CreateWorkspace("Work 1");
            }
            catch
            {
                ResetLayout(settings);
                _log.Log("restore-fallback", "Workspace", "Reset layout", Guid.Empty);
            }
        }

        private void ResetLayout(AppSettings settings)
        {
            try
            {
                Workspaces.Clear();
                var ws = new WorkspaceModel { Name = "Work 1", Index = 0 };
                Workspaces.Add(ws);
                _active = ws;
                settings.Workspaces = new System.Collections.Generic.List<WorkspaceState>
                {
                    new WorkspaceState { Id = ws.Id, Name = ws.Name, Index = ws.Index, Windows = new System.Collections.Generic.List<AppWindowState>() }
                };
                _settings.Save(settings);
            }
            catch
            {
                _log.Log("reset-error", "Workspace", "Failed to reset", Guid.Empty);
            }
        }

        private void Clamp(AppWindowModel w, AppSettings s)
        {
            var screenW = Math.Max(640, s.Width);
            var screenH = Math.Max(480, s.Height);
            if (double.IsNaN(w.Width) || w.Width <= 0) w.Width = 480;
            if (double.IsNaN(w.Height) || w.Height <= 0) w.Height = 320;
            if (double.IsNaN(w.X)) w.X = 40;
            if (double.IsNaN(w.Y)) w.Y = 40;
            if (w.X < 0) w.X = 40;
            if (w.Y < 0) w.Y = 40;
            if (w.X + w.Width > screenW) w.X = Math.Max(40, screenW - w.Width - 40);
            if (w.Y + w.Height > screenH) w.Y = Math.Max(40, screenH - w.Height - 40);
        }
    }
}

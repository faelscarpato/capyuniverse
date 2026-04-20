using System;
using System.Collections.ObjectModel;
using System.Linq;
using CapyOS.Models;

namespace CapyOS.Services
{
    public class WindowManagerService : IWindowManager
    {
        private readonly SettingsService _settings;
        private readonly LoggingService _log;
        private readonly IWorkspaceManager _workspaces;
        private int _nextZ = 1;

        public WindowManagerService(SettingsService settings, LoggingService log, IWorkspaceManager workspaces)
        {
            _settings = settings;
            _log = log;
            _workspaces = workspaces;
        }

        public ObservableCollection<AppWindowModel> Windows => _workspaces.ActiveWorkspace.Windows;

        public AppWindowModel OpenWindow(string appKey)
        {
            var existing = Windows.FirstOrDefault(w => w.AppKey == appKey);
            if (existing != null)
            {
                if (existing.IsMinimized) RestoreWindow(existing.Id);
                ActivateWindow(existing.Id);
                return existing;
            }
            var model = CreateModel(appKey);
            model.ZIndex = ++_nextZ;
            model.IsActive = true;
            Windows.Add(model);
            _workspaces.Persist();
            _log.Log("open", model.AppKey, model.Title, model.Id);
            return model;
        }

        public void CloseWindow(Guid id)
        {
            var w = Windows.FirstOrDefault(x => x.Id == id);
            if (w == null) return;
            Windows.Remove(w);
            _log.Log("close", w.AppKey, w.Title, w.Id);
            _workspaces.Persist();
            var top = Windows.OrderByDescending(x => x.ZIndex).FirstOrDefault();
            if (top != null) ActivateWindow(top.Id);
        }

        public void MinimizeWindow(Guid id)
        {
            var w = Windows.FirstOrDefault(x => x.Id == id);
            if (w == null) return;
            w.IsMinimized = true;
            w.IsActive = false;
            _log.Log("minimize", w.AppKey, w.Title, w.Id);
            _workspaces.Persist();
        }

        public void RestoreWindow(Guid id)
        {
            var w = Windows.FirstOrDefault(x => x.Id == id);
            if (w == null) return;
            w.IsMinimized = false;
            w.ZIndex = ++_nextZ;
            ActivateWindow(id);
            _log.Log("restore", w.AppKey, w.Title, w.Id);
            _workspaces.Persist();
        }

        public void ActivateWindow(Guid id)
        {
            foreach (var ww in Windows) ww.IsActive = ww.Id == id && !ww.IsMinimized;
            var w = Windows.FirstOrDefault(x => x.Id == id);
            if (w != null && !w.IsMinimized)
            {
                w.ZIndex = ++_nextZ;
                _log.Log("focus", w.AppKey, w.Title, w.Id);
            }
        }

        private AppWindowModel CreateModel(string appKey)
        {
            var title = appKey switch
            {
                "CapyIDE" => "Capy IDE",
                "CapyDoc" => "Capy Doc",
                "Settings" => "Settings",
                "CapyStore" => "CapyStore",
                _ => appKey
            };
            var icon = appKey switch
            {
                "CapyIDE" => "🧩",
                "CapyDoc" => "📄",
                "Settings" => "⚙",
                "CapyStore" => "🛍",
                _ => "📦"
            };
            return new AppWindowModel
            {
                Id = Guid.NewGuid(),
                AppKey = appKey,
                Title = title,
                Icon = icon,
                X = 40 + Windows.Count * 24,
                Y = 40 + Windows.Count * 24,
                Width = 540,
                Height = 360,
                IsMinimized = false
            };
        }

        public void RestoreFromSettings(AppSettings settings) { }
    }
}

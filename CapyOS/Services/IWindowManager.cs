using System;
using System.Collections.ObjectModel;
using CapyOS.Models;

namespace CapyOS.Services
{
    public interface IWindowManager
    {
        ObservableCollection<AppWindowModel> Windows { get; }
        AppWindowModel OpenWindow(string appKey);
        void CloseWindow(Guid id);
        void MinimizeWindow(Guid id);
        void RestoreWindow(Guid id);
        void ActivateWindow(Guid id);
    }
}

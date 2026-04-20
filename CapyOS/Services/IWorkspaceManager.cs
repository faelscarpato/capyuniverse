using System;
using System.Collections.ObjectModel;
using CapyOS.Models;

namespace CapyOS.Services
{
    public interface IWorkspaceManager
    {
        ObservableCollection<WorkspaceModel> Workspaces { get; }
        WorkspaceModel ActiveWorkspace { get; }
        WorkspaceModel CreateWorkspace(string name);
        void SwitchWorkspace(int index);
        void MoveWindowToWorkspace(Guid windowId, int targetWorkspaceIndex);
        void Persist();
        void RestoreFromSettings(CapyOS.Models.AppSettings settings);
    }
}

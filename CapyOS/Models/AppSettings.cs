namespace CapyOS.Models
{
    public enum AppTheme { Light, Dark }

    public class AppSettings
    {
        public AppTheme Theme { get; set; } = AppTheme.Light;
        public double Width { get; set; } = 920;
        public double Height { get; set; } = 600;
        public bool IsMaximized { get; set; } = false;
        public System.Collections.Generic.List<AppWindowState> Windows { get; set; } = new();
        public System.Collections.Generic.List<WorkspaceState> Workspaces { get; set; } = new();
    }

    public class AppWindowState
    {
        public System.Guid Id { get; set; }
        public string AppKey { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Icon { get; set; } = string.Empty;
        public double X { get; set; }
        public double Y { get; set; }
        public double Width { get; set; } = 480;
        public double Height { get; set; } = 320;
        public bool IsMinimized { get; set; }
    }

    public class WorkspaceState
    {
        public System.Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int Index { get; set; }
        public System.Collections.Generic.List<AppWindowState> Windows { get; set; } = new();
    }
}

using System.ComponentModel;
using System.Runtime.CompilerServices;

namespace CapyOS.Models
{
    public class CapyAppModel : INotifyPropertyChanged
    {
        public event PropertyChangedEventHandler? PropertyChanged;
        private void OnPropertyChanged([CallerMemberName] string? n = null) => PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(n));
        private bool SetProperty<T>(ref T storage, T value, [CallerMemberName] string? n = null)
        {
            if (Equals(storage, value)) return false;
            storage = value;
            OnPropertyChanged(n);
            return true;
        }

        private string _id = string.Empty;
        public string Id { get => _id; set => SetProperty(ref _id, value); }

        private string _name = string.Empty;
        public string Name { get => _name; set => SetProperty(ref _name, value); }

        private string _description = string.Empty;
        public string Description { get => _description; set => SetProperty(ref _description, value); }

        private string _category = string.Empty;
        public string Category { get => _category; set => SetProperty(ref _category, value); }

        private string _appType = "Internal";
        public string AppType { get => _appType; set => SetProperty(ref _appType, value); }

        private string _iconPath = string.Empty;
        public string IconPath { get => _iconPath; set => SetProperty(ref _iconPath, value); }

        private string _command = string.Empty;
        public string Command { get => _command; set => SetProperty(ref _command, value); }

        private string _arguments = string.Empty;
        public string Arguments { get => _arguments; set => SetProperty(ref _arguments, value); }

        private string _url = string.Empty;
        public string Url { get => _url; set => SetProperty(ref _url, value); }

        private bool _isPinnedDock;
        public bool IsPinnedDock { get => _isPinnedDock; set => SetProperty(ref _isPinnedDock, value); }

        private bool _isEnabled = true;
        public bool IsEnabled { get => _isEnabled; set => SetProperty(ref _isEnabled, value); }

        private bool _isFavorite;
        public bool IsFavorite { get => _isFavorite; set => SetProperty(ref _isFavorite, value); }

        private bool _isOpenInternal;
        public bool IsOpenInternal { get => _isOpenInternal; set => SetProperty(ref _isOpenInternal, value); }
    }
}

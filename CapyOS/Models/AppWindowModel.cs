using System;
using System.ComponentModel;
using System.Runtime.CompilerServices;

namespace CapyOS.Models
{
    public class AppWindowModel : INotifyPropertyChanged
    {
        public event PropertyChangedEventHandler? PropertyChanged;
        private void OnPropertyChanged([CallerMemberName] string? name = null) => PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
        private bool SetProperty<T>(ref T storage, T value, [CallerMemberName] string? name = null)
        {
            if (Equals(storage, value)) return false;
            storage = value;
            OnPropertyChanged(name);
            return true;
        }

        private Guid _id;
        public Guid Id { get => _id; set => SetProperty(ref _id, value); }

        private string _title = string.Empty;
        public string Title { get => _title; set => SetProperty(ref _title, value); }

        private string _appKey = string.Empty;
        public string AppKey { get => _appKey; set => SetProperty(ref _appKey, value); }

        private string _icon = string.Empty;
        public string Icon { get => _icon; set => SetProperty(ref _icon, value); }

        private bool _isActive;
        public bool IsActive { get => _isActive; set => SetProperty(ref _isActive, value); }

        private bool _isMinimized;
        public bool IsMinimized { get => _isMinimized; set => SetProperty(ref _isMinimized, value); }

        private double _x;
        public double X { get => _x; set => SetProperty(ref _x, value); }

        private double _y;
        public double Y { get => _y; set => SetProperty(ref _y, value); }

        private double _width = 480;
        public double Width { get => _width; set => SetProperty(ref _width, value); }

        private double _height = 320;
        public double Height { get => _height; set => SetProperty(ref _height, value); }

        private int _zIndex;
        public int ZIndex { get => _zIndex; set => SetProperty(ref _zIndex, value); }
    }
}

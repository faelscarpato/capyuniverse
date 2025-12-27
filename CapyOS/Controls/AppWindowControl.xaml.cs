using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using CapyOS.Models;
using CapyOS.ViewModels;

namespace CapyOS.Controls
{
    public partial class AppWindowControl : UserControl
    {
        private bool _drag;
        private Point _start;
        private double _origX;
        private double _origY;

        public AppWindowControl()
        {
            InitializeComponent();
            PreviewMouseDown += OnPreviewMouseDown;
            Loaded += OnLoaded;
        }

        private void OnLoaded(object? sender, RoutedEventArgs e)
        {
            Header.MouseLeftButtonDown += OnDragStart;
            Header.MouseMove += OnDragMove;
            Header.MouseLeftButtonUp += OnDragEnd;
        }

        private void OnPreviewMouseDown(object sender, MouseButtonEventArgs e)
        {
            if (DataContext is AppWindowModel m && Application.Current.MainWindow?.DataContext is MainViewModel vm)
            {
                vm.ActivateWindowCommand.Execute(m);
            }
        }

        private void OnDragStart(object sender, MouseButtonEventArgs e)
        {
            if (DataContext is AppWindowModel m)
            {
                _drag = true;
                _start = e.GetPosition(Application.Current.MainWindow);
                _origX = m.X;
                _origY = m.Y;
                CaptureMouse();
            }
        }

        private void OnDragMove(object sender, MouseEventArgs e)
        {
            if (_drag && DataContext is AppWindowModel m)
            {
                var p = e.GetPosition(Application.Current.MainWindow);
                m.X = _origX + (p.X - _start.X);
                m.Y = _origY + (p.Y - _start.Y);
            }
        }

        private void OnDragEnd(object sender, MouseButtonEventArgs e)
        {
            if (_drag && DataContext is AppWindowModel m && Application.Current.MainWindow?.DataContext is MainViewModel vm)
            {
                _drag = false;
                ReleaseMouseCapture();
                vm.NotifyWindowPositionChangedCommand.Execute(m);
            }
        }
    }
}

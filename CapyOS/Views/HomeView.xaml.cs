using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;

namespace CapyOS.Views
{
    public partial class HomeView : UserControl
    {
        public HomeView()
        {
            InitializeComponent();
            IsVisibleChanged += OnIsVisibleChanged;
        }

        private void OnIsVisibleChanged(object sender, DependencyPropertyChangedEventArgs e)
        {
            if (IsVisible)
            {
                CapyMateInput.Focus();
                Keyboard.Focus(CapyMateInput);
            }
        }
    }
}

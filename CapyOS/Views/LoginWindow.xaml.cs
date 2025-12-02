using System.Windows;

namespace CapyOS.Views
{
    public partial class LoginWindow : Window
    {
        public LoginWindow()
        {
            InitializeComponent();
        }

        private void OnCancel(object sender, RoutedEventArgs e)
        {
            DialogResult = false;
        }

        private void OnLogin(object sender, RoutedEventArgs e)
        {
            if (DataContext is ViewModels.LoginViewModel vm)
            {
                var ok = vm.TryLogin(Pwd.Password);
                DialogResult = ok;
            }
        }
    }
}

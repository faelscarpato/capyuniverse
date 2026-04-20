using System.Windows.Controls;

namespace CapyOS.Views
{
    public partial class CapyStoreView : UserControl
    {
        public CapyStoreView()
        {
            InitializeComponent();
            if (System.Windows.Application.Current.MainWindow?.DataContext is ViewModels.MainViewModel vm)
            {
                DataContext = new ViewModels.CapyStoreViewModel(vm);
            }
        }
    }
}

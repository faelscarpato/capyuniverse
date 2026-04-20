using CapyOS.ViewModels;
using CapyOS.Services;

namespace CapyOS.ViewModels
{
    public class LoginViewModel : BaseViewModel
    {
        private readonly SessionService _session;
        public LoginViewModel(SessionService session)
        {
            _session = session;
        }

        private string _username = string.Empty;
        public string Username { get => _username; set => SetProperty(ref _username, value); }

        public bool TryLogin(string password)
        {
            return _session.Authenticate(Username, password);
        }
    }
}

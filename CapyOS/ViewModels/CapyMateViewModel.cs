using System;
using System.Collections.ObjectModel;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using System.Threading.Tasks;
using System.Windows.Input;
using CapyOS.Commands;
using CapyOS.Models;
using CapyOS.Services;

namespace CapyOS.ViewModels
{
    public class CapyMateViewModel : BaseViewModel
    {
        private readonly ICapyMateService _service;
        private readonly LoggingService _logger;
        private readonly string _folder;
        private readonly string _file;

        public CapyMateViewModel(ICapyMateService service, LoggingService logger)
        {
            _service = service;
            _logger = logger;
            Messages = new ObservableCollection<CapyMateMessage>();
            var appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
            _folder = Path.Combine(appData, "CapyOS");
            _file = Path.Combine(_folder, "capymate-history.json");

            SendMessageCommand = new RelayCommand(async _ => await SendAsync(), _ => !string.IsNullOrWhiteSpace(CurrentInput) && !IsBusy);
            ClearChatCommand = new RelayCommand(_ => { Messages.Clear(); SaveHistory(); });

            LoadHistory();
            if (Messages.Count == 0)
            {
                Messages.Add(new CapyMateMessage { Role = "assistant", Text = "Olá! Eu sou o CapyMate (stub). Como posso ajudar?", Timestamp = DateTime.Now });
            }
        }

        public ObservableCollection<CapyMateMessage> Messages { get; }

        private string _currentInput = string.Empty;
        public string CurrentInput { get => _currentInput; set { if (SetProperty(ref _currentInput, value)) { (SendMessageCommand as RelayCommand)?.RaiseCanExecuteChanged(); } } }

        private bool _busy;
        public bool IsBusy { get => _busy; set { if (SetProperty(ref _busy, value)) { (SendMessageCommand as RelayCommand)?.RaiseCanExecuteChanged(); } } }

        public ICommand SendMessageCommand { get; }
        public ICommand ClearChatCommand { get; }

        private async Task SendAsync()
        {
            var text = CurrentInput?.Trim() ?? string.Empty;
            if (string.IsNullOrEmpty(text)) return;
            var userMsg = new CapyMateMessage { Role = "user", Text = text, Timestamp = DateTime.Now };
            Messages.Add(userMsg);
            CurrentInput = string.Empty;
            IsBusy = true;
            try
            {
                // Pass a copy of the history
                var reply = await _service.SendAsync(userMsg.Text, new List<CapyMateMessage>(Messages));
                Messages.Add(reply);
                SaveHistory();
            }
            catch (Exception ex)
            {
                _logger.Log("capymate-error", "assistant", ex.Message, Guid.NewGuid());
                Messages.Add(new CapyMateMessage { Role = "assistant", Text = "Ocorreu um erro interno.", Timestamp = DateTime.Now });
                SaveHistory();
            }
            finally
            {
                IsBusy = false;
            }
        }

        public void LoadHistory()
        {
            try
            {
                if (!File.Exists(_file)) return;
                var json = File.ReadAllText(_file);
                var list = JsonSerializer.Deserialize<List<CapyMateMessage>>(json) ?? new List<CapyMateMessage>();
                Messages.Clear();
                foreach (var m in list) Messages.Add(m);
            }
            catch (Exception ex)
            {
                _logger.Log("capymate-history-load-error", _file, ex.Message, Guid.NewGuid());
            }
        }

        public void SaveHistory()
        {
            try
            {
                Directory.CreateDirectory(_folder);
                var list = new List<CapyMateMessage>(Messages);
                var json = JsonSerializer.Serialize(list, new JsonSerializerOptions { WriteIndented = true });
                File.WriteAllText(_file, json);
            }
            catch (Exception ex)
            {
                _logger.Log("capymate-history-save-error", _file, ex.Message, Guid.NewGuid());
            }
        }
    }
}

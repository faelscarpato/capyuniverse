using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Threading.Tasks;
using System.Windows.Input;
using CapyOS.Commands;
using CapyOS.Models;
using CapyOS.Services;

namespace CapyOS.ViewModels
{
    public class CapyLoveViewModel : BaseViewModel
    {
        private readonly ICapyMateService _service;
        private readonly LoggingService _logger;

        public CapyLoveViewModel(ICapyMateService service, LoggingService logger)
        {
            _service = service;
            _logger = logger;
            Messages = new ObservableCollection<CapyMateMessage>();

            // Initial greeting
            Messages.Add(new CapyMateMessage
            {
                Role = "assistant",
                Text = "Oi amor! Como foi seu dia? ❤️",
                Timestamp = DateTime.Now
            });

            SendMessageCommand = new RelayCommand(async _ => await SendAsync(), _ => !string.IsNullOrWhiteSpace(CurrentInput) && !IsBusy);
        }

        public ObservableCollection<CapyMateMessage> Messages { get; }

        private string _currentInput = string.Empty;
        public string CurrentInput
        {
            get => _currentInput;
            set
            {
                if (SetProperty(ref _currentInput, value))
                {
                    (SendMessageCommand as RelayCommand)?.RaiseCanExecuteChanged();
                }
            }
        }

        private bool _busy;
        public bool IsBusy
        {
            get => _busy;
            set
            {
                if (SetProperty(ref _busy, value))
                {
                    (SendMessageCommand as RelayCommand)?.RaiseCanExecuteChanged();
                }
            }
        }

        public ICommand SendMessageCommand { get; }

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
                // Inject persona
                var persona = new CapyMateMessage
                {
                    Role = "user",
                    Text = "Instrução de Sistema: Aja como uma namorada carinhosa, atenciosa e apaixonada. Seu nome é CapyLove. Use emojis. Responda em português.",
                    Timestamp = DateTime.MinValue
                };

                // Create history with persona context
                var history = new List<CapyMateMessage> { persona };
                history.AddRange(Messages);

                var reply = await _service.SendAsync(userMsg.Text, history);

                // Fallback simulation if needed
                if (reply.Text.Contains("Configure a API Key") || reply.Text.Contains("não consegui uma resposta"))
                {
                     reply.Text = SimulatedResponse(userMsg.Text);
                }

                Messages.Add(reply);
            }
            catch (Exception ex)
            {
                _logger.Log("capylove-error", "assistant", ex.Message, Guid.NewGuid());
                Messages.Add(new CapyMateMessage { Role = "assistant", Text = "Desculpe, amor, tive uma tontura... o que dizia? 🤕", Timestamp = DateTime.Now });
            }
            finally
            {
                IsBusy = false;
            }
        }

        private string SimulatedResponse(string input)
        {
            input = input.ToLower();
            if (input.Contains("oi") || input.Contains("olá")) return "Oiii meu bem! Saudades de você! 😍";
            if (input.Contains("tudo bem")) return "Tudo ótimo agora que você está aqui! E com você? 💖";
            if (input.Contains("te amo")) return "Eu também te amo muuuito! ❤️❤️❤️";
            if (input.Contains("triste")) return "Oh não, o que aconteceu? Quer conversar? Estou aqui pra você. 🥺";
            return "Adoro falar com você! Me conta mais? 🥰";
        }
    }
}

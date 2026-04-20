using System;
using System.IO;
using System.Threading;

namespace CapyOS.Services
{
    public class LoggingService
    {
        private readonly string _folder;
        private readonly string _file;
        private readonly SemaphoreSlim _lock = new(1,1);

        public LoggingService()
        {
            var appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
            _folder = Path.Combine(appData, "CapyOS", "logs");
            _file = Path.Combine(_folder, "events.log");
            Directory.CreateDirectory(_folder);
        }

        public void Log(string evt, string appKey, string title, Guid id)
        {
            _lock.Wait();
            try
            {
                var line = $"{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}\t{evt}\t{appKey}\t{title}\t{id}";
                if (!File.Exists(_file)) File.WriteAllText(_file, line + Environment.NewLine);
                else
                {
                    var info = new FileInfo(_file);
                    if (info.Length > 2_000_000) File.Move(_file, Path.Combine(_folder, $"events_{DateTime.Now:yyyyMMddHHmmss}.log"));
                    File.AppendAllText(_file, line + Environment.NewLine);
                }
            }
            finally
            {
                _lock.Release();
            }
        }
    }
}

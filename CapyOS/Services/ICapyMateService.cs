using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using CapyOS.Models;

namespace CapyOS.Services
{
    public interface ICapyMateService
    {
        Task<CapyMateMessage> SendAsync(string userMessage, IEnumerable<CapyMateMessage> history = null, CancellationToken ct = default);
    }
}

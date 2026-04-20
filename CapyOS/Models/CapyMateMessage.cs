using System;

namespace CapyOS.Models
{
    public class CapyMateMessage
    {
        public string Role { get; set; } = string.Empty;
        public string Text { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; } = DateTime.Now;
    }
}

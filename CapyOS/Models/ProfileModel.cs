using System.Collections.Generic;
using CapyOS.Models;

namespace CapyOS.Models
{
    public class ProfileModel
    {
        public string Username { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string AvatarPath { get; set; } = string.Empty;
        public AppTheme Theme { get; set; } = AppTheme.Light;
        public List<string> FavoriteAppIds { get; set; } = new();
        public int LastWorkspaceIndex { get; set; } = 0;
    }
}

using System;
using System.Collections.ObjectModel;

namespace CapyOS.Models
{
    public class WorkspaceModel
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Name { get; set; } = string.Empty;
        public int Index { get; set; }
        public ObservableCollection<AppWindowModel> Windows { get; set; } = new();
    }
}

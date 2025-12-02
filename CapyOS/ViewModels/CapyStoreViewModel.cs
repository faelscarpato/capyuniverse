using System;
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Linq;
using System.Windows.Data;
using System.Threading.Tasks;
using CapyOS.Commands;
using CapyOS.Models;
using CapyOS.Services;

namespace CapyOS.ViewModels
{
    public class CapyStoreViewModel : BaseViewModel
    {
        private readonly MainViewModel _main;
        private readonly ICapyAppCatalogService _catalog;
        private readonly LoggingService _log;

        public CapyStoreViewModel(MainViewModel main)
        {
            _main = main;
            _catalog = main.CatalogService;
            _log = main.Logger;
            Apps = new ObservableCollection<CapyAppModel>(_main.CatalogApps);
            AppsView = CollectionViewSource.GetDefaultView(Apps);
            AppsView.Filter = Filter;
            Categories = new ObservableCollection<string>(Apps.Select(a => a.Category).Distinct().OrderBy(x => x).Prepend("Todos"));
            SelectedCategory = "Todos";
            ExecuteAppCommand = new RelayCommand(a => { if (a is CapyAppModel m) _main.OpenAppById(m.Id); });
            TogglePinCommand = new RelayCommand(a =>
            {
                if (a is CapyAppModel m)
                {
                    m.IsPinnedDock = !m.IsPinnedDock;
                    Task.Run(() => _catalog.SaveAppsAsync(Apps));
                    _log.Log("pin", m.Id, m.Name, Guid.NewGuid());
                    _main.RefreshDockFromCatalog();
                }
            });
            ToggleFavoriteCommand = new RelayCommand(a =>
            {
                if (a is CapyAppModel m)
                {
                    m.IsFavorite = !m.IsFavorite;
                    Task.Run(() => _catalog.SaveAppsAsync(Apps));
                    _log.Log("favorite", m.Id, m.Name, Guid.NewGuid());
                }
            });
            SearchQuery = string.Empty;
        }

        public ObservableCollection<CapyAppModel> Apps { get; }
        public ICollectionView AppsView { get; }
        public ObservableCollection<string> Categories { get; }

        private string _selectedCategory = "Todos";
        public string SelectedCategory { get => _selectedCategory; set { if (SetProperty(ref _selectedCategory, value)) AppsView.Refresh(); } }

        private string _searchQuery = string.Empty;
        public string SearchQuery { get => _searchQuery; set { if (SetProperty(ref _searchQuery, value)) AppsView.Refresh(); } }

        public RelayCommand ExecuteAppCommand { get; }
        public RelayCommand TogglePinCommand { get; }
        public RelayCommand ToggleFavoriteCommand { get; }

        private bool Filter(object obj)
        {
            if (obj is not CapyAppModel m) return false;
            if (SelectedCategory != "Todos" && !string.Equals(m.Category, SelectedCategory, StringComparison.OrdinalIgnoreCase)) return false;
            if (!string.IsNullOrWhiteSpace(SearchQuery) && !(m.Name?.Contains(SearchQuery, StringComparison.OrdinalIgnoreCase) == true)) return false;
            return true;
        }
    }
}

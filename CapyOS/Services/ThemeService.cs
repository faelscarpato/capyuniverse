using System;
using System.Linq;
using System.Windows;
using CapyOS.Models;

namespace CapyOS.Services
{
    public class ThemeService
    {
        private const string LightSource = "Resources/Themes/Light.xaml";
        private const string DarkSource = "Resources/Themes/Dark.xaml";
        private ResourceDictionary? _current;

        public void ApplyTheme(AppTheme theme)
        {
            var source = new Uri(theme == AppTheme.Dark ? DarkSource : LightSource, UriKind.Relative);
            var rd = new ResourceDictionary { Source = source };
            var merged = Application.Current.Resources.MergedDictionaries;
            var existing = merged.FirstOrDefault(d => d.Source?.OriginalString == LightSource || d.Source?.OriginalString == DarkSource);
            if (existing != null) merged.Remove(existing);
            merged.Insert(0, rd);
            _current = rd;
        }

        public AppTheme CurrentTheme
        {
            get
            {
                var s = _current?.Source?.OriginalString;
                return s == DarkSource ? AppTheme.Dark : AppTheme.Light;
            }
        }
    }
}

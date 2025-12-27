using System.Windows;
using System.Windows.Controls;
using CapyOS.Models;

namespace CapyOS.Selectors
{
    public class AppContentTemplateSelector : DataTemplateSelector
    {
        public DataTemplate? CapyIDE { get; set; }
        public DataTemplate? CapyDoc { get; set; }
        public DataTemplate? Settings { get; set; }
        public DataTemplate? CapyStore { get; set; }
        public DataTemplate? CapyLove { get; set; }

        public override DataTemplate SelectTemplate(object item, DependencyObject container)
        {
            if (item is AppWindowModel m)
            {
                return m.AppKey switch
                {
                    "CapyIDE" => CapyIDE ?? base.SelectTemplate(item, container),
                    "CapyDoc" => CapyDoc ?? base.SelectTemplate(item, container),
                    "Settings" => Settings ?? base.SelectTemplate(item, container),
                    "CapyStore" => CapyStore ?? base.SelectTemplate(item, container),
                    "CapyLove" => CapyLove ?? base.SelectTemplate(item, container),
                    _ => base.SelectTemplate(item, container)
                };
            }
            return base.SelectTemplate(item, container);
        }
    }
}

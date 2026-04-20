using System.Collections.Generic;
using System.Threading.Tasks;
using CapyOS.Models;

namespace CapyOS.Services
{
    public interface ICapyAppCatalogService
    {
        Task<IList<CapyAppModel>> LoadAppsAsync();
        Task SaveAppsAsync(IEnumerable<CapyAppModel> apps);
    }
}

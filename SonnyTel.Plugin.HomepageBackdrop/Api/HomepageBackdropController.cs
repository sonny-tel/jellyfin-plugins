using System.Net.Mime;
using System.Reflection;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace SonnyTel.Plugin.HomepageBackdrop.Api;

/// <summary>
/// Controller that serves the client-side JavaScript for homepage backdrop cycling.
/// </summary>
[ApiController]
[Route("HomepageBackdrop")]
public class HomepageBackdropController : ControllerBase
{
    /// <summary>
    /// Serves the embedded homepage backdrop client script.
    /// </summary>
    /// <returns>The JavaScript file content.</returns>
    [HttpGet("ClientScript")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public ActionResult GetClientScript()
    {
        var assembly = Assembly.GetExecutingAssembly();
        var resourceName = "SonnyTel.Plugin.HomepageBackdrop.Web.homepageBackdrop.js";

        var stream = assembly.GetManifestResourceStream(resourceName);
        if (stream is null)
        {
            return NotFound();
        }

        return File(stream, "application/javascript");
    }
}

import http.client
import ipaddress
import re
import socket
import ssl
import urllib.error
import urllib.parse
import urllib.request

from app.models import Project

REQUEST_TIMEOUT_SECONDS = 5
GITHUB_REPOSITORY_PATTERN = re.compile(r"^/([A-Za-z0-9_.-]+)/([A-Za-z0-9_.-]+)/?$")


class _NoRedirectHandler(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, new_url):
        return None


def verify_github_repository(url: str) -> bool:
    parsed = urllib.parse.urlsplit(url)
    try:
        port = parsed.port
    except ValueError:
        return False
    if (
        parsed.scheme != "https"
        or parsed.hostname != "github.com"
        or parsed.username is not None
        or parsed.password is not None
        or port not in (None, 443)
    ):
        return False
    match = GITHUB_REPOSITORY_PATTERN.fullmatch(parsed.path.removesuffix(".git"))
    if match is None:
        return False

    owner, repository = match.groups()
    api_url = (
        "https://api.github.com/repos/"
        f"{urllib.parse.quote(owner, safe='')}/{urllib.parse.quote(repository, safe='')}"
    )
    request = urllib.request.Request(
        api_url,
        headers={"Accept": "application/vnd.github+json", "User-Agent": "MANAK"},
        method="GET",
    )
    opener = urllib.request.build_opener(_NoRedirectHandler)
    try:
        with opener.open(request, timeout=REQUEST_TIMEOUT_SECONDS) as response:
            return response.status == 200
    except (urllib.error.URLError, TimeoutError, OSError, http.client.HTTPException):
        return False


def _resolve_public_address(hostname: str, port: int) -> str | None:
    try:
        addresses = socket.getaddrinfo(hostname, port, type=socket.SOCK_STREAM)
    except socket.gaierror:
        return None
    for address in addresses:
        ip = ipaddress.ip_address(address[4][0])
        if not ip.is_global:
            return None
    return addresses[0][4][0] if addresses else None


def _check_live_site(url: str) -> bool:
    parsed = urllib.parse.urlsplit(url)
    if (
        parsed.scheme not in ("http", "https")
        or not parsed.hostname
        or parsed.username is not None
        or parsed.password is not None
    ):
        return False
    try:
        port = parsed.port or (443 if parsed.scheme == "https" else 80)
        hostname = parsed.hostname.encode("idna").decode("ascii")
    except (UnicodeError, ValueError):
        return False
    expected_port = 443 if parsed.scheme == "https" else 80
    if port != expected_port:
        return False

    # Pin the socket to a validated public IP and do not follow redirects.
    address = _resolve_public_address(hostname, port)
    if address is None:
        return False
    target = parsed.path or "/"
    if parsed.query:
        target += f"?{parsed.query}"

    try:
        raw_socket = socket.create_connection((address, port), timeout=REQUEST_TIMEOUT_SECONDS)
        if parsed.scheme == "https":
            context = ssl.create_default_context()
            connection_socket = context.wrap_socket(raw_socket, server_hostname=hostname)
            connection = http.client.HTTPConnection(hostname, port, timeout=REQUEST_TIMEOUT_SECONDS)
            connection.sock = connection_socket
        else:
            connection = http.client.HTTPConnection(hostname, port, timeout=REQUEST_TIMEOUT_SECONDS)
            connection.sock = raw_socket
        try:
            connection.request(
                "GET",
                target,
                headers={"Host": hostname, "Range": "bytes=0-0", "Connection": "close"},
            )
            response = connection.getresponse()
            return 200 <= response.status < 400
        finally:
            connection.close()
    except (OSError, ssl.SSLError, http.client.HTTPException):
        return False


def verify_project_links(project: Project) -> dict[str, bool]:
    return {
        "github_verified": verify_github_repository(project.github_url),
        "live_verified": _check_live_site(project.live_url) if project.live_url is not None else False,
    }

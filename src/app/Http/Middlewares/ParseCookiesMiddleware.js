export default function ParseCookiesMiddleware(request, response, next) {
    const cookieHeader = request.headers.cookie;
    request.cookies = {};

    if (cookieHeader) {
        cookieHeader.split(';').forEach((cookie) => {
            const [name, value] = cookie.split('=');
            request.cookies[name.trim()] = decodeURIComponent(value.trim());
        });
    }

    next();
}

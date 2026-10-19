export default {
  fetch(request) {
    const url = new URL(request.url);
    const host = url.hostname.replace(/^www\./, '');
    return Response.redirect(`https://${host}${url.pathname}${url.search}`, 301);
  },
};

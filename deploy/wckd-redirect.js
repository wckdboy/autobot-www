export default {
  fetch(request) {
    const url = new URL(request.url);
    const target = `https://sovware.io${url.pathname}${url.search}`;
    return Response.redirect(target, 301);
  },
};

export default async (request, context) => {
  const url = new URL(request.url)

  // Look for the query parameter, and return if we don't find it
  if (url.searchParams.get('go-get') == '1') {
    return new Response(`
<html>
  <head>
    <meta name="go-import" content="docs.kubesphere-carryon.top${url.pathname} git https://github.com/whenegghitsrock${url.pathname}">
    <meta name="go-source" content="docs.kubesphere-carryon.top${url.pathname} _ https://github.com/whenegghitsrock${url.pathname} https://github.com/whenegghitsrock${url.pathname}/tree/master/{/dir} https://github.com/whenegghitsrock${url.pathname}/blob/master/{/dir}/{/file}#L{/line}">
  </head>
</html>`)
  }

  return
}

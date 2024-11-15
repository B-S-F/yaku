# Use with proxy

Yaku CLI offers proxy support, allowing users to manually configure the environment variables `http_proxy`/`HTTP_PROXY` or `https_proxy`/`HTTPS_PROXY` to suit their specific requirements.

```bash
export HTTPS_PROXY='https://example.com'
export HTTP_PROXY='http://example.com'
export https_proxy='https://example.com'
export http_proxy='http://example.com'
```

Additionally, the `no_proxy`/`NO_PROXY` environment variables are supported. In all cases, the lowercase variables take precedence.

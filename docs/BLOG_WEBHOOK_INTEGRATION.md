# Blog Publishing Webhook

## Plugin configuration

Use the following values in the publishing plugin:

| Plugin field | Value |
| --- | --- |
| Website framework | Custom development framework Webhook |
| Domain | `https://www.cowinsupply.com` |
| Custom-framework verification and publish address | `https://www.cowinsupply.com` |
| Direct / general-framework publish endpoint | `https://www.cowinsupply.com/api/webhook/send_article` |
| Request method | `POST` |
| Content type | `application/x-www-form-urlencoded` |
| API_KEY | The value of Vercel production environment variable `WEBHOOK_ARTICLE_SIGN` |
| Backend login account | `admin` |
| Note | `blog article publishing` |
| Validation category ID | `blog` |

## Request fields

`sign`, `class_id`, `title`, `content`, `author_id`, and `image_url` are accepted. `title` and `content` are required. Set `class_id=blog` and `author_id=admin` unless the plugin has a different approved author identifier.

The endpoint accepts URL-encoded form data as required by the plugin. JSON is also supported for technical testing only.

For the custom-framework plugin, `POST /` internally forwards to the publishing endpoint while `GET /` still serves the homepage. The plugin may send only `sign` and `class_id`, or short placeholder title/content, for verification. A valid verification request returns `{"code":1,"msg":"验证成功"}` and never writes an article. Complete article fields are required for publication.

## Success and failure response

Success returns HTTP 200 with `{"code":1,"msg":"发布成功"}` and the published article `slug` and `url`. A repeat delivery with the same title and content is idempotent and returns success without creating a duplicate article.

Failure returns HTTP 200 with `{"code":0,"msg":"失败原因"}`. The response message identifies missing fields, an invalid API key, invalid image URL, or a safe generic publication error.

## Security and operations

- `WEBHOOK_ARTICLE_SIGN` is a long-lived random secret stored only in Vercel production environment settings. It is not committed to source control.
- The endpoint validates the secret with a constant-time comparison, rejects unsupported image protocols, limits payload size, and strips executable HTML from article content.
- Each successful publication writes the real Blog item to the configured PostgreSQL store, refreshes the sitemap, and creates an audit log entry.
- Existing Blog content is never deleted by this endpoint. Existing Blog articles remain available for manual management.

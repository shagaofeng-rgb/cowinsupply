# Blog Publishing Webhook

## Plugin configuration

Use the following values in the publishing plugin:

| Plugin field | Value |
| --- | --- |
| Website framework | Custom development framework Webhook |
| Domain | `https://www.cowinsupply.com` |
| Publish endpoint | `https://www.cowinsupply.com/api/webhook/send_article` |
| Request method | `POST` |
| Content type | `application/x-www-form-urlencoded` |
| API_KEY | The value of Vercel production environment variable `BLOG_WEBHOOK_API_KEY` |
| Backend login account | `admin` |
| Note | `blog article publishing` |
| Validation category ID | `blog` |

## Request fields

`sign`, `class_id`, `title`, `content`, `author_id`, and `image_url` are accepted. `title` and `content` are required. Set `class_id=blog` and `author_id=admin` unless the plugin has a different approved author identifier.

The endpoint accepts URL-encoded form data as required by the plugin. JSON is also supported for technical testing only.

## Success and failure response

Success returns HTTP 200 with `{"code":1,"msg":"Published successfully"}` and the published article `slug` and `url`. A repeat delivery with the same title and content is idempotent and returns success without creating a duplicate article.

Failure returns HTTP 200 with `{"code":0,"msg":"..."}`. The response message identifies missing fields, an invalid API key, invalid image URL, or a safe generic publication error.

## Security and operations

- `BLOG_WEBHOOK_API_KEY` is a long-lived random secret stored only in Vercel production environment settings. It is not committed to source control.
- The endpoint validates the secret with a constant-time comparison, rejects unsupported image protocols, limits payload size, and strips executable HTML from article content.
- Each successful publication writes the real Blog item to the configured PostgreSQL store, refreshes the sitemap, and creates an audit log entry.
- Existing Blog content is never deleted by this endpoint. Existing Blog articles remain available for manual management.

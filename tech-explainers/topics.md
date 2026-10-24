# Topic list: "expert in under 1 minute"

**This is the canonical order. Make episodes in list order (next = the first one not done) unless the owner picks another.**

Every episode: **POV hook** → "expert level, in under a minute" card → 4–6 concept scenes → recap → follow → share ("send this to a friend…"). Captions throughout. Under 60s.

## Done before the list
| Topic | Hook | Status |
|---|---|---|
| Load balancers | POV: your app just went viral | Rendered (55.1s, male VO), no captions/share yet |

## The list
| # | Topic | POV hook | Visual idea | Status |
|---|---|---|---|---|
| **System design** |||||
| 1 | Caching | POV: your homepage takes 4 seconds to load | Requests skip the slow DB and hit the cache; hit vs miss | ✅ Rendered (51.8s) |
| 2 | Database indexes | POV: your database just hit a million rows | Full table scan vs index lookup | ✅ Rendered (48.4s: no recap, follow + share, loop, real timings) |
| 3 | Rate limiting | POV: one user is hammering your API | Token bucket drains/refills, excess bounces with 429 | ✅ v1 rendered (53.5s) · v2 draft with captions + share (57.4s), needs final render |
| 4 | CDNs | POV: your users in Australia say your site is slow | World map, edge servers light up near users | ✅ Rendered (50.6s) |
| 5 | Message queues | POV: your checkout crashes every Black Friday | Orders pile into a queue, workers pull at their own pace | ⏭ **Next** |
| 6 | Database sharding | POV: one database can't hold all your users | Users split by ID into shards | |
| 7 | Replication (read replicas) | POV: your database is drowning in reads | Primary takes writes, replicas serve reads, show lag | |
| 8 | Horizontal vs vertical scaling | POV: you need to handle 10x the traffic | One server inflating vs cloning into many | |
| 9 | Microservices vs monolith | POV: one bug just took down your whole app | A block cracking into services | |
| 10 | CAP theorem | POV: the network between your data centres just broke | Pick two of three, visualised | |
| 11 | Consistent hashing | POV: you added one server and every cache key moved | Hash ring, keys only move to the neighbour | |
| 12 | Idempotency | POV: your customer got charged twice | Retried request with vs without an idempotency key | |
| **How the internet works** |||||
| 13 | DNS | POV: you type google.com and press enter | Resolver → root → TLD → nameserver | |
| 14 | HTTPS / TLS | POV: you're on café Wi-Fi typing your password | Handshake + padlock, plain text → scrambled | |
| 15 | TCP vs UDP | POV: your video call is lagging | Ordered packets with acks vs fire-and-forget | |
| 16 | WebSockets | POV: your chat app refreshes every second | Polling vs one open connection | |
| 17 | What happens when you load a webpage | POV: you click a link | The whole journey in 60s | |
| **Security** |||||
| 18 | Password hashing | POV: your database just got leaked | Plain text vs salted hashes | |
| 19 | JWTs vs sessions | POV: you stay logged in for a month | Token vs session cookie | |
| 20 | SQL injection | POV: someone typed a weird name into your login form | The query breaking open, then fixed with parameterised queries | |
| 21 | OAuth | POV: you clicked "Continue with Google" | The redirect dance | |
| 22 | DDoS attacks | POV: a million bots hit your site at once | Pairs with load balancers + rate limiting | |
| **AI** |||||
| 23 | How LLMs work | POV: you just asked ChatGPT a question | Tokens → live next-token probability chart → loop; temperature | |
| 24 | RAG | POV: your chatbot keeps making things up | Retrieve the right docs before answering | |
| 25 | Embeddings / vector databases | POV: you searched "cheap flights" and found "budget airfare" | Words as points in space | |
| 26 | AI agents | POV: your AI just booked your appointment for you | Think → use a tool → check result loop | |
| 27 | Fine-tuning vs prompting | POV: your AI doesn't sound like your brand | | |
| **Dev workflow** |||||
| 28 | Git branching | POV: you and a teammate edited the same file | Branches + a merge conflict | |
| 29 | Docker containers | POV: "it works on my machine" | The app shipped inside its own box | |
| 30 | CI/CD | POV: you pushed on a Friday at 5pm | Pipeline: test → build → deploy → rollback | |

## Notes
- The 23 October one-off on the PHP2Shell vulnerability news was dropped: a safety check blocked it twice, even as a news-only version. Don't retry that topic.
- Results log (add after each post: views, 3s hold, avg watch, saves, shares, where the retention graph drops):
